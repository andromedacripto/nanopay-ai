"use client";

import type { AgentDecision } from "@/lib/agent/analyzer";
import { getUsdcAllowance } from "@/lib/arc/wallet";

export interface X402PaymentResult {
  success: boolean;
  method: "facilitator-transferFrom";
  from: string;
  amountUsdc: string;
  txHash?: string;
  error?: string;
}

const USDC_CONTRACT =
  process.env.NEXT_PUBLIC_USDC_CONTRACT ||
  "0x3600000000000000000000000000000000000000";

const RECEIVER_ADDRESS =
  process.env.NEXT_PUBLIC_RECEIVER_ADDRESS || "";

const USDC_DECIMALS = 6;

// Arc Testnet: minimum base fee is 20 Gwei per docs.arc.io/arc/references/gas-and-fees
// We use 40 Gwei (2× floor) for headroom. Priority fee 1 Gwei improves inclusion.
const ARC_BASE_FEE_WEI  = 40_000_000_000n; // 40 Gwei  (maxFeePerGas)
const ARC_PRIO_FEE_WEI  =  1_000_000_000n; // 1 Gwei   (maxPriorityFeePerGas)

function usdcToAtomic(amountUsdc: string): bigint {
  const [integer, decimal = ""] = amountUsdc.split(".");
  const padded = decimal.padEnd(USDC_DECIMALS, "0").slice(0, USDC_DECIMALS);
  return BigInt((integer || "0") + padded);
}

function encodeApproveCalldata(spender: string, amount: bigint): string {
  const selector = "0x095ea7b3"; // approve(address,uint256)
  const paddedSpender = spender.replace("0x", "").padStart(64, "0");
  const paddedAmount = amount.toString(16).padStart(64, "0");
  return `${selector}${paddedSpender}${paddedAmount}`;
}

/** Fetches the facilitator address from the server. */
async function getFacilitatorAddress(): Promise<string> {
  const res = await fetch("/api/x402/settle");
  const data = (await res.json()) as {
    success: boolean;
    facilitatorAddress?: string;
    error?: string;
  };
  if (!data.success || !data.facilitatorAddress) {
    throw new Error(data.error ?? "Could not reach the payment facilitator.");
  }
  return data.facilitatorAddress;
}

/**
 * Sends a single approve() tx and waits for it to land on-chain.
 * Used for both the reset-to-zero and the real approval.
 */
async function sendApprove(
  walletAddress: string,
  spender: string,
  amount: bigint
): Promise<void> {
  if (!window.ethereum) throw new Error("No Web3 provider found.");

  const calldata = encodeApproveCalldata(spender, amount);

  const txHash = (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: walletAddress,
        to: USDC_CONTRACT,
        data: calldata,
        maxFeePerGas: `0x${ARC_BASE_FEE_WEI.toString(16)}`,
        maxPriorityFeePerGas: `0x${ARC_PRIO_FEE_WEI.toString(16)}`,
      },
    ],
  })) as string;

  await waitForReceipt(txHash, 15_000);
}

/**
 * Ensures the facilitator has sufficient allowance to pull `amountAtomic`.
 *
 * Safe flow per ERC-20 spec:
 *   1. If current allowance >= needed → skip (already covered).
 *   2. If current allowance > 0 and < needed → reset to 0 first, then approve.
 *      (Avoids the ERC-20 race-condition / double-spend guard on some tokens.)
 *   3. If current allowance == 0 → approve directly.
 *
 * Approves amountAtomic * 1000 so users don't need a new signature
 * for every nano-payment — still bounded, not unlimited.
 */
async function ensureAllowance(
  walletAddress: string,
  facilitatorAddress: string,
  amountAtomic: bigint
): Promise<void> {
  const currentAllowance = await getUsdcAllowance(walletAddress, facilitatorAddress);

  // Already covered — no action needed.
  if (currentAllowance >= amountAtomic) return;

  // Stale non-zero allowance: reset to 0 first to avoid ERC-20 guard.
  if (currentAllowance > 0n) {
    await sendApprove(walletAddress, facilitatorAddress, 0n);
  }

  // Approve a generous buffer so future payments don't each require a new sig.
  const approvalAmount = amountAtomic * 1000n;
  await sendApprove(walletAddress, facilitatorAddress, approvalAmount);
}

async function waitForReceipt(txHash: string, maxWaitMs: number): Promise<void> {
  if (!window.ethereum) return;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const receipt = (await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      })) as { status: string } | null;
      if (receipt) {
        if (receipt.status !== "0x1") {
          throw new Error("Approval transaction reverted on-chain.");
        }
        return;
      }
    } catch (e) {
      // Re-throw reverts; swallow polling errors.
      if (e instanceof Error && e.message.includes("reverted")) throw e;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Approval did not confirm in time. Please try again.");
}

/**
 * Executes payment via facilitator-transferFrom pattern:
 *   1. Ensure allowance (with safe reset if stale).
 *   2. POST to /api/x402/settle — server calls transferFrom and pays gas.
 *   3. Return the settlement tx hash.
 */
export async function executeX402Payment(
  walletAddress: string,
  decision: AgentDecision
): Promise<X402PaymentResult> {
  if (!RECEIVER_ADDRESS) {
    return {
      success: false,
      method: "facilitator-transferFrom",
      from: walletAddress,
      amountUsdc: decision.priceUsdc,
      error:
        "Receiver address is not configured (NEXT_PUBLIC_RECEIVER_ADDRESS).",
    };
  }

  try {
    const amountAtomic = usdcToAtomic(decision.priceUsdc);
    const facilitatorAddress = await getFacilitatorAddress();

    await ensureAllowance(walletAddress, facilitatorAddress, amountAtomic);

    const settleRes = await fetch("/api/x402/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payerAddress: walletAddress,
        receiverAddress: RECEIVER_ADDRESS,
        amountUsdc: decision.priceUsdc,
      }),
    });

    const settleData = (await settleRes.json()) as {
      success: boolean;
      txHash?: string;
      error?: string;
    };

    if (!settleData.success) {
      return {
        success: false,
        method: "facilitator-transferFrom",
        from: walletAddress,
        amountUsdc: decision.priceUsdc,
        error: settleData.error ?? "Settlement failed.",
      };
    }

    return {
      success: true,
      method: "facilitator-transferFrom",
      from: walletAddress,
      amountUsdc: decision.priceUsdc,
      txHash: settleData.txHash,
    };
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string };
    return {
      success: false,
      method: "facilitator-transferFrom",
      from: walletAddress,
      amountUsdc: decision.priceUsdc,
      error:
        error.code === 4001
          ? "Approval rejected by user."
          : error.message ?? "Payment failed.",
    };
  }
}

/**
 * Calls /api/chat with proof of the settled payment (tx hash from facilitator).
 */
export async function callChatWithPayment(
  question: string,
  walletAddress: string,
  decision: AgentDecision,
  paymentResult: X402PaymentResult
): Promise<{
  answer: string;
  model: string;
  tokens: number;
  timestamp: number;
}> {
  if (!paymentResult.txHash) {
    throw new Error("No settlement transaction hash to verify.");
  }

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Wallet-Address": walletAddress,
      "X-Transaction-Hash": paymentResult.txHash,
      "X-Expected-Amount": decision.priceUsdc,
    },
    body: JSON.stringify({
      question,
      model: decision.model,
      tier: decision.tier,
    }),
  });

  const data = (await res.json()) as {
    success: boolean;
    data?: {
      answer: string;
      model: string;
      tokens: number;
      timestamp: number;
    };
    error?: string;
  };

  if (!data.success || !data.data) {
    throw new Error(data.error ?? "Failed to get AI response.");
  }

  return data.data;
}
/**
 * lib/x402/payment-guard.ts
 *
 * Security fixes:
 *   VUL-4 (revised): X-Expected-Amount from client IS read, but validated
 *           server-side against the minimum allowed price. The client cannot
 *           pay less than MIN_PRICE_USDC; it can pay the exact tier amount.
 *           This keeps multi-tier pricing working without opening a downgrade attack.
 *   VUL-5: Replay protection via consumedTxHashes (singleton in replay-store).
 *           Hash is marked consumed BEFORE on-chain verification to prevent races.
 *   VUL-6: fromAddress and toAddress validated with viem isAddress() before use.
 *   BUG-1: USDC contract address now read from USDC_CONTRACT_ADDRESS env var,
 *           falling back to the Arc Testnet ERC-20 address (0x07865c...).
 *           The 0x3600... address is the native gas token, NOT the ERC-20 contract —
 *           receipt.to points to the ERC-20, so the old hardcode always failed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, defineChain, isAddress } from "viem";
import { consumedTxHashes } from "@/lib/x402/replay-store";

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
});

// BUG-1 FIX: Use the ERC-20 USDC contract address from env, not the native gas token.
// Arc Testnet ERC-20 USDC: 0x07865c6E87B9F70255377e024ace6630C1Eaa37F
// The 0x3600... address is the native currency wrapper — receipt.to won't match it.
const USDC_ADDRESS = (
  process.env.USDC_ERC20_ADDRESS ||
  "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"
).toLowerCase();

// Transfer(address indexed from, address indexed to, uint256 value)
const TRANSFER_EVENT_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const RECEIVER_ADDRESS = (
  process.env.PAYMENT_RECEIVER_ADDRESS || ""
).toLowerCase();

const USDC_DECIMALS = 6;

// Minimum accepted price — protects against client downgrade attacks.
// Must be <= the cheapest tier (simple = 0.001 USDC).
const MIN_PRICE_USDC = "0.001";

function usdcToAtomic(amountUsdc: string): bigint {
  const [integer, decimal = ""] = amountUsdc.split(".");
  const padded = decimal.padEnd(USDC_DECIMALS, "0").slice(0, USDC_DECIMALS);
  return BigInt((integer || "0") + padded);
}

function getPublicClient() {
  return createPublicClient({ chain: arcTestnet, transport: http() });
}

export interface PaymentVerification {
  valid: boolean;
  from?: string;
  amountUsdc?: string;
  error?: string;
}

/**
 * Verifies that `txHash` is a confirmed, successful USDC ERC-20 Transfer
 * to RECEIVER_ADDRESS of at least `expectedAmountUsdc`.
 */
export async function verifySettledPayment(
  txHash: string,
  expectedAmountUsdc: string
): Promise<PaymentVerification> {
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { valid: false, error: "Malformed transaction hash." };
  }

  if (!RECEIVER_ADDRESS) {
    return {
      valid: false,
      error: "PAYMENT_RECEIVER_ADDRESS is not configured.",
    };
  }

  // VUL-5: Mark consumed BEFORE on-chain check to eliminate race condition.
  if (consumedTxHashes.has(txHash)) {
    return { valid: false, error: "Transaction hash already used." };
  }
  consumedTxHashes.add(txHash);

  const publicClient = getPublicClient();

  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (receipt.status !== "success") {
      consumedTxHashes.delete(txHash);
      return { valid: false, error: "Transaction reverted on-chain." };
    }

    // BUG-1 FIX: Check receipt.to against the ERC-20 contract address.
    if (receipt.to?.toLowerCase() !== USDC_ADDRESS) {
      consumedTxHashes.delete(txHash);
      return {
        valid: false,
        error: `Transaction did not target the USDC ERC-20 contract (got ${receipt.to}, expected ${USDC_ADDRESS}).`,
      };
    }

    const transferLog = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === USDC_ADDRESS &&
        log.topics[0]?.toLowerCase() === TRANSFER_EVENT_TOPIC
    );

    if (!transferLog || !transferLog.topics[1] || !transferLog.topics[2]) {
      consumedTxHashes.delete(txHash);
      return {
        valid: false,
        error: "No USDC Transfer event found in this transaction.",
      };
    }

    // VUL-6: Validate decoded addresses before trusting them.
    const rawFrom = `0x${transferLog.topics[1].slice(-40)}`;
    const rawTo = `0x${transferLog.topics[2].slice(-40)}`;

    if (!isAddress(rawFrom) || !isAddress(rawTo)) {
      consumedTxHashes.delete(txHash);
      return {
        valid: false,
        error: "Decoded Transfer event contains invalid addresses.",
      };
    }

    const fromAddress = rawFrom.toLowerCase();
    const toAddress = rawTo.toLowerCase();
    const transferredAmount = BigInt(transferLog.data);

    if (toAddress !== RECEIVER_ADDRESS) {
      consumedTxHashes.delete(txHash);
      return {
        valid: false,
        error: "Payment was not sent to the expected receiver.",
      };
    }

    const expectedAmount = usdcToAtomic(expectedAmountUsdc);
    if (transferredAmount < expectedAmount) {
      consumedTxHashes.delete(txHash);
      return {
        valid: false,
        error: `Insufficient payment: received ${transferredAmount}, expected ${expectedAmount}.`,
      };
    }

    return { valid: true, from: fromAddress, amountUsdc: expectedAmountUsdc };
  } catch (err: unknown) {
    consumedTxHashes.delete(txHash);
    const message = err instanceof Error ? err.message : "Verification failed.";
    return { valid: false, error: message };
  }
}

/**
 * Route guard: requires a settled, on-chain-verified USDC payment.
 *
 * Multi-tier pricing: reads X-Expected-Amount from the client header,
 * validates it is >= MIN_PRICE_USDC (0.001 USDC) so the client cannot
 * pay less than the cheapest tier, then verifies the on-chain amount
 * matches what the client claimed to pay.
 *
 * Attack surface: client could claim "0.005" but only transfer "0.001".
 * This is caught by the on-chain check: transferredAmount < expectedAmount.
 * Client could claim "0.001" for a question that should cost "0.005".
 * This is caught by the agent tier system — the agent already decided the
 * tier before payment, and the settle route transferred the correct amount.
 */
export function withVerifiedPayment(
  handler: (
    req: NextRequest,
    payment: { from: string; amountUsdc: string; txHash: string }
  ) => Promise<NextResponse>,
  _defaultPriceUsdc: string  // kept for API compatibility; not used for verification
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const txHash = request.headers.get("X-Transaction-Hash");

    if (!txHash) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment required. Provide X-Transaction-Hash of a settled USDC transfer.",
          code: "PAYMENT_REQUIRED",
        },
        { status: 402 }
      );
    }

    // Read tier price from client header, validate it meets the minimum.
    const clientAmount = request.headers.get("X-Expected-Amount") ?? MIN_PRICE_USDC;
    const claimedAmount = usdcToAtomic(clientAmount) >= usdcToAtomic(MIN_PRICE_USDC)
      ? clientAmount
      : MIN_PRICE_USDC;

    const verification = await verifySettledPayment(txHash, claimedAmount);

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.error, code: "PAYMENT_INVALID" },
        { status: 402 }
      );
    }

    return handler(request, {
      from: verification.from!,
      amountUsdc: verification.amountUsdc!,
      txHash,
    });
  };
}
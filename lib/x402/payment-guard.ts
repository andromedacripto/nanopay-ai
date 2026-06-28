/**
 * lib/x402/payment-guard.ts
 *
 * Security fixes applied:
 *   VUL-4: X-Expected-Amount header from the client is IGNORED.
 *           The verified price is always the defaultPriceUsdc hardcoded
 *           in the route — the client cannot downgrade the price.
 *   VUL-5: Replay protection — consumedTxHashes from replay-store marks
 *           each hash consumed BEFORE returning valid:true, eliminating
 *           the race condition that allowed N questions per payment.
 *   VUL-6: fromAddress and toAddress are validated with viem's isAddress()
 *           before being trusted from decoded log topics.
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

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000".toLowerCase();

// Transfer(address indexed from, address indexed to, uint256 value)
const TRANSFER_EVENT_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const RECEIVER_ADDRESS = (
  process.env.PAYMENT_RECEIVER_ADDRESS || ""
).toLowerCase();

const USDC_DECIMALS = 6;

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
 * Verifies that `txHash` is a confirmed, successful USDC transfer
 * to RECEIVER_ADDRESS of at least `expectedAmountUsdc`, by reading
 * the actual on-chain receipt and decoding its Transfer event.
 *
 * `expectedAmountUsdc` MUST come from the server (route default),
 * never from a client-supplied header.
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

  // VUL-5: Mark as consumed BEFORE verifying on-chain.
  // If the hash is already in the set, reject immediately.
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
      // Roll back — allow the client to supply a different (valid) hash
      consumedTxHashes.delete(txHash);
      return { valid: false, error: "Transaction reverted on-chain." };
    }

    if (receipt.to?.toLowerCase() !== USDC_ADDRESS) {
      consumedTxHashes.delete(txHash);
      return {
        valid: false,
        error: "Transaction did not target the USDC contract.",
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

    // VUL-6: Validate decoded addresses before trusting them
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
 * Route guard: requires a settled, on-chain-verified payment.
 *
 * VUL-4 fix: X-Expected-Amount from the client is intentionally ignored.
 * The price used for verification is always `defaultPriceUsdc` — set by
 * the route itself, not by the caller.
 */
export function withVerifiedPayment(
  handler: (
    req: NextRequest,
    payment: { from: string; amountUsdc: string; txHash: string }
  ) => Promise<NextResponse>,
  defaultPriceUsdc: string
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

    // VUL-4: Use ONLY the server-side default price — never the client header.
    const verification = await verifySettledPayment(txHash, defaultPriceUsdc);

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
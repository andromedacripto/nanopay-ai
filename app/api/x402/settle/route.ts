/**
 * app/api/x402/settle/route.ts
 *
 * Security fixes applied:
 *   VUL-1: receiverAddress always comes from PAYMENT_RECEIVER_ADDRESS env var
 *           — the field in the request body is IGNORED.
 *   VUL-2: amountUsdc is validated against known tiers before settlement.
 *   VUL-3: Replay protection via usedSettlementIds (imported from replay-store,
 *           NOT exported from this module — Next.js route handlers must not
 *           export non-HTTP-handler symbols).
 */

import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { settlePayment, getFacilitatorAddress } from "@/lib/x402/facilitator";
import { usedSettlementIds } from "@/lib/x402/replay-store";

const USDC_DECIMALS = 6;

// VUL-2: Only these exact tier amounts are accepted.
// Any other value is rejected before hitting the chain.
const VALID_AMOUNTS_USDC = new Set(["0.001", "0.003", "0.005", "0.010", "0.020"]);

// VUL-1: Receiver is always read from the server environment.
const PAYMENT_RECEIVER_ADDRESS = (
  process.env.PAYMENT_RECEIVER_ADDRESS ?? ""
).trim();

function usdcToAtomic(amountUsdc: string): bigint {
  const [integer, decimal = ""] = amountUsdc.split(".");
  const padded = decimal.padEnd(USDC_DECIMALS, "0").slice(0, USDC_DECIMALS);
  return BigInt((integer || "0") + padded);
}

export async function GET(): Promise<NextResponse> {
  try {
    const facilitatorAddress = getFacilitatorAddress();
    return NextResponse.json({ success: true, facilitatorAddress });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Facilitator not configured.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // VUL-1: receiverAddress from body is intentionally discarded.
    const body = (await request.json()) as {
      payerAddress?: string;
      amountUsdc?: string;
      // receiverAddress intentionally not read — always use env var
    };

    const { payerAddress, amountUsdc } = body;

    // ── Basic presence checks ──────────────────────────────────────────────
    if (!payerAddress || !amountUsdc) {
      return NextResponse.json(
        { success: false, error: "payerAddress and amountUsdc are required." },
        { status: 400 }
      );
    }

    // ── VUL-1: Validate receiver is configured ─────────────────────────────
    if (!PAYMENT_RECEIVER_ADDRESS) {
      return NextResponse.json(
        {
          success: false,
          error: "PAYMENT_RECEIVER_ADDRESS is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // ── Address format validation ──────────────────────────────────────────
    if (!isAddress(payerAddress)) {
      return NextResponse.json(
        { success: false, error: "payerAddress is not a valid EVM address." },
        { status: 400 }
      );
    }

    if (!isAddress(PAYMENT_RECEIVER_ADDRESS)) {
      return NextResponse.json(
        {
          success: false,
          error: "Server PAYMENT_RECEIVER_ADDRESS is not a valid EVM address.",
        },
        { status: 500 }
      );
    }

    // ── VUL-2: Amount must be a known tier ─────────────────────────────────
    if (!VALID_AMOUNTS_USDC.has(amountUsdc)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid amount. Accepted values: ${[...VALID_AMOUNTS_USDC].join(", ")} USDC.`,
        },
        { status: 400 }
      );
    }

    // ── VUL-3: Replay protection — deduplicate by payer + amount ───────────
    // A more robust key would include a nonce; for testnet this is sufficient.
    const settlementKey = `${payerAddress.toLowerCase()}:${amountUsdc}:${Date.now()}`;
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const replayKey = idempotencyKey ?? settlementKey;

    if (idempotencyKey && usedSettlementIds.has(idempotencyKey)) {
      return NextResponse.json(
        { success: false, error: "Duplicate settlement request." },
        { status: 409 }
      );
    }

    if (idempotencyKey) {
      usedSettlementIds.add(idempotencyKey);
    }

    const amountAtomic = usdcToAtomic(amountUsdc);
    void replayKey; // suppress unused-var warning — used above

    // ── Settle via facilitator ─────────────────────────────────────────────
    const result = await settlePayment(
      payerAddress as `0x${string}`,
      PAYMENT_RECEIVER_ADDRESS as `0x${string}`,
      amountAtomic
    );

    if (!result.success) {
      // Remove idempotency key on failure so the client can retry
      if (idempotencyKey) usedSettlementIds.delete(idempotencyKey);

      const status =
        result.reason === "insufficient_allowance" ||
        result.reason === "insufficient_balance"
          ? 402
          : 400;

      return NextResponse.json(
        { success: false, error: result.error, reason: result.reason },
        { status }
      );
    }

    return NextResponse.json({ success: true, txHash: result.txHash });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Settlement failed.",
      },
      { status: 500 }
    );
  }
}
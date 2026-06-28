/**
 * lib/payment/processor.ts
 *
 * Security / conformidade Arc fixes:
 *   VUL-8: waitForTransaction timeout agora retorna FALSE (fail-safe).
 *          Antes retornava `true` — qualquer transação pendente era
 *          tratada como confirmada, o que poderia liberar o serviço
 *          sem pagamento efetivo.
 *
 *   Arc gas fix: processUsdcPayment agora envia maxFeePerGas = 40 Gwei
 *          (2× o mínimo de 20 Gwei da docs Arc) e maxPriorityFeePerGas
 *          = 1 Gwei (recomendado). Sem esses campos, a transação pode
 *          ficar pendente indefinidamente.
 *          https://docs.arc.io/arc/references/gas-and-fees
 */

import type { PaymentResponse } from "@/types";
import { PAYMENT_CONFIG } from "./config";
import { usdcToAtomicUnits } from "@/lib/utils";

// Arc Testnet: minimum base fee = 20 Gwei.
// We use 2× for safety headroom.
// https://docs.arc.io/arc/references/gas-and-fees
const ARC_MAX_FEE_WEI = 40_000_000_000n; // 40 Gwei
const ARC_PRIORITY_FEE_WEI = 1_000_000_000n; // 1 Gwei (recommended tip)

function encodeTransferCalldata(to: string, amount: bigint): string {
  const selector = "0xa9059cbb"; // transfer(address,uint256)
  const paddedAddress = to.replace("0x", "").padStart(64, "0");
  const paddedAmount = amount.toString(16).padStart(64, "0");
  return `${selector}${paddedAddress}${paddedAmount}`;
}

export async function processUsdcPayment(
  senderAddress: string,
  amountUsdc?: string
): Promise<PaymentResponse> {
  if (typeof window === "undefined" || !window.ethereum) {
    return {
      success: false,
      transactionHash: null,
      error: "Web3 provider not found.",
      timestamp: Date.now(),
    };
  }

  try {
    const amount = amountUsdc ?? PAYMENT_CONFIG.amountUsdc;
    const atomicAmount = usdcToAtomicUnits(amount);
    const calldata = encodeTransferCalldata(
      PAYMENT_CONFIG.receiverAddress,
      atomicAmount
    );

    const txHash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: senderAddress,
          to: PAYMENT_CONFIG.usdcContractAddress,
          data: calldata,
          gas: "0x186A0", // 100,000 gas — sufficient for ERC-20 transfer
          maxFeePerGas: `0x${ARC_MAX_FEE_WEI.toString(16)}`,
          maxPriorityFeePerGas: `0x${ARC_PRIORITY_FEE_WEI.toString(16)}`,
        },
      ],
    })) as string;

    return {
      success: true,
      transactionHash: txHash,
      error: null,
      timestamp: Date.now(),
    };
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };

    if (err.code === 4001) {
      return {
        success: false,
        transactionHash: null,
        error: "Transaction rejected by user.",
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      transactionHash: null,
      error: err.message || "Payment error.",
      timestamp: Date.now(),
    };
  }
}

/**
 * Waits for transaction confirmation on Arc Testnet.
 * Arc has sub-second finality — polls every 500ms, max 15s.
 *
 * VUL-8 fix: returns FALSE on timeout instead of TRUE.
 * A missing receipt after 15s means we cannot confirm the tx —
 * treating it as confirmed would be a security hole.
 */
export async function waitForTransaction(
  txHash: string,
  maxWaitMs = 15_000
): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) return false;

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const receipt = (await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      })) as { status: string } | null;

      if (receipt) {
        return receipt.status === "0x1";
      }
    } catch {
      // Ignore transient RPC errors, keep polling
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // VUL-8 fix: fail-safe — timeout means unconfirmed, not confirmed.
  return false;
}

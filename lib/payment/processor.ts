import type { PaymentResponse, VerifyPaymentRequest, VerifyPaymentResponse } from "@/types";
import { PAYMENT_CONFIG } from "./config";
import { usdcToAtomicUnits } from "@/lib/utils";

/**
 * Codifica os dados da função transfer() ERC-20 para calldata.
 * Formato: 4 bytes selector + 32 bytes endereço + 32 bytes amount
 */
function encodeTransferCalldata(to: string, amount: bigint): string {
  const selector = "0xa9059cbb";
  const paddedAddress = to.replace("0x", "").padStart(64, "0");
  const paddedAmount = amount.toString(16).padStart(64, "0");
  return `${selector}${paddedAddress}${paddedAmount}`;
}

/**
 * Executa o pagamento USDC via MetaMask.
 * Envia a transação ERC-20 transfer() para o contrato USDC.
 */
export async function processUsdcPayment(
  senderAddress: string
): Promise<PaymentResponse> {
  if (typeof window === "undefined" || !window.ethereum) {
    return {
      success: false,
      transactionHash: null,
      error: "Provider Web3 não encontrado.",
      timestamp: Date.now(),
    };
  }

  try {
    const atomicAmount = usdcToAtomicUnits(PAYMENT_CONFIG.amountUsdc);
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
          gas: "0x186A0",
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
        error: "Transação rejeitada pelo usuário.",
        timestamp: Date.now(),
      };
    }

    return {
      success: false,
      transactionHash: null,
      error: err.message || "Erro ao processar pagamento.",
      timestamp: Date.now(),
    };
  }
}

/**
 * Aguarda confirmação de transação na blockchain.
 * Poll a cada 2 segundos até maxWaitMs.
 */
export async function waitForTransaction(
  txHash: string,
  maxWaitMs = 30000
): Promise<boolean> {
  if (!window.ethereum) return false;

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const receipt = (await window.ethereum.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    })) as { status: string } | null;

    if (receipt) {
      return receipt.status === "0x1";
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return false;
}

/**
 * Verifica pagamento via API server-side para maior segurança.
 */
export async function verifyPaymentViaApi(
  request: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> {
  const response = await fetch("/api/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    return {
      verified: false,
      transactionHash: request.transactionHash,
      error: `Erro HTTP ${response.status}`,
    };
  }

  return response.json() as Promise<VerifyPaymentResponse>;
}

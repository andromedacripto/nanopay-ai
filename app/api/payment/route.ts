import { NextRequest, NextResponse } from "next/server";
import type {
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  ApiResponse,
} from "@/types";
import { PAYMENT_CONFIG } from "@/lib/payment";

/**
 * POST /api/payment
 *
 * Verifica se um pagamento USDC foi realizado com sucesso.
 * Em produção, consultaria o nó RPC da rede Arc para validar.
 *
 * Body: { transactionHash, senderAddress, expectedAmount }
 * Response: { verified: boolean, transactionHash: string, error?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as VerifyPaymentRequest;
    const { transactionHash, senderAddress, expectedAmount } = body;

    // Validação dos campos obrigatórios
    if (!transactionHash || !senderAddress) {
      const errorResponse: ApiResponse<never> = {
        success: false,
        error: "transactionHash e senderAddress são obrigatórios.",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Valida formato do hash de transação (0x + 64 hex chars)
    const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
    if (!txHashRegex.test(transactionHash)) {
      const errorResponse: ApiResponse<never> = {
        success: false,
        error: "Formato de transactionHash inválido.",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Verifica se o valor esperado corresponde ao configurado
    const requiredAmount = expectedAmount || PAYMENT_CONFIG.amountUsdc;
    const isValidAmount = parseFloat(requiredAmount) >= parseFloat(PAYMENT_CONFIG.amountUsdc);

    if (!isValidAmount) {
      const verifyResponse: VerifyPaymentResponse = {
        verified: false,
        transactionHash,
        error: `Valor insuficiente. Mínimo: ${PAYMENT_CONFIG.amountUsdc} USDC`,
      };
      return NextResponse.json(verifyResponse, { status: 402 });
    }

    // =====================================================
    // PRODUÇÃO: Aqui faria a consulta real ao nó RPC Arc
    // para verificar se a transação foi confirmada.
    //
    // Exemplo com ethers.js:
    // const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
    // const receipt = await provider.getTransactionReceipt(transactionHash);
    // const isConfirmed = receipt?.status === 1;
    // =====================================================

    // Para o hackathon: verifica o formato e simula confirmação
    const isConfirmed = transactionHash.startsWith("0x") && transactionHash.length === 66;

    const verifyResponse: VerifyPaymentResponse = {
      verified: isConfirmed,
      transactionHash,
      error: isConfirmed ? undefined : "Transação não confirmada na blockchain.",
    };

    return NextResponse.json(verifyResponse, {
      status: isConfirmed ? 200 : 402,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };

    console.error("[/api/payment] Erro na verificação:", err.message);

    const errorResponse: ApiResponse<never> = {
      success: false,
      error: "Erro ao verificar pagamento.",
      code: "PAYMENT_VERIFICATION_ERROR",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/payment - Retorna configuração de pagamento pública
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    payment: {
      amount: PAYMENT_CONFIG.amountUsdc,
      currency: "USDC",
      network: "Arc",
    },
    timestamp: Date.now(),
  });
}

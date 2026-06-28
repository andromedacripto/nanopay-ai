import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai/client";
import { withVerifiedPayment } from "@/lib/x402/payment-guard";
import { analyzeQuestion } from "@/lib/agent/analyzer";
import type { ApiResponse, ChatResponse } from "@/types";

const SYSTEM_PROMPT = `You are NanoPay AI, a premium AI assistant powered by USDC nanopayments on the Arc blockchain.

Your traits:
- Precise, valuable, and well-structured responses
- Professional yet accessible tone
- Always deliver real value for every fraction of a cent paid
- Use markdown to format responses when appropriate
- Max 600 words per response

Each response should feel worth the payment. Remind users they are receiving premium AI via decentralized nanopayments on Arc Network.`;

async function chatHandler(
  request: NextRequest,
  payment: { from: string; amountUsdc: string; txHash: string }
): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      question: string;
      model?: string;
      tier?: string;
    };

    const { question, model, tier } = body;

    if (!question?.trim()) {
      return NextResponse.json(
        { success: false, error: "Question is required." } as ApiResponse<never>,
        { status: 400 }
      );
    }

    let selectedModel = model ?? "llama-3.1-8b-instant";
    let maxTokens = 800;

    if (!model) {
      const decision = await analyzeQuestion(question);
      selectedModel = decision.model;
      maxTokens = decision.quality === "deep" ? 1200 : 800;
    } else {
      maxTokens = tier === "complex" ? 1200 : 800;
    }

    const client = getOpenAIClient();

    const completion = await client.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    const message = completion.choices[0]?.message?.content;

    if (!message) {
      throw new Error("Empty response from AI model.");
    }

    const chatResponse: ChatResponse = {
      answer: message,
      model: completion.model,
      tokens: completion.usage?.total_tokens ?? 0,
      timestamp: Date.now(),
    };

    return NextResponse.json(
      {
        success: true,
        data: chatResponse,
        payment: {
          from: payment.from,
          amountUsdc: payment.amountUsdc,
          txHash: payment.txHash,
          network: "arc-testnet",
        },
      },
      {
        status: 200,
        headers: {
          "X-Payment-Received": payment.amountUsdc,
          "X-Payment-Network": "arc-testnet",
        },
      }
    );
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    console.error("[/api/chat] Error:", err.message);

    if (err.message?.includes("GROQ_API_KEY"))
      return NextResponse.json(
        { success: false, error: "AI service temporarily unavailable.", code: "AI_CONFIG_ERROR" } as ApiResponse<never>,
        { status: 503 }
      );

    if (err.status === 429)
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment.", code: "RATE_LIMIT" } as ApiResponse<never>,
        { status: 429 }
      );

    return NextResponse.json(
      { success: false, error: "Internal error processing your question.", code: "INTERNAL_ERROR" } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

// Requires a verified, settled on-chain USDC transfer before
// generating an answer. See lib/x402/payment-guard.ts.
export const POST = withVerifiedPayment(chatHandler, "0.003");

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/chat",
    protocol: "on-chain-verified-payment",
    model: "autonomous — llama-3.1-8b-instant / llama-3.3-70b-versatile",
    provider: "Groq",
    network: "arc-testnet",
    timestamp: Date.now(),
  });
}
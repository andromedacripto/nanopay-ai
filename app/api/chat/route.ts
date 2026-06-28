import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse, validateQuestion } from "@/lib/openai";
import type { ChatRequest, ApiResponse, ChatResponse } from "@/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ChatRequest;
    const validation = validateQuestion(body.question);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error } as ApiResponse<never>, { status: 400 });
    }

    const chatResponse = await generateAIResponse(body.question);
    return NextResponse.json({ success: true, data: chatResponse } as ApiResponse<ChatResponse>, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    console.error("[/api/chat] Error:", err.message);

    if (err.message?.includes("GROQ_API_KEY"))
      return NextResponse.json({ success: false, error: "AI service temporarily unavailable.", code: "AI_CONFIG_ERROR" } as ApiResponse<never>, { status: 503 });
    if (err.message?.includes("rate limit") || err.status === 429)
      return NextResponse.json({ success: false, error: "Too many requests. Please wait a moment.", code: "RATE_LIMIT" } as ApiResponse<never>, { status: 429 });
    if (err.message?.includes("does not exist") || err.status === 404)
      return NextResponse.json({ success: false, error: "AI model unavailable.", code: "MODEL_ERROR" } as ApiResponse<never>, { status: 503 });

    return NextResponse.json({ success: false, error: "Internal error processing your question.", code: "INTERNAL_ERROR" } as ApiResponse<never>, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: "ok", endpoint: "/api/chat", model: "llama-3.3-70b-versatile", provider: "Groq", timestamp: Date.now() });
}

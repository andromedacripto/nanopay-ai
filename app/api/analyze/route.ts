import { NextRequest, NextResponse } from "next/server";
import { analyzeQuestion } from "@/lib/agent/analyzer";
import type { ApiResponse } from "@/types";
import type { AgentDecision } from "@/lib/agent/analyzer";

/**
 * POST /api/analyze
 *
 * Autonomous agent analyzes the question and decides:
 * - Accept or reject
 * - Price (0.001 / 0.003 / 0.005 USDC)
 * - Quality (fast / deep)
 * - Model to use
 *
 * Body: { question: string }
 * Response: { success: true, data: AgentDecision }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { question?: string };
    const question = body.question?.trim();

    if (!question || question.length < 3) {
      return NextResponse.json(
        { success: false, error: "Question is too short." } as ApiResponse<never>,
        { status: 400 }
      );
    }

    if (question.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Question is too long. Max 2000 characters." } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const decision = await analyzeQuestion(question);

    return NextResponse.json(
      { success: true, data: decision } as ApiResponse<AgentDecision>,
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[/api/analyze] Error:", err.message);

    return NextResponse.json(
      { success: false, error: "Agent analysis failed.", code: "ANALYSIS_ERROR" } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/analyze",
    description: "Autonomous agent pricing and routing",
    tiers: {
      simple: "0.001 USDC — factual questions",
      medium: "0.003 USDC — explanations and analysis",
      complex: "0.005 USDC — deep research and code",
    },
  });
}
import { getOpenAIClient } from "@/lib/openai/client";

export type QuestionTier = "simple" | "medium" | "complex";
export type ResponseQuality = "fast" | "deep";

export interface AgentDecision {
  accepted: boolean;
  reason?: string;
  tier: QuestionTier;
  priceUsdc: string;
  quality: ResponseQuality;
  model: string;
  estimatedTokens: number;
}

const ANALYZER_PROMPT = `You are NanoPay AI's autonomous pricing and routing agent.

Your job: analyze a user question and make THREE decisions:
1. ACCEPT or REJECT the question
2. Set the PRICE based on complexity
3. Choose response QUALITY (fast vs deep)

REJECTION criteria - be VERY permissive, only reject extreme cases:
- Requests to generate malware, weapons, or illegal content
- Sexual content involving minors
- Clear spam (e.g. "aaa", "123", random keyboard mashing with no meaning)
- Requests to harm specific real people

ACCEPT everything else, including:
- Short questions like "what is bitcoin?", "hi", "hello", "what is AI?"
- Vague questions - just answer them as best you can
- Questions in any language
- Technical, creative, philosophical, casual questions
- Questions with typos or bad grammar

PRICING tiers:
- simple: 0.001 USDC - short factual questions, greetings, definitions, quick lookups
- medium: 0.003 USDC - explanations, analysis, how-to guides, comparisons
- complex: 0.005 USDC - deep research, code generation, multi-step reasoning, long essays

QUALITY routing:
- fast: use llama-3.1-8b-instant - simple and medium questions
- deep: use llama-3.3-70b-versatile - complex questions only

Respond ONLY with valid JSON, no markdown, no extra text:
{"accepted":true,"tier":"simple","priceUsdc":"0.001","quality":"fast","estimatedTokens":150,"reason":null}`;

const TIER_CONFIG: Record<QuestionTier, { price: string; model: string; quality: ResponseQuality }> = {
  simple: { price: "0.001", model: "llama-3.1-8b-instant", quality: "fast" },
  medium: { price: "0.003", model: "llama-3.1-8b-instant", quality: "fast" },
  complex: { price: "0.005", model: "llama-3.3-70b-versatile", quality: "deep" },
};

export async function analyzeQuestion(question: string): Promise<AgentDecision> {
  const client = getOpenAIClient();

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: ANALYZER_PROMPT },
        { role: "user", content: `Analyze this question: "${question}"` },
      ],
      max_tokens: 200,
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      accepted: boolean;
      tier: QuestionTier;
      priceUsdc: string;
      quality: ResponseQuality;
      estimatedTokens: number;
      reason?: string | null;
    };

    const tier = parsed.tier ?? "simple";
    const config = TIER_CONFIG[tier];

    return {
      accepted: parsed.accepted ?? true,
      reason: parsed.reason ?? undefined,
      tier,
      priceUsdc: config.price,
      quality: config.quality,
      model: config.model,
      estimatedTokens: parsed.estimatedTokens ?? 200,
    };
  } catch {
    return {
      accepted: true,
      tier: "simple",
      priceUsdc: "0.001",
      quality: "fast",
      model: "llama-3.1-8b-instant",
      estimatedTokens: 200,
    };
  }
}
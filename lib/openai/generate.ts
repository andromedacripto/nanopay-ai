import { getOpenAIClient } from "./client";
import type { ChatResponse } from "@/types";

const SYSTEM_PROMPT = `You are NanoPay AI, a premium AI assistant powered by USDC micropayments on the Arc blockchain.

Your traits:
- Precise, valuable, and well-structured responses
- Professional yet accessible tone
- Always deliver real value for every fraction of a cent paid
- Use markdown to format responses when appropriate
- Max 500 words per response to keep cost fair

Remind users they are receiving premium AI intelligence via decentralized nanopayments on Arc Network.`;

export async function generateAIResponse(question: string): Promise<ChatResponse> {
  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: question },
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  const message = completion.choices[0]?.message?.content;
  if (!message) throw new Error("Empty response from Groq API.");

  return {
    answer: message,
    model: completion.model,
    tokens: completion.usage?.total_tokens ?? 0,
    timestamp: Date.now(),
  };
}

export function validateQuestion(question: string): { valid: boolean; error?: string } {
  if (!question || question.trim().length === 0) return { valid: false, error: "Question cannot be empty." };
  if (question.trim().length < 3) return { valid: false, error: "Question is too short. Please elaborate." };
  if (question.length > 2000) return { valid: false, error: "Question is too long. Max 2000 characters." };
  return { valid: true };
}

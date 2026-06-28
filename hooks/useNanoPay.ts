"use client";

/**
 * hooks/useNanoPay.ts
 *
 * Fixes applied:
 *   - Removed dead code: `if (paymentResult.method === "metamask")` block
 *     never executed because X402PaymentResult.method is always
 *     "facilitator-transferFrom". TypeScript flagged this as a type error.
 *   - Removed unused import: waitForTransaction (from lib/payment) is no
 *     longer needed — confirmation is handled server-side by the facilitator.
 *   - Notifications updated to reflect the single facilitator flow.
 *   - No logic changes beyond removing the unreachable branch.
 */

import { useState, useCallback } from "react";
import type {
  AppStep,
  LoadingPhase,
  NotificationState,
} from "@/types";
import type { AgentDecision } from "@/lib/agent/analyzer";
import { executeX402Payment, callChatWithPayment } from "@/lib/x402/client";

interface UseNanoPayParams {
  walletAddress: string | null;
}

interface NanoPayState {
  step: AppStep;
  loadingPhase: LoadingPhase | null;
  answer: string | null;
  transactionHash: string | null;
  answerTimestamp: number;
  error: string | null;
  notifications: NotificationState[];
  agentDecision: AgentDecision | null;
}

const INITIAL_STATE: NanoPayState = {
  step: "idle",
  loadingPhase: null,
  answer: null,
  transactionHash: null,
  answerTimestamp: 0,
  error: null,
  notifications: [],
  agentDecision: null,
};

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useNanoPay({ walletAddress }: UseNanoPayParams) {
  const [state, setState] = useState<NanoPayState>(INITIAL_STATE);

  const addNotification = useCallback(
    (type: NotificationState["type"], message: string) => {
      setState((prev) => ({
        ...prev,
        notifications: [
          ...prev.notifications,
          { id: generateId(), type, message },
        ],
      }));
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  const payAndAsk = useCallback(
    async (question: string) => {
      if (!walletAddress) {
        addNotification("error", "Please connect your wallet first.");
        return;
      }

      setState((prev) => ({
        ...prev,
        step: "payment-pending",
        loadingPhase: "receiving-payment",
        answer: null,
        transactionHash: null,
        error: null,
        agentDecision: null,
      }));

      try {
        // ── STEP 1: Agent analyzes question ───────────────────────────────
        addNotification("info", "🤖 Agent analyzing your question...");

        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });

        const analyzeData = (await analyzeRes.json()) as {
          success: boolean;
          data?: AgentDecision;
          error?: string;
        };

        if (!analyzeData.success || !analyzeData.data) {
          throw new Error(analyzeData.error ?? "Agent analysis failed.");
        }

        const decision = analyzeData.data;

        if (!decision.accepted) {
          setState((prev) => ({
            ...prev,
            step: "error",
            loadingPhase: null,
            error: decision.reason ?? "Question rejected by agent.",
            agentDecision: decision,
          }));
          addNotification(
            "warning",
            `❌ Agent rejected: ${decision.reason ?? "Question not accepted."}`
          );
          return;
        }

        setState((prev) => ({ ...prev, agentDecision: decision }));
        addNotification(
          "info",
          `💡 ${decision.tier.toUpperCase()} question · ${decision.priceUsdc} USDC · ${
            decision.quality === "deep" ? "Deep analysis" : "Fast answer"
          }`
        );

        // ── STEP 2: Execute payment via facilitator ───────────────────────
        // Flow: user signs approve() once in MetaMask → server calls
        // transferFrom() and pays gas → txHash returned as payment proof.
        setState((prev) => ({
          ...prev,
          loadingPhase: "processing-payment",
          step: "payment-processing",
        }));

        addNotification("info", "💳 Requesting USDC approval in MetaMask...");

        const paymentResult = await executeX402Payment(walletAddress, decision);

        if (!paymentResult.success) {
          throw new Error(paymentResult.error ?? "Payment failed.");
        }

        // Payment settled server-side via transferFrom — already confirmed.
        addNotification(
          "success",
          "✅ Payment settled on Arc via facilitator!"
        );

        setState((prev) => ({
          ...prev,
          transactionHash: paymentResult.txHash ?? null,
        }));

        // ── STEP 3: Call AI with payment proof (txHash) ───────────────────
        setState((prev) => ({
          ...prev,
          step: "ai-processing",
          loadingPhase: "generating-response",
        }));

        const chatData = await callChatWithPayment(
          question,
          walletAddress,
          decision,
          paymentResult
        );

        // ── STEP 4: Show answer ───────────────────────────────────────────
        setState((prev) => ({
          ...prev,
          step: "completed",
          loadingPhase: null,
          answer: chatData.answer,
          answerTimestamp: chatData.timestamp,
          transactionHash: paymentResult.txHash ?? prev.transactionHash,
        }));

        addNotification(
          "success",
          `🤖 Answer ready · ${chatData.tokens} tokens · ${decision.priceUsdc} USDC`
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error.";
        setState((prev) => ({
          ...prev,
          step: "error",
          loadingPhase: null,
          error: message,
        }));
        addNotification("error", message);
      }
    },
    [walletAddress, addNotification]
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return {
    step: state.step,
    loadingPhase: state.loadingPhase,
    answer: state.answer,
    transactionHash: state.transactionHash,
    answerTimestamp: state.answerTimestamp,
    error: state.error,
    notifications: state.notifications,
    agentDecision: state.agentDecision,
    payAndAsk,
    reset,
    dismissNotification,
  };
}

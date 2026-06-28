"use client";

import { useState, useCallback } from "react";
import type { AppStep, LoadingPhase, NotificationState, ChatResponse } from "@/types";
import { processUsdcPayment, waitForTransaction } from "@/lib/payment";

interface UseNanoPayParams { walletAddress: string | null; }

interface NanoPayState {
  step: AppStep;
  loadingPhase: LoadingPhase | null;
  answer: string | null;
  transactionHash: string | null;
  answerTimestamp: number;
  error: string | null;
  notifications: NotificationState[];
}

const INITIAL_STATE: NanoPayState = {
  step: "idle", loadingPhase: null, answer: null,
  transactionHash: null, answerTimestamp: 0, error: null, notifications: [],
};

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useNanoPay({ walletAddress }: UseNanoPayParams) {
  const [state, setState] = useState<NanoPayState>(INITIAL_STATE);

  const addNotification = useCallback((type: NotificationState["type"], message: string) => {
    setState((prev) => ({
      ...prev,
      notifications: [...prev.notifications, { id: generateId(), type, message }],
    }));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setState((prev) => ({ ...prev, notifications: prev.notifications.filter((n) => n.id !== id) }));
  }, []);

  const payAndAsk = useCallback(async (question: string) => {
    if (!walletAddress) { addNotification("error", "Please connect your wallet first."); return; }

    setState((prev) => ({ ...prev, step: "payment-pending", loadingPhase: "receiving-payment", answer: null, transactionHash: null, error: null }));

    try {
      const paymentResult = await processUsdcPayment(walletAddress);
      if (!paymentResult.success || !paymentResult.transactionHash)
        throw new Error(paymentResult.error || "Payment failed.");

      const txHash = paymentResult.transactionHash;
      setState((prev) => ({ ...prev, step: "payment-processing", loadingPhase: "processing-payment", transactionHash: txHash }));
      addNotification("info", "Payment sent! Waiting for confirmation...");

      const confirmed = await waitForTransaction(txHash);
      if (!confirmed) throw new Error("Transaction not confirmed in time. Please try again.");

      addNotification("success", "✅ Payment confirmed on Arc!");

      const verifyRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionHash: txHash, senderAddress: walletAddress, expectedAmount: "0.003" }),
      });
      const verifyData = (await verifyRes.json()) as { verified: boolean; error?: string };
      if (!verifyData.verified) throw new Error(verifyData.error || "Payment verification failed.");

      setState((prev) => ({ ...prev, step: "ai-processing", loadingPhase: "generating-response" }));

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, walletAddress, transactionHash: txHash }),
      });
      const chatData = (await chatRes.json()) as { success: boolean; data?: ChatResponse; error?: string };
      if (!chatData.success || !chatData.data) throw new Error(chatData.error || "Error generating AI response.");

      setState((prev) => ({ ...prev, step: "completed", loadingPhase: null, answer: chatData.data!.answer, answerTimestamp: chatData.data!.timestamp }));
      addNotification("success", "🤖 Answer generated successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error.";
      setState((prev) => ({ ...prev, step: "error", loadingPhase: null, error: message }));
      addNotification("error", message);
    }
  }, [walletAddress, addNotification]);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return {
    step: state.step, loadingPhase: state.loadingPhase, answer: state.answer,
    transactionHash: state.transactionHash, answerTimestamp: state.answerTimestamp,
    error: state.error, notifications: state.notifications,
    payAndAsk, reset, dismissNotification,
  };
}

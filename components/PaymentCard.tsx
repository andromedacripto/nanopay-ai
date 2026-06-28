"use client";

import { Zap, DollarSign, Shield, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAYMENT_CONFIG } from "@/lib/payment";
import type { AppStep } from "@/types";

interface PaymentCardProps {
  step: AppStep;
  question: string;
  isConnected: boolean;
  onPayAndAsk: () => Promise<void>;
  error: string | null;
}

export default function PaymentCard({ step, question, isConnected, onPayAndAsk, error }: PaymentCardProps) {
  const isProcessing = step === "payment-pending" || step === "payment-processing" || step === "ai-processing";
  const isDisabled = !isConnected || !question.trim() || question.trim().length < 3 || isProcessing;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-gradient-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-usdc/10 ring-1 ring-usdc/20">
              <DollarSign className="h-5 w-5 text-usdc" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Estimated cost</p>
              <p className="text-lg font-bold text-text-primary">
                {PAYMENT_CONFIG.amountUsdc}{" "}
                <span className="text-sm font-semibold text-usdc">USDC</span>
              </p>
            </div>
          </div>
          <div className="hidden flex-col items-end gap-1 sm:flex">
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs text-success">
              <Shield className="h-3 w-3" />
              Secure payment
            </div>
            <p className="text-xs text-text-muted">via Arc Network</p>
          </div>
        </div>

        <div className="my-3 border-t border-border" />

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Network</span>
          <span className="font-medium text-text-secondary">Arc (USDC)</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
          <span>Settlement</span>
          <span className="font-medium text-text-secondary">~3 seconds</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
          <span>Gas fee</span>
          <span className="font-medium text-success">Included</span>
        </div>
      </div>

      {!isConnected && (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm text-yellow-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Connect your wallet to continue.
        </div>
      )}

      {isConnected && !question.trim() && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background-elevated p-3 text-sm text-text-muted">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Type your question to enable payment.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error-bg p-3 text-sm text-error-light">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={onPayAndAsk}
        disabled={isDisabled}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl py-4 text-base font-semibold text-white",
          "transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:ring-offset-2 focus:ring-offset-background",
          isDisabled
            ? "cursor-not-allowed bg-background-elevated text-text-muted"
            : ["bg-gradient-brand shadow-brand", "hover:shadow-brand-lg hover:scale-[1.02]", "active:scale-[0.98]"]
        )}
      >
        {!isDisabled && (
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        )}
        <span className="relative flex items-center justify-center gap-2">
          {isProcessing ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="h-5 w-5" fill="currentColor" />
              Pay & Ask
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </span>
      </button>

      {!isDisabled && !isProcessing && (
        <p className="text-center text-xs text-text-muted">
          Paid via MetaMask · Non-custodial · No account needed
        </p>
      )}
    </div>
  );
}

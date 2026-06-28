"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Zap, Sparkles } from "lucide-react";
import type { LoadingPhase } from "@/types";

interface LoadingCardProps {
  phase: LoadingPhase;
}

const PHASES = [
  { id: "receiving-payment", icon: Wallet, label: "Receiving payment...", sub: "Waiting for MetaMask confirmation" },
  { id: "processing-payment", icon: Zap, label: "Confirming on-chain...", sub: "Verifying transaction on Arc" },
  { id: "generating-response", icon: Sparkles, label: "Generating answer...", sub: "AI is processing your question" },
] as const;

export default function LoadingCard({ phase }: LoadingCardProps) {
  const currentIndex = PHASES.findIndex((p) => p.id === phase);

  return (
    <div className="space-y-3 py-2">
      {PHASES.map((p, i) => {
        const Icon = p.icon;
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <AnimatePresence key={p.id}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 ${
                isActive
                  ? "border border-brand-blue/20 bg-brand-blue/5"
                  : isDone
                  ? "opacity-50"
                  : "opacity-25"
              }`}
            >
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                isActive ? "bg-gradient-brand shadow-brand-sm" : isDone ? "bg-success/20" : "bg-background-elevated"
              }`}>
                {isActive ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : isDone ? (
                  <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <Icon className="h-4 w-4 text-text-muted" />
                )}
              </div>
              <div>
                <p className={`text-sm font-semibold ${isActive ? "text-text-primary" : "text-text-muted"}`}>
                  {p.label}
                </p>
                {isActive && <p className="text-xs text-text-muted">{p.sub}</p>}
              </div>
            </motion.div>
          </AnimatePresence>
        );
      })}
    </div>
  );
}

"use client";

import { Zap, Brain, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentDecision } from "@/lib/agent/analyzer";

interface PriceTagProps {
  decision: AgentDecision | null;
  isAnalyzing?: boolean;
  defaultPrice?: string;
}

const TIER_STYLES = {
  simple: "border-green-500/20 bg-green-500/10 text-green-400",
  medium: "border-usdc/20 bg-usdc/10 text-usdc",
  complex: "border-purple-500/20 bg-purple-500/10 text-purple-400",
};

const TIER_LABELS = {
  simple: "Simple",
  medium: "Medium",
  complex: "Complex",
};

export default function PriceTag({
  decision,
  isAnalyzing = false,
  defaultPrice = "0.003",
}: PriceTagProps) {
  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-3 py-1 text-xs font-medium text-brand-blue">
        <div className="h-3 w-3 animate-spin rounded-full border border-brand-blue/30 border-t-brand-blue" />
        Agent analyzing...
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-usdc/20 bg-usdc/10 px-3 py-1 text-xs font-medium text-usdc">
        <div className="h-1.5 w-1.5 rounded-full bg-usdc" />
        {defaultPrice} USDC / question
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Price badge */}
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
          TIER_STYLES[decision.tier]
        )}
      >
        <Zap className="h-3 w-3" fill="currentColor" />
        {decision.priceUsdc} USDC
      </div>

      {/* Tier badge */}
      <div className="hidden items-center gap-1 rounded-full border border-border bg-background-elevated px-2.5 py-1 text-xs text-text-muted sm:flex">
        <Brain className="h-3 w-3" />
        {TIER_LABELS[decision.tier]}
      </div>

      {/* Quality badge */}
      <div className="hidden items-center gap-1 rounded-full border border-border bg-background-elevated px-2.5 py-1 text-xs text-text-muted sm:flex">
        <Clock className="h-3 w-3" />
        {decision.quality === "deep" ? "Deep" : "Fast"}
      </div>
    </div>
  );
}
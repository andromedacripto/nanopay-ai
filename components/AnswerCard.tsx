"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTxHash, formatTimestamp } from "@/lib/utils";

interface AnswerCardProps {
  answer: string;
  transactionHash: string | null;
  timestamp: number;
  onAskAnother: () => void;
}

export default function AnswerCard({
  answer,
  transactionHash,
  timestamp,
  onAskAnother,
}: AnswerCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatInlineText = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return (
          <strong key={i} className="font-semibold text-text-primary">
            {part.slice(2, -2)}
          </strong>
        );
      if (part.startsWith("`") && part.endsWith("`"))
        return (
          <code
            key={i}
            className="rounded bg-background-elevated px-1.5 py-0.5 font-mono text-sm text-brand-cyan"
          >
            {part.slice(1, -1)}
          </code>
        );
      if (part.startsWith("*") && part.endsWith("*"))
        return (
          <em key={i} className="italic text-text-secondary">
            {part.slice(1, -1)}
          </em>
        );
      return part;
    });
  };

  const renderAnswer = (text: string) =>
    text.split("\n").map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      if (line.startsWith("### "))
        return (
          <h3
            key={i}
            className="mb-2 mt-4 text-base font-bold text-text-primary first:mt-0"
          >
            {line.replace("### ", "")}
          </h3>
        );
      if (line.startsWith("## "))
        return (
          <h2
            key={i}
            className="mb-2 mt-4 text-lg font-bold text-text-primary first:mt-0"
          >
            {line.replace("## ", "")}
          </h2>
        );
      if (line.startsWith("- ") || line.startsWith("* "))
        return (
          <li
            key={i}
            className="ml-4 list-disc text-text-secondary leading-relaxed"
          >
            {formatInlineText(line.slice(2))}
          </li>
        );
      if (/^\d+\.\s/.test(line))
        return (
          <li
            key={i}
            className="ml-4 list-decimal text-text-secondary leading-relaxed"
          >
            {formatInlineText(line.replace(/^\d+\.\s/, ""))}
          </li>
        );
      return (
        <p key={i} className="leading-relaxed text-text-secondary">
          {formatInlineText(line)}
        </p>
      );
    });

  return (
    <div className="animate-slide-up rounded-3xl border border-success/20 bg-background-card shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-brand-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">NanoPay AI Answer</h3>
            <p className="text-xs text-text-muted">{formatTimestamp(timestamp)}</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-all hover:border-brand-blue/40 hover:text-text-primary"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>

      {/* Answer body */}
      <div className="p-5">
        <div className="space-y-2 text-sm">{renderAnswer(answer)}</div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        {transactionHash && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-xs text-text-muted">Tx:</span>
            <a
              href={`https://explorer.testnet.arc.network/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-1 font-mono text-xs text-brand-blue",
                "transition-colors hover:text-brand-blue-light"
              )}
            >
              {formatTxHash(transactionHash)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <button
          onClick={onAskAnother}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
            "border border-brand-blue/30 bg-brand-blue/10 text-brand-blue",
            "transition-all duration-200 hover:border-brand-blue/60 hover:bg-brand-blue/20"
          )}
        >
          <RefreshCw className="h-4 w-4" />
          Ask another
        </button>
      </div>
    </div>
  );
}

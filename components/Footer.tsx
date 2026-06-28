"use client";

import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border py-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-brand">
              <Zap className="h-3.5 w-3.5 text-white" fill="currentColor" />
            </div>
            <span className="text-sm font-semibold text-text-primary">
              NanoPay AI
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Built on{" "}
            <a
              href="https://arc.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue hover:underline"
            >
              Arc Network
            </a>
            {" · "}
            Powered by USDC nanopayments · Lepton Hackathon 2026
          </p>
        </div>
      </div>
    </footer>
  );
}

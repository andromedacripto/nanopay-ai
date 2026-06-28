"use client";

import { useState } from "react";
import { Wallet, ChevronDown, Copy, LogOut, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAddress } from "@/lib/utils";
import type { WalletState } from "@/types";

interface WalletButtonProps {
  walletState: WalletState;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export default function WalletButton({ walletState, onConnect, onDisconnect, isConnecting }: WalletButtonProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!walletState.address) return;
    await navigator.clipboard.writeText(walletState.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!walletState.isConnected) {
    return (
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className={cn(
          "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
          "bg-gradient-brand text-white shadow-brand-sm",
          "transition-all duration-200 hover:shadow-brand hover:scale-105",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        )}
      >
        {isConnecting ? (
          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Connecting...</>
        ) : (
          <><Wallet className="h-4 w-4" />Connect Wallet</>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
          "border border-border bg-background-card text-text-primary",
          "transition-all duration-200 hover:border-brand-blue/50 hover:bg-background-elevated"
        )}
      >
        <div className="relative">
          <div className="h-2 w-2 rounded-full bg-success" />
          <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-success opacity-60" />
        </div>
        <span className="font-mono text-xs text-text-accent">{formatAddress(walletState.address || "")}</span>
        {walletState.balance && (
          <span className="hidden rounded-md bg-background-elevated px-1.5 py-0.5 text-xs text-text-secondary sm:block">
            {walletState.balance} USDC
          </span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 text-text-muted transition-transform duration-200", dropdownOpen && "rotate-180")} />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-background-card shadow-card">
            <div className="border-b border-border p-3">
              <p className="text-xs text-text-muted">Connected wallet</p>
              <p className="mt-0.5 font-mono text-sm text-text-primary">{formatAddress(walletState.address || "", 6)}</p>
              {walletState.balance && (
                <p className="mt-1 text-xs text-text-secondary">
                  Balance: <span className="font-semibold text-success">{walletState.balance} USDC</span>
                </p>
              )}
            </div>
            <div className="p-1">
              <button
                onClick={handleCopyAddress}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background-elevated hover:text-text-primary"
              >
                {copied ? <><Check className="h-4 w-4 text-success" />Copied!</> : <><Copy className="h-4 w-4" />Copy address</>}
              </button>
              <button
                onClick={() => { setDropdownOpen(false); onDisconnect(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error transition-colors hover:bg-error-bg"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

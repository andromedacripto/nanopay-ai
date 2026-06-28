"use client";

import { Zap } from "lucide-react";
import WalletButton from "./WalletButton";
import type { WalletState } from "@/types";

interface NavbarProps {
  walletState: WalletState;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export default function Navbar({
  walletState,
  onConnect,
  onDisconnect,
  isConnecting,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand shadow-brand-sm">
            <Zap className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="text-base font-bold text-text-primary">NanoPay AI</span>
          <span className="hidden rounded-full border border-brand-blue/20 bg-brand-blue/10 px-2 py-0.5 text-xs font-medium text-brand-blue sm:block">
            Testnet
          </span>
        </div>
        <WalletButton
          walletState={walletState}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          isConnecting={isConnecting}
        />
      </div>
    </header>
  );
}

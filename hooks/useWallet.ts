"use client";

import { useState, useEffect, useCallback } from "react";
import type { WalletState } from "@/types";
import { connectWallet, buildWalletState, onAccountsChanged, onChainChanged, isWeb3Available } from "@/lib/arc";

const INITIAL_WALLET_STATE: WalletState = { isConnected: false, address: null, balance: null, chainId: null };

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_WALLET_STATE);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      if (!isWeb3Available()) throw new Error("MetaMask not found. Install it at metamask.io");
      const address = await connectWallet();
      const state = await buildWalletState(address);
      setWalletState(state);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error connecting wallet.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => { setWalletState(INITIAL_WALLET_STATE); setError(null); }, []);

  useEffect(() => {
    const removeAccountListener = onAccountsChanged(async (accounts) => {
      if (accounts.length === 0) setWalletState(INITIAL_WALLET_STATE);
      else setWalletState(await buildWalletState(accounts[0]));
    });
    const removeChainListener = onChainChanged((chainIdHex) => {
      setWalletState((prev) => ({ ...prev, chainId: parseInt(chainIdHex, 16) }));
    });
    return () => { removeAccountListener(); removeChainListener(); };
  }, []);

  return { walletState, isConnecting, error, connect, disconnect };
}

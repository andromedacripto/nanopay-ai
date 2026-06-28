import type { ArcNetworkConfig } from "@/types";

/**
 * Configuração oficial da Arc Testnet.
 * Chain ID: 5042002 | Gas token: USDC (6 decimals)
 */
export const ARC_MAINNET: ArcNetworkConfig = {
  chainId: 1252,
  chainName: "Arc Mainnet",
  rpcUrl: "https://rpc.arc.network",
  explorerUrl: "https://explorer.arc.network",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
};

export const ARC_TESTNET: ArcNetworkConfig = {
  chainId: 5042002,
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorerUrl: "https://explorer.testnet.arc.network",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
};

export const ACTIVE_NETWORK: ArcNetworkConfig = ARC_TESTNET;

export const SUPPORTED_CHAIN_IDS = [
  ARC_MAINNET.chainId,
  ARC_TESTNET.chainId,
] as const;

export const CONTRACT_ADDRESSES = {
  USDC_TESTNET: "0x07865c6E87B9F70255377e024ace6630C1Eaa37f",
  USDC_MAINNET: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
} as const;

import type { ArcNetworkConfig } from "@/types";

export const ARC_TESTNET: ArcNetworkConfig = {
  chainId: 5042002,
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorerUrl: "https://testnet.arcscan.app",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18, // native USDC gas token uses 18 decimals on Arc
  },
};

export const ACTIVE_NETWORK: ArcNetworkConfig = ARC_TESTNET;

export const SUPPORTED_CHAIN_IDS = [ARC_TESTNET.chainId] as const;

export const CONTRACT_ADDRESSES = {
  // Confirmed via https://docs.arc.io/arc/references/contract-addresses
  // ERC-20 interface to native USDC, 6 decimals.
  USDC_TESTNET: "0x3600000000000000000000000000000000000000",
} as const;

// Confirmed via https://docs.arc.io/arc/references/gas-and-fees
// "The Arc Testnet enforces a minimum base fee of 160 Gwei... set maxFeePerGas >= 160 Gwei"
export const ARC_MIN_FEE_GWEI = 160n;
export const ARC_MIN_FEE_WEI = ARC_MIN_FEE_GWEI * 1_000_000_000n;

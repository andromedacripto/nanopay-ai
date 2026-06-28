import type { WalletState, ArcNetworkConfig } from "@/types";
import { ACTIVE_NETWORK, SUPPORTED_CHAIN_IDS, CONTRACT_ADDRESSES } from "./config";

export function isWeb3Available(): boolean {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

export async function switchToArcNetwork(network: ArcNetworkConfig = ACTIVE_NETWORK): Promise<void> {
  if (!isWeb3Available()) throw new Error("Web3 not available.");
  const chainIdHex = `0x${network.chainId.toString(16)}`;
  try {
    await window.ethereum!.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
  } catch (switchError: unknown) {
    const error = switchError as { code: number };
    if (error.code === 4902) {
      await window.ethereum!.request({
        method: "wallet_addEthereumChain",
        params: [{ chainId: chainIdHex, chainName: network.chainName, rpcUrls: [network.rpcUrl], blockExplorerUrls: [network.explorerUrl], nativeCurrency: network.nativeCurrency }],
      });
    } else throw switchError;
  }
}

export async function connectWallet(): Promise<string> {
  if (!isWeb3Available()) throw new Error("MetaMask not found. Install it at metamask.io");
  const accounts = (await window.ethereum!.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts || accounts.length === 0) throw new Error("No accounts found in wallet.");
  const chainIdHex = (await window.ethereum!.request({ method: "eth_chainId" })) as string;
  const currentChainId = parseInt(chainIdHex, 16);
  if (!SUPPORTED_CHAIN_IDS.includes(currentChainId as (typeof SUPPORTED_CHAIN_IDS)[number]))
    await switchToArcNetwork(ACTIVE_NETWORK);
  return accounts[0];
}

export async function getCurrentChainId(): Promise<number> {
  if (!isWeb3Available()) return 0;
  const chainIdHex = (await window.ethereum!.request({ method: "eth_chainId" })) as string;
  return parseInt(chainIdHex, 16);
}

export async function getUsdcBalance(address: string): Promise<string> {
  if (!isWeb3Available()) return "0.00";
  try {
    const paddedAddress = address.replace("0x", "").padStart(64, "0");
    const result = (await window.ethereum!.request({
      method: "eth_call",
      params: [{ to: CONTRACT_ADDRESSES.USDC_TESTNET, data: `0x70a08231${paddedAddress}` }, "latest"],
    })) as string;
    if (!result || result === "0x") return "0.00";
    return (Number(BigInt(result)) / 1_000_000).toFixed(2);
  } catch { return "0.00"; }
}

export async function buildWalletState(address: string): Promise<WalletState> {
  const [chainId, balance] = await Promise.all([getCurrentChainId(), getUsdcBalance(address)]);
  return { isConnected: true, address, balance, chainId };
}

export function onAccountsChanged(callback: (accounts: string[]) => void): () => void {
  if (!isWeb3Available()) return () => {};
  const handler = (...args: unknown[]) => callback(args[0] as string[]);
  window.ethereum!.on("accountsChanged", handler);
  return () => window.ethereum!.removeListener("accountsChanged", handler);
}

export function onChainChanged(callback: (chainId: string) => void): () => void {
  if (!isWeb3Available()) return () => {};
  const handler = (...args: unknown[]) => callback(args[0] as string);
  window.ethereum!.on("chainChanged", handler);
  return () => window.ethereum!.removeListener("chainChanged", handler);
}

/**
 * lib/x402/facilitator.ts
 *
 * Security fixes applied:
 *   VUL-8 (atualizado): maxFeePerGas corrigido para 20 Gwei conforme
 *          https://docs.arc.io/arc/references/gas-and-fees
 *          "Set maxFeePerGas to at least 20 Gwei"
 *          maxPriorityFeePerGas = 1 Gwei (recomendado para melhor inclusão)
 *          waitForTransactionReceipt com timeout correto — retorna false
 *          em vez de true no timeout (falha segura).
 *   VUL-7: isAddress() valida payerAddress e receiverAddress antes de
 *          qualquer chamada RPC.
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Arc Testnet chain definition for viem.
// https://docs.arc.io/arc/references/connect-to-arc
const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
});

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

// VUL-8 fix: Arc Testnet minimum base fee is 20 Gwei.
// https://docs.arc.io/arc/references/gas-and-fees
// "Set maxFeePerGas to at least 20 Gwei."
// We use 40 Gwei (2×) for headroom. Priority fee = 1 Gwei as recommended.
const ARC_MIN_FEE_WEI = 20_000_000_000n; // 20 Gwei
const MAX_FEE_WEI = ARC_MIN_FEE_WEI * 2n; // 40 Gwei — safety headroom
const PRIORITY_FEE_WEI = 1_000_000_000n; // 1 Gwei — recommended tip

const ERC20_ABI = [
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function getFacilitatorAccount() {
  const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("FACILITATOR_PRIVATE_KEY is not configured on the server.");
  }
  const normalizedKey = privateKey.startsWith("0x")
    ? (privateKey as `0x${string}`)
    : (`0x${privateKey}` as `0x${string}`);
  return privateKeyToAccount(normalizedKey);
}

function getPublicClient() {
  return createPublicClient({ chain: arcTestnet, transport: http() });
}

function getWalletClient() {
  const account = getFacilitatorAccount();
  return createWalletClient({ account, chain: arcTestnet, transport: http() });
}

export interface SettlementResult {
  success: boolean;
  txHash?: `0x${string}`;
  error?: string;
  reason?:
    | "insufficient_allowance"
    | "insufficient_balance"
    | "tx_reverted"
    | "tx_failed"
    | "config_error"
    | "invalid_address";
}

/**
 * Settles a payment by pulling `amountAtomic` USDC from `payerAddress`
 * to `receiverAddress` via ERC-20 transferFrom.
 *
 * The facilitator wallet pays gas (Arc USDC, min 20 Gwei per docs).
 * Requires the payer to have previously approved the facilitator address.
 * https://docs.arc.io/arc/references/contract-addresses
 */
export async function settlePayment(
  payerAddress: `0x${string}`,
  receiverAddress: `0x${string}`,
  amountAtomic: bigint
): Promise<SettlementResult> {
  // VUL-7: Validate input addresses before any RPC call
  if (!isAddress(payerAddress)) {
    return {
      success: false,
      reason: "invalid_address",
      error: `payerAddress "${payerAddress}" is not a valid EVM address.`,
    };
  }
  if (!isAddress(receiverAddress)) {
    return {
      success: false,
      reason: "invalid_address",
      error: `receiverAddress "${receiverAddress}" is not a valid EVM address.`,
    };
  }

  let facilitatorAccount;
  try {
    facilitatorAccount = getFacilitatorAccount();
  } catch (err) {
    return {
      success: false,
      reason: "config_error",
      error: err instanceof Error ? err.message : "Facilitator not configured.",
    };
  }

  const publicClient = getPublicClient();
  const walletClient = getWalletClient();

  try {
    const [allowance, balance] = await Promise.all([
      publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [payerAddress, facilitatorAccount.address],
      }),
      publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [payerAddress],
      }),
    ]);

    if (balance < amountAtomic) {
      return {
        success: false,
        reason: "insufficient_balance",
        error: `Wallet has ${balance} atomic units but ${amountAtomic} is required.`,
      };
    }

    if (allowance < amountAtomic) {
      return {
        success: false,
        reason: "insufficient_allowance",
        error: `Facilitator allowance is ${allowance} but ${amountAtomic} is required. Approve the facilitator address first.`,
      };
    }

    const txHash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transferFrom",
      args: [payerAddress, receiverAddress, amountAtomic],
      // VUL-8 fix: 40 Gwei max (2× minimum), 1 Gwei priority tip
      // https://docs.arc.io/arc/references/gas-and-fees
      maxFeePerGas: MAX_FEE_WEI,
      maxPriorityFeePerGas: PRIORITY_FEE_WEI,
    });

    // Arc has sub-second finality; 15s is generous
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 15_000,
    });

    if (receipt.status !== "success") {
      return {
        success: false,
        reason: "tx_reverted",
        txHash,
        error: "Transaction reverted on-chain.",
      };
    }

    return { success: true, txHash };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Settlement failed.";

    // VUL-8 fix: timeout → false (fail-safe), not assumed confirmed
    if (message.includes("timed out") || message.includes("timeout")) {
      return {
        success: false,
        reason: "tx_failed",
        error: "Transaction did not confirm within the timeout. Please retry.",
      };
    }

    return { success: false, reason: "tx_failed", error: message };
  }
}

/**
 * Returns the facilitator's public address so the frontend can
 * request the user to `approve()` this exact address.
 */
export function getFacilitatorAddress(): `0x${string}` {
  return getFacilitatorAccount().address;
}
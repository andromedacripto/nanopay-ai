import type { PaymentConfig } from "@/types";

export const PAYMENT_CONFIG: PaymentConfig = {
  amountUsdc: process.env.NEXT_PUBLIC_PAYMENT_AMOUNT || "0.003",
  decimals: 6,
  receiverAddress:
    process.env.PAYMENT_RECEIVER_ADDRESS ||
    "0x0000000000000000000000000000000000000001",
  // Official Arc Testnet USDC contract address
  // Source: https://docs.arc.io/arc/references/contract-addresses
  usdcContractAddress:
    process.env.NEXT_PUBLIC_USDC_CONTRACT ||
    "0x3600000000000000000000000000000000000000",
};

export const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
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
] as const;
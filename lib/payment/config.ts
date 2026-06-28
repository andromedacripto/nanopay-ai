import type { PaymentConfig } from "@/types";

export const PAYMENT_CONFIG: PaymentConfig = {
  amountUsdc: process.env.NEXT_PUBLIC_PAYMENT_AMOUNT || "0.003",
  decimals: 6,
  receiverAddress:
    process.env.PAYMENT_RECEIVER_ADDRESS ||
    "0x0000000000000000000000000000000000000001",
  usdcContractAddress:
    process.env.NEXT_PUBLIC_USDC_CONTRACT ||
    "0x07865c6E87B9F70255377e024ace6630C1Eaa37f",
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

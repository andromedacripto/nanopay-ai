<div align="center">

# ⚡ NanoPay AI

**Premium AI assistant powered by USDC nanopayments on the Arc blockchain.**  
Pay per question. No subscriptions. No accounts. Just answers.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Arc Network](https://img.shields.io/badge/Arc-Testnet-4d8ee9?style=flat-square)](https://arc.io)
[![USDC](https://img.shields.io/badge/USDC-ERC--20-2775CA?style=flat-square&logo=circle)](https://www.circle.com/usdc)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Demo](#) · [Docs](https://docs.arc.io) · [Report Bug](#) · [Request Feature](#)

</div>

---

## What is NanoPay AI?

NanoPay AI is a Web3-native AI assistant where every question costs a fraction of a cent in USDC — settled instantly on the [Arc blockchain](https://arc.io). No wallet custody. No subscriptions. No API keys for the user. Just connect MetaMask, approve once, and ask.

Under the hood, a server-side **facilitator wallet** pulls the USDC via `transferFrom` and pays gas on your behalf. You only sign a one-time ERC-20 `approve()`. Every payment is verified on-chain before the AI ever responds.

```
User asks → Agent prices the question → MetaMask approve() (once)
→ Facilitator settles transferFrom on Arc → On-chain receipt verified
→ Groq LLM answers → Response returned with txHash proof
```

---

## Features

- **Pay-per-use** — fractions of a cent per question, no monthly fees
- **Gasless UX** — server facilitator pays gas; users only sign one approval
- **On-chain verified** — every AI call requires a confirmed USDC Transfer event on Arc
- **Autonomous agent** — analyzes each question and picks the right model + tier automatically
- **Replay-proof** — each transaction hash can only unlock one AI response
- **Arc-native** — built on Arc Testnet with EIP-1559 fee handling per [Arc gas docs](https://docs.arc.io/arc/references/gas-and-fees)
- **TypeScript strict** — zero `any`, zero build warnings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Blockchain | [Arc Testnet](https://docs.arc.io/arc/references/connect-to-arc) (Chain ID 5042002) |
| Stablecoin | USDC ERC-20 on Arc (`0x3600...0000`) |
| On-chain reads | [viem](https://viem.sh) v2 |
| AI provider | [Groq](https://groq.com) (llama-3.1-8b-instant / llama-3.3-70b-versatile) |
| Wallet | MetaMask (EIP-1193) |
| Language | TypeScript 5 (strict) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Next.js)                   │
│                                                         │
│  useWallet ──► MetaMask ──► approve(facilitator, amount)│
│  useNanoPay ──► /api/analyze ──► AgentDecision          │
│             ──► executeX402Payment()                    │
│                    │                                    │
│                    ▼                                    │
│             /api/x402/settle  ◄── payerAddress          │
│                    │               amountUsdc (validated│
│                    │               against known tiers) │
│                    ▼                                    │
│          facilitator.settlePayment()                    │
│          transferFrom(payer → receiver)  ──► Arc chain  │
│                    │                                    │
│                    ▼                                    │
│             txHash returned                             │
│                    │                                    │
│                    ▼                                    │
│          /api/chat  ◄── X-Transaction-Hash              │
│          withVerifiedPayment()                          │
│          verifySettledPayment() ──► getTransactionReceipt│
│          (checks Transfer event on-chain)               │
│                    │                                    │
│                    ▼                                    │
│          Groq LLM ──► answer returned                   │
└─────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MetaMask browser extension
- Arc Testnet USDC (free from [Circle Faucet](https://faucet.circle.com/))
- Groq API key (free at [console.groq.com](https://console.groq.com/keys))

### 1. Clone & install

```bash
git clone https://github.com/your-username/nanopay-ai.git
cd nanopay-ai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# AI
GROQ_API_KEY=your_groq_api_key_here

# Arc Blockchain
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=5042002

# USDC contract (Arc Testnet — do not change)
USDC_CONTRACT_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_USDC_CONTRACT=0x3600000000000000000000000000000000000000

# Your wallet that receives payments
PAYMENT_RECEIVER_ADDRESS=0xYourReceiverWalletAddress
NEXT_PUBLIC_RECEIVER_ADDRESS=0xYourReceiverWalletAddress

# Server-side facilitator wallet (pays gas for transferFrom)
# NEVER expose this key on the frontend
FACILITATOR_PRIVATE_KEY=0xYourFacilitatorPrivateKey

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PAYMENT_AMOUNT=0.003
```

> **Security:** `FACILITATOR_PRIVATE_KEY` is server-only. It never touches the client bundle. Keep the facilitator wallet funded with a small amount of Arc USDC to cover gas.

### 3. Add MetaMask network

Add Arc Testnet manually or programmatically (the app does this automatically):

| Field | Value |
|---|---|
| Network Name | Arc Testnet |
| RPC URL | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency Symbol | USDC |
| Block Explorer | `https://testnet.arcscan.app` |

### 4. Fund the facilitator wallet

Get free testnet USDC from the [Circle Faucet](https://faucet.circle.com/) — select **Arc Testnet** and paste your facilitator wallet address. A small amount (1–5 USDC) is enough to pay gas for thousands of settlements.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect MetaMask, and ask your first question.

---

## Payment Flow (step by step)

1. **User asks a question** → the autonomous agent analyzes it and picks a tier + price
2. **Frontend checks allowance** → if the facilitator isn't approved for enough USDC, MetaMask pops up for a one-time `approve()` (covers 1000 questions worth of allowance)
3. **Server settles** → `POST /api/x402/settle` calls `transferFrom(user → receiver)` from the facilitator wallet; Arc confirms in < 1 second
4. **Payment verified** → `POST /api/chat` reads the on-chain receipt and checks the Transfer event — amount, receiver, and status are all verified on-chain, not trusted from the client
5. **AI responds** → Groq generates the answer; response includes the `txHash` as proof of payment

---

## Pricing Tiers

| Tier | Price | Model | Use case |
|---|---|---|---|
| `simple` | 0.001 USDC | llama-3.1-8b-instant | Quick facts, definitions |
| `standard` | 0.003 USDC | llama-3.1-8b-instant | General questions |
| `complex` | 0.005 USDC | llama-3.3-70b-versatile | Analysis, coding, reasoning |
| `deep` | 0.010 USDC | llama-3.3-70b-versatile | Deep research, long-form |
| `expert` | 0.020 USDC | llama-3.3-70b-versatile | Expert-level synthesis |

The agent automatically classifies each question — users never pick a tier manually.

---

## API Reference

### `GET /api/x402/settle`
Returns the facilitator's public address so the client knows who to `approve()`.

```json
{ "success": true, "facilitatorAddress": "0x..." }
```

### `POST /api/x402/settle`
Settles a payment via `transferFrom`. The `receiverAddress` field in the body is **ignored** — the server always uses `PAYMENT_RECEIVER_ADDRESS` from the environment.

```json
// Request
{ "payerAddress": "0x...", "amountUsdc": "0.003" }

// Response
{ "success": true, "txHash": "0x..." }
```

### `POST /api/chat`
Returns an AI answer. Requires `X-Transaction-Hash` header pointing to a confirmed, unspent USDC settlement on Arc.

```http
POST /api/chat
X-Transaction-Hash: 0x...
Content-Type: application/json

{ "question": "Explain EIP-1559", "model": "llama-3.1-8b-instant", "tier": "standard" }
```

---

## Security

This project was audited and patched for 8 vulnerabilities. Key protections:

- **Receiver address** is always read from the server environment — the client cannot redirect funds
- **Amount validation** — only known tier amounts are accepted; arbitrary amounts are rejected
- **Replay protection** — each `txHash` can only unlock one AI response (in-memory `Set`, Redis-ready)
- **Price enforcement** — the `X-Expected-Amount` client header is completely ignored; price comes from the server route
- **On-chain verification** — Transfer event is decoded from the actual receipt; no trust in client-supplied data
- **Address validation** — `isAddress()` (viem) validates all addresses before any RPC call
- **Gas compliance** — `maxFeePerGas` set to 40 Gwei (2× Arc's 20 Gwei minimum per [docs](https://docs.arc.io/arc/references/gas-and-fees))
- **Fail-safe timeouts** — unconfirmed transactions after timeout return `false`, not `true`

---

## Project Structure

```
nanopay-ai/
├── app/
│   ├── page.tsx                   # Main UI
│   └── api/
│       ├── analyze/route.ts       # Agent question analyzer
│       ├── chat/route.ts          # AI endpoint (payment-gated)
│       ├── payment/route.ts       # Legacy payment helper
│       └── x402/settle/route.ts  # USDC settlement endpoint
├── hooks/
│   ├── useNanoPay.ts              # Core payment + AI flow
│   └── useWallet.ts               # MetaMask connection
├── lib/
│   ├── arc/
│   │   ├── config.ts              # Chain config, contract addresses
│   │   └── wallet.ts              # USDC balance, allowance, network switch
│   ├── x402/
│   │   ├── client.ts              # Frontend payment executor
│   │   ├── facilitator.ts         # Server-side transferFrom settler
│   │   ├── payment-guard.ts       # On-chain payment verifier + route guard
│   │   └── replay-store.ts        # In-memory replay protection singleton
│   ├── payment/
│   │   └── processor.ts           # MetaMask direct transfer helper
│   └── agent/
│       └── analyzer.ts            # Question classification agent
└── types/
    └── index.ts                   # Shared TypeScript types
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | Groq API key for LLM access |
| `FACILITATOR_PRIVATE_KEY` | ✅ | Server wallet private key (pays gas) — **never expose** |
| `PAYMENT_RECEIVER_ADDRESS` | ✅ | Wallet that receives USDC payments |
| `NEXT_PUBLIC_RECEIVER_ADDRESS` | ✅ | Same address, exposed to frontend for approval flow |
| `NEXT_PUBLIC_USDC_CONTRACT` | ✅ | USDC ERC-20 address on Arc (`0x3600...`) |
| `ARC_RPC_URL` | optional | Defaults to `https://rpc.testnet.arc.network` |
| `NEXT_PUBLIC_PAYMENT_AMOUNT` | optional | Default payment amount in USDC (default: `0.003`) |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

```bash
# Fork & clone, then:
npm install
npm run dev       # development
npm run lint      # ESLint
npm run build     # production build (must pass before PR)
```

All PRs must pass `npm run build` with zero TypeScript errors and zero ESLint warnings.

---

## Roadmap

- [ ] Redis-backed replay store (replace in-memory Set)
- [ ] Multi-model selector UI
- [ ] Streaming AI responses
- [ ] Mainnet Arc support
- [ ] Payment history dashboard
- [ ] Rate limiting per wallet address
- [ ] Support for EURC payments

---

## Resources

- [Arc Developer Docs](https://docs.arc.io)
- [Arc Gas & Fees](https://docs.arc.io/arc/references/gas-and-fees)
- [Arc Contract Addresses](https://docs.arc.io/arc/references/contract-addresses)
- [Arc Testnet Explorer](https://testnet.arcscan.app)
- [Circle Faucet (testnet USDC)](https://faucet.circle.com/)
- [Groq Console](https://console.groq.com)

---

## License

MIT © 2025 Ricardo Gamarra

---

<div align="center">
  <sub>Built on <a href="https://arc.io">Arc</a> · Powered by <a href="https://groq.com">Groq</a> · Secured with <a href="https://viem.sh">viem</a></sub>
</div>

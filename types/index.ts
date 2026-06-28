// =============================================
// NanoPay AI - Tipos TypeScript Centralizados
// =============================================

// ---- Estado da Aplicação ----

export type AppStep =
  | "idle"
  | "wallet-connected"
  | "payment-pending"
  | "payment-processing"
  | "ai-processing"
  | "completed"
  | "error";

export type LoadingPhase =
  | "receiving-payment"
  | "processing-payment"
  | "generating-response";

// ---- Wallet / Blockchain ----

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
}

export interface ArcNetworkConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  status: "success" | "failed";
  gasUsed: string;
  timestamp: number;
}

// ---- Pagamento ----

export interface PaymentRequest {
  senderAddress: string;
  amount: string;
  question: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionHash: string | null;
  error: string | null;
  timestamp: number;
}

export interface PaymentVerification {
  isValid: boolean;
  transactionHash: string;
  amount: string;
  sender: string;
  timestamp: number;
}

export interface PaymentConfig {
  amountUsdc: string;
  decimals: number;
  receiverAddress: string;
  usdcContractAddress: string;
}

// ---- Chat / AI ----

export interface ChatRequest {
  question: string;
  walletAddress?: string;
  transactionHash?: string;
}

export interface ChatResponse {
  answer: string;
  model: string;
  tokens: number;
  timestamp: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ---- API Responses ----

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---- Verificação de Pagamento ----

export interface VerifyPaymentRequest {
  transactionHash: string;
  senderAddress: string;
  expectedAmount: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  transactionHash: string;
  error?: string;
}

// ---- UI State ----

export interface NotificationState {
  type: "success" | "error" | "info" | "warning";
  message: string;
  id: string;
}

export interface UIState {
  step: AppStep;
  loadingPhase: LoadingPhase | null;
  notifications: NotificationState[];
  currentAnswer: string | null;
  transactionHash: string | null;
  error: string | null;
}

// ---- Ethereum Provider (Window) ----

export interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => void;
}

// Extensão da interface global Window
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

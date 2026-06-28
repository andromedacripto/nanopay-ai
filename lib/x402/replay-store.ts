/**
 * lib/x402/replay-store.ts
 *
 * In-memory singleton for replay protection.
 * Kept in its own module so it is NOT exported from any route.ts
 * (Next.js route handlers must not export non-HTTP-handler symbols).
 *
 * Both /api/x402/settle and /api/chat import from here.
 *
 * NOTE: This is a process-level Set — it resets on server restart.
 * For production, replace with Redis / a DB-backed store.
 */

/** Settlement IDs already processed by /api/x402/settle */
export const usedSettlementIds = new Set<string>();

/** Transaction hashes already consumed by /api/chat */
export const consumedTxHashes = new Set<string>();
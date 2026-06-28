/**
 * Utilitários de formatação para endereços, valores e datas.
 */

/**
 * Abrevia um endereço Ethereum para exibição.
 * Ex: 0x1234...5678
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Formata um valor USDC com casas decimais fixas.
 */
export function formatUsdc(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(3);
}

/**
 * Formata um hash de transação para exibição.
 */
export function formatTxHash(hash: string, chars = 8): string {
  if (!hash) return "";
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Formata timestamp Unix para data legível.
 */
export function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

/**
 * Converte USDC para unidades atômicas (6 decimais).
 */
export function usdcToAtomicUnits(amount: string): bigint {
  const [integer, decimal = ""] = amount.split(".");
  const paddedDecimal = decimal.padEnd(6, "0").slice(0, 6);
  return BigInt(integer + paddedDecimal);
}

/**
 * Converte unidades atômicas USDC para string legível.
 */
export function atomicUnitsToUsdc(units: bigint): string {
  const str = units.toString().padStart(7, "0");
  const integer = str.slice(0, -6) || "0";
  const decimal = str.slice(-6);
  return `${integer}.${decimal}`;
}

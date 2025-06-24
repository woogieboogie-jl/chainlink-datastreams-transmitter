import { formatUnits } from 'viem';
import { PublicKey } from '@solana/web3.js';

export const formatUSD = (n: bigint) =>
  (Number(formatUnits(n, 8)) / 10 ** 10).toFixed(2);
export const abs = (n: bigint) => (n < 0n ? -n : n);
export const isPositive = (n: bigint) => (n >= 0n ? true : false);
export function printError(error: unknown) {
  if (error instanceof Error && error.message) return `ERROR: ${error.message}`;
  return `ERROR: ${JSON.stringify(error, bigIntReplacer)}`;
}

function bigIntReplacer(key: string, value: unknown) {
  if (typeof value === 'bigint') {
    return value.toString() + 'n';
  }
  return value;
}

export function base64ToHex(base64: string): string {
  const binary = Buffer.from(base64, 'base64');
  return binary.toString('hex');
}

export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function isValidSolanaId(id: string): boolean {
  try {
    new PublicKey(id);
    return true;
  } catch {
    return false;
  }
}

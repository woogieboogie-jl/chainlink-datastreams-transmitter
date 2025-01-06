import { formatUnits } from 'viem';

export const formatUSD = (n: bigint) =>
  (Number(formatUnits(n, 8)) / 10 ** 10).toFixed(2);
export const abs = (n: bigint) => (n < 0n ? -n : n);
export const isPositive = (n: bigint) => (n >= 0n ? true : false);

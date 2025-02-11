import { Report } from '@hackbg/chainlink-datastreams-consumer';
import { Hex } from 'viem';

export type StreamReport = Report & {
  validFromTimestamp: bigint;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: bigint;
  bid: bigint;
  ask: bigint;
  rawReport: Hex;
};

export type ReportV3 = {
  feedId: Hex;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  price: bigint;
  bid: bigint;
  ask: bigint;
};

export type ReportV4 = {
  feedId: Hex;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  price: bigint;
  marketStatus: number;
};

export type Config = {
  clientConfig: {
    intervalSchedule: string;
  };
};

export type Feed = { name: string; feedId: string };
export type Interval = { interval: string };

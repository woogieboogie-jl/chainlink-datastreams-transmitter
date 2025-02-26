import { Report } from '@hackbg/chainlink-datastreams-consumer';
import { Abi, Address, Chain, Hex } from 'viem';

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

export type Feed = { name: string; feedId: string };
export type Interval = { interval: string };

export type Config = {
  chainId: number;
  chains: Chain[];
  verifierAddresses: { chainId: number; address: Address }[];
  feeds: {
    name: string;
    feedId: Hex;
  }[];
  targetContracts: {
    feedId: Hex;
    address: Address;
    abi: Abi;
    functionName: string;
    functionArgs: string[];
  }[];
  gasCap: string;
  interval: string;
  priceDelta: string;
};

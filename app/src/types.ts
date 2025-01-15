import { Report } from '@hackbg/chainlink-datastreams-consumer';
import { Address, Hex } from 'viem';

export type ReportV3 = Report & {
  validFromTimestamp: bigint;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: bigint;
  bid: bigint;
  ask: bigint;
  rawReport: Hex;
};

export type Config = {
  cdcConfig: {
    hostname: string;
    whHostname: string;
    clientId: string;
    clientSecret: string;
  };
  onChainConfig: { privateKey: Hex; contractAddress: Address };
  clientConfig: {
    priceDelta: string;
    intervalSchedule: string;
    feeds: { name: string; feedId: string }[];
  };
};

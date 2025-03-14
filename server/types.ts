import { Idl } from '@coral-xyz/anchor';
import { Report } from '@hackbg/chainlink-datastreams-consumer';
import { Abi, Address, Hex } from 'viem';

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
  rawReport: Hex;
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
  rawReport: Hex;
};

export type Feed = { name: string; feedId: string };
export type Interval = { interval: string };

export type Config = {
  chainId: number;
  chains: {
    id: number | string;
    name: string;
    currencyName: string;
    currencySymbol: string;
    currencyDecimals: number | string;
    rpc: string;
    testnet?: string | boolean;
  }[];
  verifierAddresses: { chainId: number; address: Address }[];
  feeds: {
    name: string;
    feedId: Hex;
  }[];
  targetChains: {
    chainId: number | string;
    targetContracts: {
      feedId: Hex;
      skipVerify?: boolean;
      address: Address;
      abi: Abi;
      functionName: string;
      functionArgs: string[];
    }[];
  }[];
  gasCap: string;
  interval: string;
  priceDeltaPercentage: number | string;
  vm?: 'evm' | 'svm';
  svm?: {
    cluster?: string;
    chains?: {
      cluster: string;
      name: string;
      rpcUrl: string;
      testnet: string | boolean;
    }[];
    verifierPrograms?: {
      cluster: string;
      verifierProgramID: string;
      accessControllerAccount: string;
    }[];
    targetChains: {
      cluster: string;
      targetPrograms: {
        feedId: Hex;
        instructionName: string;
        instructionArgs: { name: string; type: 'string' | 'number' }[];
        instructionPDA: string;
        idl: Idl;
      }[];
    }[];
  };
};

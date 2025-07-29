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
  parameterPayload?: Hex;
};

export type ReportV3 = {
  reportVersion: number;
  verifiedReport: Hex;
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
  parameterPayload?: Hex;
};

export type ReportV4 = {
  reportVersion: number;
  verifiedReport: Hex;
  feedId: Hex;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  price: bigint;
  marketStatus: number;
  rawReport: Hex;
  parameterPayload?: Hex;
};

// Add individual report types for standardization
export type ReportV2 = {
  reportVersion: number;
  verifiedReport: Hex;
  feedId: Hex;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  price: bigint;
  rawReport: Hex;
  parameterPayload?: Hex;
};

export type ReportV5 = {
  reportVersion: number;
  verifiedReport: Hex;
  feedId: Hex;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  rate: bigint;
  timestamp: number;
  duration: number;
  rawReport: Hex;
  parameterPayload?: Hex;
};

export type ReportV6 = {
  reportVersion: number;
  verifiedReport: Hex;
  feedId: Hex;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  price: bigint;
  price2: bigint;
  price3: bigint;
  price4: bigint;
  price5: bigint;
  rawReport: Hex;
  parameterPayload?: Hex;
};

export type ReportV7 = {
  reportVersion: number;
  verifiedReport: Hex;
  feedId: Hex;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  exchangeRate: bigint;
  rawReport: Hex;
  parameterPayload?: Hex;
};

export type ReportV8 = {
  reportVersion: number;
  verifiedReport: Hex;
  feedId: Hex;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  lastUpdateTimestamp: bigint;
  price: bigint;
  marketStatus: number;
  rawReport: Hex;
  parameterPayload?: Hex;
};

export type ReportV9 = {
  reportVersion: number;
  verifiedReport: Hex;
  feedId: Hex;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  benchmark: bigint;
  navDate: bigint;
  aum: bigint;
  ripcord: number;
  rawReport: Hex;
  parameterPayload?: Hex;
};

export type ReportV10 = {
  reportVersion: number;
  verifiedReport: Hex;
  feedId: Hex;
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  lastUpdateTimestamp: bigint;
  price: bigint;
  marketStatus: number;
  currentMultiplier: bigint;
  newMultiplier: bigint;
  activationDateTime: number;
  tokenizedPrice: bigint;
  rawReport: Hex;
  parameterPayload?: Hex;
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
        skipVerify?: boolean;
        instructionName: string;
        instructionArgs: { name: string; type: 'string' | 'number' }[];
        instructionPDA: string;
        idl: Idl;
      }[];
    }[];
  };
};

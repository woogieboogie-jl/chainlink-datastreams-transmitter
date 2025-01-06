import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import ChainlinkDatastreamsConsumer from '@hackbg/chainlink-datastreams-consumer';
import { createPublicClient, createWalletClient, Hash, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';
import { Config, ReportV3 } from './types';
import { abi } from './abi';

const {
  cdcConfig,
  clientConfig,
  onChainConfig: { privateKey, contractAddress },
} = load(readFileSync('config.yml', 'utf8')) as Config;

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(),
});

const walletClient = createWalletClient({
  chain: hardhat,
  transport: http(),
});

const account = privateKeyToAccount(privateKey);

export async function getPrice() {
  return await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: 'get',
  });
}

export async function setPrice(report: ReportV3) {
  const { request } = await publicClient.simulateContract({
    account,
    address: contractAddress,
    abi,
    functionName: 'set',
    args: [
      {
        feedId: report.feedId as Hash,
        validFromTimestamp: report.validFromTimestamp,
        observationsTimestamp: report.observationsTimestamp,
        nativeFee: report.nativeFee,
        linkFee: report.linkFee,
        expiresAt: report.expiresAt,
        price: report.benchmarkPrice,
        bid: report.bid,
        ask: report.ask,
      },
    ],
  });
  const hash = await walletClient.writeContract(request);
  return await publicClient.waitForTransactionReceipt({ hash });
}

export const cdc = new ChainlinkDatastreamsConsumer({
  ...cdcConfig,
  feeds: [clientConfig.feedId],
});

export const priceDelta = BigInt(clientConfig.priceDelta);
export const interval = clientConfig.interval;

import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import ChainlinkDatastreamsConsumer from '@hackbg/chainlink-datastreams-consumer';
import { createPublicClient, createWalletClient, Hash, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { avalancheFuji } from 'viem/chains';
import { Config, ReportV3 } from './types';
import { abi } from './abi';
import path from 'path';

const {
  cdcConfig,
  clientConfig,
  onChainConfig: { privateKey, contractAddress },
} = load(
  readFileSync(path.resolve(__dirname, '../config.yml'), 'utf8')
) as Config;

const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(),
});

const walletClient = createWalletClient({
  chain: avalancheFuji,
  transport: http(),
});

const account = privateKeyToAccount(privateKey);

export async function getPrice() {
  return await publicClient.readContract({
    address: contractAddress,
    abi,
    functionName: 'lastDecodedPrice',
  });
}

export async function setPrice(report: ReportV3) {
  const nonce = await publicClient.getTransactionCount(account);
  const { request } = await publicClient.simulateContract({
    nonce,
    account,
    address: contractAddress,
    abi,
    functionName: 'verifyReport',
    args: [report.rawReport],
  });
  const hash = await walletClient.writeContract(request);
  return await publicClient.waitForTransactionReceipt({ hash });
}

export const cdc = new ChainlinkDatastreamsConsumer({
  ...cdcConfig,
  feeds: clientConfig.feeds.map(({ feedId }) => feedId),
});

export const priceDelta = BigInt(clientConfig.priceDelta);
export const interval = clientConfig.intervalSchedule;
export const feeds = clientConfig.feeds;

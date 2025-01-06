import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import ChainlinkDatastreamsConsumer from '@hackbg/chainlink-datastreams-consumer';
import { createPublicClient, createWalletClient, Hash, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { avalancheFuji } from 'viem/chains';
import { Config, ReportV3 } from './types';
import { abi } from './abi';

const {
  cdcConfig,
  clientConfig,
  onChainConfig: { privateKey, contractAddress },
} = load(readFileSync('config.yml', 'utf8')) as Config;

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
  const { request } = await publicClient.simulateContract({
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
  feeds: [clientConfig.feedId],
});

export const priceDelta = BigInt(clientConfig.priceDelta);
export const interval = clientConfig.intervalMin * 60 * 1000;

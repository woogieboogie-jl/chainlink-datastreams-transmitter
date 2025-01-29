import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import ChainlinkDatastreamsConsumer from '@hackbg/chainlink-datastreams-consumer';
import {
  createPublicClient,
  createWalletClient,
  decodeAbiParameters,
  encodeAbiParameters,
  http,
  erc20Abi,
  formatEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { avalancheFuji } from 'viem/chains';
import { Config, ReportV3, ReportV4, StreamReport } from './types';
import { feeManagerAbi, verifierProxyAbi } from './abi';
import path from 'path';
import { logger } from './logger';

const __dirname = import.meta.dirname;

const {
  cdcConfig,
  clientConfig,
  onChainConfig: { privateKey, verifierProxyAddress },
} = load(
  readFileSync(
    path.resolve(
      __dirname,
      process.env.NODE_ENV === 'production'
        ? '../../config.yml'
        : '../config.yml'
    ),
    'utf8'
  )
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

export const accountAddress = account.address;

export async function setPrice(report: ReportV3 | ReportV4) {
  return { status: 'success' };
  // logger.info('📝 Prepared verification transaction', report);
  // const { request } = await publicClient.simulateContract({
  //   account,
  //   address: contractAddress,
  //   abi: contractAbi,
  //   functionName: 'setReport',
  //   args: [report],
  // });
  // logger.info('ℹ️ Transaction simulated', request);
  // const hash = await walletClient.writeContract(request);
  // logger.info(`⌛️ Sending transaction ${hash} `, hash);
  // return await publicClient.waitForTransactionReceipt({ hash });
}

export const cdc = new ChainlinkDatastreamsConsumer({
  ...cdcConfig,
  feeds: clientConfig.feeds.map(({ feedId }) => feedId),
});

export const priceDelta = BigInt(clientConfig.priceDelta);
export const interval = clientConfig.intervalSchedule;
export const feeds = clientConfig.feeds;

export async function getContractAddresses() {
  const feeManagerAddress = await publicClient.readContract({
    address: verifierProxyAddress,
    abi: verifierProxyAbi,
    functionName: 's_feeManager',
  });
  const rewardManagerAddress = await publicClient.readContract({
    address: feeManagerAddress,
    abi: feeManagerAbi,
    functionName: 'i_rewardManager',
  });
  const feeTokenAddress = await publicClient.readContract({
    address: feeManagerAddress,
    abi: feeManagerAbi,
    functionName: 'i_linkAddress',
  });

  return {
    verifierProxyAddress,
    feeManagerAddress,
    rewardManagerAddress,
    feeTokenAddress,
  };
}

export async function verifyReport(report: StreamReport) {
  const [, reportData] = decodeAbiParameters(
    [
      { type: 'bytes32[3]', name: '' },
      { type: 'bytes', name: 'reportData' },
    ],
    report.rawReport
  );

  const reportVersion = reportData.charAt(5);
  if (reportVersion !== '3' && reportVersion !== '4') {
    logger.warn('⚠️ Invalid report version', report);
    return;
  }

  const {
    feeManagerAddress,
    rewardManagerAddress,
    feeTokenAddress,
    verifierProxyAddress,
  } = await getContractAddresses();

  const [fee] = await publicClient.readContract({
    address: feeManagerAddress,
    abi: feeManagerAbi,
    functionName: 'getFeeAndReward',
    args: [account.address, reportData, feeTokenAddress],
  });

  const feeTokenAddressEncoded = encodeAbiParameters(
    [{ type: 'address', name: 'parameterPayload' }],
    [feeTokenAddress]
  );

  const approveLinkGas = await publicClient.estimateContractGas({
    account,
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [rewardManagerAddress, fee.amount],
  });
  const { request: approveLinkRequest } = await publicClient.simulateContract({
    account,
    address: feeTokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [rewardManagerAddress, fee.amount],
  });
  const approveLinkHash = await walletClient.writeContract(approveLinkRequest);
  await publicClient.waitForTransactionReceipt({ hash: approveLinkHash });

  const verifyReportGas = await publicClient.estimateContractGas({
    account,
    address: verifierProxyAddress,
    abi: verifierProxyAbi,
    functionName: 'verify',
    args: [report.rawReport, feeTokenAddressEncoded],
  });
  const { request: verifyReportRequest, result: verifiedReportData } =
    await publicClient.simulateContract({
      account,
      address: verifierProxyAddress,
      abi: verifierProxyAbi,
      functionName: 'verify',
      args: [report.rawReport, feeTokenAddressEncoded],
    });
  const verifyReportHash = await walletClient.writeContract(
    verifyReportRequest
  );
  await publicClient.waitForTransactionReceipt({ hash: verifyReportHash });

  logger.info(
    `⛽️ Estimated fee: ${formatEther(
      fee.amount
    )} LINK | Estimated gas: ${formatEther(approveLinkGas + verifyReportGas)} ${
      publicClient.chain.nativeCurrency.symbol
    }`,
    { fee, approveLinkGas, verifyReportGas }
  );

  if (reportVersion === '3') {
    const [
      feedId,
      validFromTimestamp,
      observationsTimestamp,
      nativeFee,
      linkFee,
      expiresAt,
      price,
      bid,
      ask,
    ] = decodeAbiParameters(
      [
        { type: 'bytes32', name: 'feedId' },
        { type: 'uint32', name: 'validFromTimestamp' },
        { type: 'uint32', name: 'observationsTimestamp' },
        { type: 'uint192', name: 'nativeFee' },
        { type: 'uint192', name: 'linkFee' },
        { type: 'uint32', name: 'expiresAt' },
        { type: 'int192', name: 'price' },
        { type: 'int192', name: 'bid' },
        { type: 'int192', name: 'ask' },
      ],
      verifiedReportData
    );
    const verifiedReport: ReportV3 = {
      feedId,
      validFromTimestamp,
      observationsTimestamp,
      nativeFee,
      linkFee,
      expiresAt,
      price,
      bid,
      ask,
    };
    return verifiedReport;
  }
  if (reportVersion === '4') {
    const [
      feedId,
      validFromTimestamp,
      observationsTimestamp,
      nativeFee,
      linkFee,
      expiresAt,
      price,
      marketStatus,
    ] = decodeAbiParameters(
      [
        { type: 'bytes32', name: 'feedId' },
        { type: 'uint32', name: 'validFromTimestamp' },
        { type: 'uint32', name: 'observationsTimestamp' },
        { type: 'uint192', name: 'nativeFee' },
        { type: 'uint192', name: 'linkFee' },
        { type: 'uint32', name: 'expiresAt' },
        { type: 'int192', name: 'price' },
        { type: 'uint32', name: 'marketStatus' },
      ],
      verifiedReportData
    );
    const verifiedReport: ReportV4 = {
      feedId,
      validFromTimestamp,
      observationsTimestamp,
      nativeFee,
      linkFee,
      expiresAt,
      price,
      marketStatus,
    };
    return verifiedReport;
  }
}

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
  zeroAddress,
  isAddress,
  isAddressEqual,
  Abi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Config, ReportV3, ReportV4, StreamReport } from './types';
import { feeManagerAbi, verifierProxyAbi } from './abi';
import path from 'path';
import { logger } from './logger';
import { chains } from './chains';
import { verifiers } from './verifiers';

const __dirname = import.meta.dirname;

const {
  cdcConfig,
  clientConfig,
  onChainConfig: { privateKey, chainId, contractAddress },
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

let chain = chains.find((chain) => chain.id === chainId);

const account = privateKeyToAccount(privateKey);

export const getChainId = () => chain?.id;

export const switchChain = (id: number) =>
  (chain = chains.find((chain) => chain.id === id));

export const accountAddress = account.address;

export async function executeContract({
  report,
  abi,
  functionName,
  functionArgs,
}: {
  report: ReportV3;
  abi: Abi;
  functionName: string;
  functionArgs: string[];
}) {
  if (!abi || abi.length === 0) {
    logger.warn('⚠️ No abi provided');
    return;
  }
  if (!functionName || functionName.length === 0) {
    logger.warn('⚠️ No functionName provided');
    return;
  }
  if (!functionArgs || functionArgs.length === 0) {
    logger.warn('⚠️ No args provided');
    return;
  }

  logger.info('📝 Prepared verification transaction', report);
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });
  const walletClient = createWalletClient({
    chain,
    transport: http(),
  });

  const args = functionArgs.map((arg) => report[arg as keyof ReportV3]);

  const gas = await publicClient.estimateContractGas({
    account,
    address: contractAddress,
    abi,
    functionName,
    args,
  });
  const { request } = await publicClient.simulateContract({
    account,
    address: contractAddress,
    abi,
    functionName,
    args,
  });

  logger.info(
    `⛽️ Estimated gas: ${formatEther(gas)} ${
      publicClient.chain?.nativeCurrency.symbol
    }`,
    { gas }
  );
  logger.info('ℹ️ Transaction simulated', request);
  const hash = await walletClient.writeContract(request);
  logger.info(`⌛️ Sending transaction ${hash} `, hash);
  return await publicClient.waitForTransactionReceipt({ hash });
}

export const cdc = new ChainlinkDatastreamsConsumer({
  ...cdcConfig,
  feeds: clientConfig.feeds.map(({ feedId }) => feedId),
});

export const priceDelta = BigInt(clientConfig.priceDelta);
export const interval = clientConfig.intervalSchedule;
export const feeds = clientConfig.feeds;

export async function getContractAddresses() {
  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const verifierProxyAddress = verifiers[chain!.id];

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
  } catch (error) {
    logger.error('ERROR', error);
    return {
      verifierProxyAddress: zeroAddress,
      feeManagerAddress: zeroAddress,
      rewardManagerAddress: zeroAddress,
      feeTokenAddress: zeroAddress,
    };
  }
}

export async function verifyReport(report: StreamReport) {
  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

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

    const contractAddresses = await getContractAddresses();

    if (
      Object.values(contractAddresses)
        .map((address) => isAddressValid(address))
        .includes(false)
    )
      return;

    const {
      feeManagerAddress,
      rewardManagerAddress,
      feeTokenAddress,
      verifierProxyAddress,
    } = contractAddresses;

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

    const walletClient = createWalletClient({
      chain,
      transport: http(),
    });

    const approveLinkGas = await publicClient.estimateContractGas({
      account,
      address: feeTokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [rewardManagerAddress, fee.amount],
    });
    const { request: approveLinkRequest } = await publicClient.simulateContract(
      {
        account,
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [rewardManagerAddress, fee.amount],
      }
    );
    const approveLinkHash = await walletClient.writeContract(
      approveLinkRequest
    );
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
      )} LINK | Estimated gas: ${formatEther(
        approveLinkGas + verifyReportGas
      )} ${publicClient.chain?.nativeCurrency.symbol}`,
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
  } catch (error) {
    logger.error('ERROR', error);
  }
}

const isAddressValid = (address: string) =>
  !isAddress(address) || isAddressEqual(address, zeroAddress) ? false : true;

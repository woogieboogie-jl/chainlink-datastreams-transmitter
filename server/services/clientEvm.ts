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
  Hex,
  formatUnits,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  estimateContractGas,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
  readContract,
  getBalance,
} from 'viem/actions';
import { ReportV2, ReportV3, ReportV4, ReportV5, ReportV6, ReportV7, ReportV8, ReportV9, ReportV10, StreamReport } from '../types';
import { feeManagerAbi, verifierProxyAbi } from '../config/abi';
import { logger } from './logger';
import {
  getChainId,
  getContractAddress,
  getGasCap,
  setChainId,
} from '../store';
import { getEVMVerifier } from '../config/verifiers';
import { defaultChains, getCustomEVMChains } from '../config/chains';
import { printError } from '../utils';

// ABI definitions for different report versions
const reportBlobAbiV2 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
];

const reportBlobAbiV3 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
  { type: 'int192', name: 'bid' },
  { type: 'int192', name: 'ask' },
];

const reportBlobAbiV4 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
  { type: 'uint8', name: 'marketStatus' },
];

const reportBlobAbiV5 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'rate' },
  { type: 'uint32', name: 'timestamp' },
  { type: 'uint32', name: 'duration' },
];

const reportBlobAbiV6 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
  { type: 'int192', name: 'price2' },
  { type: 'int192', name: 'price3' },
  { type: 'int192', name: 'price4' },
  { type: 'int192', name: 'price5' },
];

const reportBlobAbiV7 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'exchangeRate' },
];

const reportBlobAbiV8 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'uint64', name: 'lastUpdateTimestamp' },
  { type: 'int192', name: 'price' },
  { type: 'uint32', name: 'marketStatus' },
];

const reportBlobAbiV9 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'benchmark' },
  { type: 'uint64', name: 'navDate' },
  { type: 'int192', name: 'aum' },
  { type: 'uint32', name: 'ripcord' },
];

const reportBlobAbiV10 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'uint64', name: 'lastUpdateTimestamp' },
  { type: 'int192', name: 'price' },
  { type: 'uint32', name: 'marketStatus' },
  { type: 'int192', name: 'currentMultiplier' },
  { type: 'int192', name: 'newMultiplier' },
  { type: 'uint32', name: 'activationDateTime' },
  { type: 'int192', name: 'tokenizedPrice' },
];

function decodeReportByVersion(reportData: Hex, reportVersion: number) {
  let abi;
  switch (reportVersion) {
    case 2:
      abi = reportBlobAbiV2;
      break;
    case 3:
      abi = reportBlobAbiV3;
      break;
    case 4:
      abi = reportBlobAbiV4;
      break;
    case 5:
      abi = reportBlobAbiV5;
      break;
    case 6:
      abi = reportBlobAbiV6;
      break;
    case 7:
      abi = reportBlobAbiV7;
      break;
    case 8:
      abi = reportBlobAbiV8;
      break;
    case 9:
      abi = reportBlobAbiV9;
      break;
    case 10:
      abi = reportBlobAbiV10;
      break;
    default:
      throw new Error(`Unsupported report version: ${reportVersion}`);
  }
  
  return decodeAbiParameters(abi, reportData);
}

const getAccount = () => {
  try {
    return privateKeyToAccount(process.env.PRIVATE_KEY_EVM as Hex);
  } catch (error) {
    logger.error(printError(error), error);
    console.error(error);
    return;
  }
};
export const accountAddress = getAccount()?.address ?? zeroAddress;

export async function executeContract({
  report,
  abi,
  functionName,
  functionArgs,
}: {
  report: ReportV2 | ReportV3 | ReportV4 | ReportV5 | ReportV6 | ReportV7 | ReportV8 | ReportV9 | ReportV10 | StreamReport;
  abi: Abi;
  functionName: string;
  functionArgs: string[];
}) {
  try {
    const chainId = await getChainId();
    if (!chainId) {
      logger.warn('⚠️ Chain is missing. Connect to a chain and try again');
      return;
    }
    const account = getAccount();
    if (!account) {
      logger.error('‼️ Account is missing');
      return;
    }

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

    const args = functionArgs.map((arg) => report[arg as keyof typeof report]);

    const address = await getContractAddress(report.feedId, chainId);
    if (!address || !isAddress(address)) {
      logger.warn('⚠️ Contract address is missing');
      return;
    }
    const clients = await getClients();
    if (!clients || !clients.publicClient || !clients.walletClient) {
      logger.warn('⚠️ Invalid clients', { clients });
      return;
    }
    const { publicClient, walletClient } = clients;
    const gas = await estimateContractGas(publicClient, {
      account,
      address,
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
    const gasCap = await getGasCap();
    if (gasCap && gas > BigInt(gasCap)) {
      logger.warn(
        `🛑 Gas is above the limit of ${formatEther(
          BigInt(gasCap)
        )} | Aborting`,
        { gas, gasCap }
      );
      return;
    }
    const { request } = await simulateContract(publicClient, {
      account,
      address,
      abi,
      functionName,
      args,
    });
    logger.info('ℹ️ Transaction simulated', request);

    const hash = await writeContract(walletClient, request);
    logger.info(`⌛️ Sending transaction ${hash} `, hash);
    const txReceipt = await waitForTransactionReceipt(publicClient, { hash });
    return txReceipt;
  } catch (error) {
    logger.error(printError(error), error);
    console.error(error);
  }
}



async function getContractAddresses() {
  try {
    const clients = await getClients();
    if (!clients || !clients.publicClient) {
      logger.warn('⚠️ Invalid clients', { clients });
      return {
        verifierProxyAddress: zeroAddress,
        feeManagerAddress: zeroAddress,
        rewardManagerAddress: zeroAddress,
        feeTokenAddress: zeroAddress,
      };
    }
    const { publicClient } = clients;
    const chainId = await getChainId();
    if (!chainId) {
      logger.warn('⚠️ No chainId provided');
      return;
    }
    const verifierProxyAddress = await getEVMVerifier(chainId);
    if (!verifierProxyAddress) {
      logger.warn('⚠️ No verifier address provided');
      return;
    }

    const feeManagerAddress = await readContract(publicClient, {
      address: verifierProxyAddress,
      abi: verifierProxyAbi,
      functionName: 's_feeManager',
    });

    const [rewardManagerAddress, feeTokenAddress] = await Promise.all([
      readContract(publicClient, {
        address: feeManagerAddress,
        abi: feeManagerAbi,
        functionName: 'i_rewardManager',
      }),
      readContract(publicClient, {
        address: feeManagerAddress,
        abi: feeManagerAbi,
        functionName: 'i_linkAddress',
      }),
    ]);

    return {
      verifierProxyAddress,
      feeManagerAddress,
      rewardManagerAddress,
      feeTokenAddress,
    };
  } catch (error) {
    logger.error(printError(error), error);
    console.error(error);
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
    const account = getAccount();
    if (!account) {
      logger.error('‼️ Account is missing');
      return;
    }
    const clients = await getClients();
    if (!clients || !clients.publicClient || !clients.walletClient) {
      logger.warn('⚠️ Invalid clients', { clients });
      return;
    }
    const { publicClient, walletClient } = clients;

    const [, reportData] = decodeAbiParameters(
      [
        { type: 'bytes32[3]', name: '' },
        { type: 'bytes', name: 'reportData' },
      ],
      report.rawReport
    );

    const reportVersion = parseInt(reportData.slice(0, 6), 16);
    if (reportVersion < 2 || reportVersion > 10) {
      logger.warn('⚠️ Invalid report version', { report, reportVersion });
      return;
    }

    const contractAddresses = await getContractAddresses();
    if (
      !contractAddresses ||
      Object.values(contractAddresses)
        .map((address) => isAddressValid(address))
        .includes(false)
    ) {
      logger.warn('⚠️ Invalid contract addresses', { contractAddresses });
      return;
    }

    const {
      feeManagerAddress,
      rewardManagerAddress,
      feeTokenAddress,
      verifierProxyAddress,
    } = contractAddresses;

    // Generate parameter payload for verifyAndUpdateReport calls
    const feeTokenAddressEncoded = encodeAbiParameters(
      [{ type: 'address', name: 'parameterPayload' }],
      [feeTokenAddress]
    );

    const [fee] = await readContract(publicClient, {
      address: feeManagerAddress,
      abi: feeManagerAbi,
      functionName: 'getFeeAndReward',
      args: [account.address, reportData, feeTokenAddress],
    });
    logger.info(`⛽️ Estimated fee: ${formatEther(fee.amount)} LINK`, { fee });

    const approveLinkGas = await estimateContractGas(publicClient, {
      account,
      address: feeTokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [rewardManagerAddress, fee.amount],
    });

    logger.info(
      `⛽️ Estimated gas for LINK approval: ${formatEther(approveLinkGas)} ${
        publicClient.chain?.nativeCurrency.symbol
      }`,
      { approveLinkGas }
    );
    const gasCap = await getGasCap();
    if (gasCap && approveLinkGas > BigInt(gasCap)) {
      logger.info(
        `🛑 LINK approval gas is above the limit of ${formatEther(
          BigInt(gasCap)
        )} | Aborting`,
        { approveLinkGas, gasCap }
      );
      return;
    }

    const { request: approveLinkRequest } = await simulateContract(
      publicClient,
      {
        account,
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [rewardManagerAddress, fee.amount],
      }
    );
    const approveLinkHash = await writeContract(
      walletClient,
      approveLinkRequest
    );
    const approveLinkReceipt = await waitForTransactionReceipt(publicClient, {
      hash: approveLinkHash,
    });

    if (approveLinkReceipt.status !== 'success') {
      logger.warn(
        `🛑 LINK approval transaction was not successful | Aborting`,
        { transactionReceipt: approveLinkReceipt }
      );
      return;
    }

    const verifyReportGas = await estimateContractGas(publicClient, {
      account,
      address: verifierProxyAddress,
      abi: verifierProxyAbi,
      functionName: 'verify',
      args: [report.rawReport, feeTokenAddressEncoded],
    });
    logger.info(
      `⛽️ Estimated gas for verification: ${formatEther(verifyReportGas)} ${
        publicClient.chain?.nativeCurrency.symbol
      }`,
      { verifyReportGas }
    );
    if (gasCap && verifyReportGas > BigInt(gasCap)) {
      logger.warn(
        `🛑 Verification gas is above the limit of ${formatEther(
          BigInt(gasCap)
        )} | Aborting`,
        { verifyReportGas, gasCap }
      );
      return;
    }
    const { request: verifyReportRequest, result: verifiedReportData } =
      await simulateContract(publicClient, {
        account,
        address: verifierProxyAddress,
        abi: verifierProxyAbi,
        functionName: 'verify',
        args: [report.rawReport, feeTokenAddressEncoded],
      });
    const verifyReportHash = await writeContract(
      walletClient,
      verifyReportRequest
    );
    const verifyReportReceipt = await waitForTransactionReceipt(publicClient, {
      hash: verifyReportHash,
    });

    if (verifyReportReceipt.status !== 'success') {
      logger.warn(`🛑 Verification transaction was not successful | Aborting`, {
        transactionReceipt: verifyReportReceipt,
      });
      return;
    }

    if (verifiedReportData) {
      try {
        const decodedData = decodeReportByVersion(verifiedReportData as Hex, reportVersion);
        switch (reportVersion) {
          case 2:
            const reportV2: ReportV2 = {
              reportVersion,
              verifiedReport: verifiedReportData as Hex,
              feedId: decodedData[0] as Hex,
              validFromTimestamp: decodedData[1] as number,
              observationsTimestamp: decodedData[2] as number,
              nativeFee: decodedData[3] as bigint,
              linkFee: decodedData[4] as bigint,
              expiresAt: decodedData[5] as number,
              price: decodedData[6] as bigint,
              rawReport: report.rawReport,
              parameterPayload: feeTokenAddressEncoded,
            };

            return reportV2;
          case 3:
            const reportV3: ReportV3 = {
              reportVersion,
              verifiedReport: verifiedReportData as Hex,
              feedId: decodedData[0] as Hex,
              validFromTimestamp: decodedData[1] as number,
              observationsTimestamp: decodedData[2] as number,
              nativeFee: decodedData[3] as bigint,
              linkFee: decodedData[4] as bigint,
              expiresAt: decodedData[5] as number,
              price: decodedData[6] as bigint,
              bid: decodedData[7] as bigint,
              ask: decodedData[8] as bigint,
              rawReport: report.rawReport,
              parameterPayload: feeTokenAddressEncoded,
            };

            return reportV3;
          case 4:
            const reportV4: ReportV4 = {
              reportVersion,
              verifiedReport: verifiedReportData as Hex,
              feedId: decodedData[0] as Hex,
              validFromTimestamp: decodedData[1] as number,
              observationsTimestamp: decodedData[2] as number,
              nativeFee: decodedData[3] as bigint,
              linkFee: decodedData[4] as bigint,
              expiresAt: decodedData[5] as number,
              price: decodedData[6] as bigint,
              marketStatus: decodedData[7] as number,
              rawReport: report.rawReport,
              parameterPayload: feeTokenAddressEncoded,
            };

            return reportV4;
          case 5:
            const reportV5: ReportV5 = {
              reportVersion,
              verifiedReport: verifiedReportData as Hex,
              feedId: decodedData[0] as Hex,
              validFromTimestamp: decodedData[1] as number,
              observationsTimestamp: decodedData[2] as number,
              nativeFee: decodedData[3] as bigint,
              linkFee: decodedData[4] as bigint,
              expiresAt: decodedData[5] as number,
              rate: decodedData[6] as bigint,
              timestamp: decodedData[7] as number,
              duration: decodedData[8] as number,
              rawReport: report.rawReport,
              parameterPayload: feeTokenAddressEncoded,
            };

            return reportV5;
          case 6:
            const reportV6: ReportV6 = {
              reportVersion,
              verifiedReport: verifiedReportData as Hex,
              feedId: decodedData[0] as Hex,
              validFromTimestamp: decodedData[1] as number,
              observationsTimestamp: decodedData[2] as number,
              nativeFee: decodedData[3] as bigint,
              linkFee: decodedData[4] as bigint,
              expiresAt: decodedData[5] as number,
              price: decodedData[6] as bigint,
              price2: decodedData[7] as bigint,
              price3: decodedData[8] as bigint,
              price4: decodedData[9] as bigint,
              price5: decodedData[10] as bigint,
              rawReport: report.rawReport,
              parameterPayload: feeTokenAddressEncoded,
            };

            return reportV6;
          case 7:
            const reportV7: ReportV7 = {
              reportVersion,
              verifiedReport: verifiedReportData as Hex,
              feedId: decodedData[0] as Hex,
              validFromTimestamp: decodedData[1] as number,
              observationsTimestamp: decodedData[2] as number,
              nativeFee: decodedData[3] as bigint,
              linkFee: decodedData[4] as bigint,
              expiresAt: decodedData[5] as number,
              exchangeRate: decodedData[6] as bigint,
              rawReport: report.rawReport,
              parameterPayload: feeTokenAddressEncoded,
            };

            return reportV7;
          case 8:
            const reportV8: ReportV8 = {
              reportVersion,
              verifiedReport: verifiedReportData as Hex,
              feedId: decodedData[0] as Hex,
              validFromTimestamp: decodedData[1] as number,
              observationsTimestamp: decodedData[2] as number,
              nativeFee: decodedData[3] as bigint,
              linkFee: decodedData[4] as bigint,
              expiresAt: decodedData[5] as number,
              lastUpdateTimestamp: decodedData[6] as bigint,
              price: decodedData[7] as bigint,
              marketStatus: decodedData[8] as number,
              rawReport: report.rawReport,
              parameterPayload: feeTokenAddressEncoded,
            };

            return reportV8;
          case 9:
            const reportV9: ReportV9 = {
              reportVersion,
              verifiedReport: verifiedReportData as Hex,
              feedId: decodedData[0] as Hex,
              validFromTimestamp: decodedData[1] as number,
              observationsTimestamp: decodedData[2] as number,
              nativeFee: decodedData[3] as bigint,
              linkFee: decodedData[4] as bigint,
              expiresAt: decodedData[5] as number,
              benchmark: decodedData[6] as bigint,
              navDate: decodedData[7] as bigint,
              aum: decodedData[8] as bigint,
              ripcord: decodedData[9] as number,
              rawReport: report.rawReport,
              parameterPayload: feeTokenAddressEncoded,
            };

            return reportV9;
          case 10:
            const reportV10: ReportV10 = {
              reportVersion,
              verifiedReport: verifiedReportData as Hex,
              feedId: decodedData[0] as Hex,
              validFromTimestamp: decodedData[1] as number,
              observationsTimestamp: decodedData[2] as number,
              nativeFee: decodedData[3] as bigint,
              linkFee: decodedData[4] as bigint,
              expiresAt: decodedData[5] as number,
              lastUpdateTimestamp: decodedData[6] as bigint,
              price: decodedData[7] as bigint,
              marketStatus: decodedData[8] as number,
              currentMultiplier: decodedData[9] as bigint,
              newMultiplier: decodedData[10] as bigint,
              activationDateTime: decodedData[11] as number,
              tokenizedPrice: decodedData[12] as bigint,
              rawReport: report.rawReport,
              parameterPayload: feeTokenAddressEncoded,
            };

            return reportV10;
          default:
            logger.warn('⚠️ Unsupported report version for EVM', { reportVersion });
            return;
        }
      } catch (error) {
        logger.error('Error decoding report data', { error, reportVersion });
        return;
      }
    }
  } catch (error) {
    logger.error(printError(error), error);
    console.error(error);
  }
}

const isAddressValid = (address: string) =>
  !isAddress(address) || isAddressEqual(address, zeroAddress) ? false : true;

export async function getClients() {
  const chainId = await getChainId();
  if (!chainId) {
    logger.warn('⚠️ No chainId provided');
    return;
  }
  const storedChains = await getCustomEVMChains();
  const storedChain = storedChains?.find(
    (chain) => chain.id === Number(chainId)
  );

  if (storedChain) {
    const publicClient = createPublicClient({
      chain: storedChain,
      transport: http(),
    });

    const walletClient = createWalletClient({
      chain: storedChain,
      transport: http(),
    });
    return { publicClient, walletClient };
  }

  const defaultChain = defaultChains.find(
    (chain) => chain.id === Number(chainId)
  );
  if (!defaultChain) {
    logger.warn('⚠️ Invalid chain', { chainId });
    setChainId('');
    return;
  }

  const publicClient = createPublicClient({
    chain: defaultChain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: defaultChain,
    transport: http(),
  });
  return { publicClient, walletClient };
}

export async function getTokenBalance() {
  try {
    const clients = await getClients();
    if (!clients || !clients.publicClient) {
      logger.warn('⚠️ Invalid clients', { clients });
      return;
    }
    const { publicClient } = clients;
    if (!isAddress(accountAddress) || accountAddress === zeroAddress) {
      logger.warn('⚠️ Invalid account address', { accountAddress });
      return {
        value: formatEther(0n),
        symbol: '',
      };
    }
    const balance = await getBalance(publicClient, { address: accountAddress });
    return {
      value: formatEther(balance),
      symbol: publicClient.chain?.nativeCurrency.symbol,
    };
  } catch (error) {
    logger.error(printError(error), error);
    console.error(error);
    return {
      value: formatEther(0n),
      symbol: '',
    };
  }
}

export async function getLinkBalance() {
  try {
    const clients = await getClients();
    if (!clients || !clients.publicClient) {
      logger.warn('⚠️ Invalid clients', { clients });
      return;
    }
    const { publicClient } = clients;
    const contractAddresses = await getContractAddresses();

    if (
      !contractAddresses ||
      !isAddressValid(contractAddresses.feeTokenAddress)
    ) {
      logger.warn('⚠️ Invalid fee token addresses', { contractAddresses });
      return;
    }
    const { feeTokenAddress } = contractAddresses;
    if (!isAddress(accountAddress) || accountAddress === zeroAddress) {
      logger.warn('⚠️ Invalid account address', { accountAddress });
      return {
        value: formatEther(0n),
        symbol: '',
      };
    }
    const [balance, decimals, symbol] = await Promise.all([
      publicClient.readContract({
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [accountAddress],
      }),
      publicClient.readContract({
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
      publicClient.readContract({
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
    ]);
    return {
      value: formatUnits(balance, decimals),
      symbol,
    };
  } catch (error) {
    logger.error(printError(error), error);
    console.error(error);
    return {
      value: formatEther(0n),
      symbol: '',
    };
  }
}

export async function getCurrentChain() {
  const clients = await getClients();
  if (!clients || !clients.publicClient) {
    logger.warn('⚠️ Invalid clients', { clients });
    return;
  }
  const { publicClient } = clients;
  return { chainId: publicClient.chain?.id, name: publicClient.chain?.name };
}

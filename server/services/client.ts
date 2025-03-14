import {
  getCurrentChain as getCurrentSolanaChain,
  accountAddress as solanaAccountAddress,
  getBalance as getSolanaBalanace,
  verifyReport as solanaVerifyReport,
  executeSolanaProgram,
} from './clientSolana';
import {
  getCurrentChain as getCurrentEvmChain,
  accountAddress as evmAccountAddress,
  getBalance as getEvmBalance,
  getLinkBalance as getEvmLinkBalance,
  verifyReport as evmVerifyReport,
  executeContract as executeEVMContract,
} from './clientEvm';
import {
  getAbi,
  getChainId,
  getCluster,
  getFeedName,
  getFunctionArgs,
  getFunctionName,
  getVm,
  setSavedReport,
} from 'server/store';
import { zeroAddress } from 'viem';
import { StreamReport } from 'server/types';
import { logger } from './logger';
import { formatUSD } from 'server/utils';
import { getReportPrice } from '~/lib/utils';

export async function getCurrentChain() {
  const vm = await getVm();
  if (vm === 'svm') return getCurrentSolanaChain();
  return getCurrentEvmChain();
}

export async function getAddress() {
  const vm = await getVm();
  if (vm === 'svm') return solanaAccountAddress ?? zeroAddress;
  return evmAccountAddress;
}

export async function getTokenBalance() {
  const vm = await getVm();
  if (vm === 'svm') return getSolanaBalanace();
  return getEvmBalance();
}

export async function getLinkBalance() {
  const vm = await getVm();
  if (vm === 'svm') return;
  return getEvmLinkBalance();
}

export async function getCurrentChainId() {
  const vm = await getVm();
  if (vm === 'svm') return getCluster();
  return getChainId();
}

export async function verifyReport(report: StreamReport) {
  const vm = await getVm();
  if (vm === 'svm') return solanaVerifyReport(report);
  return evmVerifyReport(report);
}

export async function dataUpdater({ report }: { report: StreamReport }) {
  try {
    const verifiedReport = await verifyReport(report);
    if (!verifiedReport) {
      logger.warn(`🛑 Verified report is missing | Aborting`);
      return;
    }
    logger.info(`✅ Report verified | ${await getFeedName(report.feedId)}`, {
      verifiedReport,
    });
    const vm = await getVm();
    if (vm === 'svm') {
      const transaction = await executeSolanaProgram({
        report: verifiedReport,
      });
      if (
        !transaction?.meta?.logMessages ||
        transaction?.meta?.logMessages.length === 0
      ) {
        logger.warn('⚠️ No log messages found in transaction details', {
          transaction,
        });
        return;
      }

      for (const log of transaction.meta.logMessages) {
        if (log.includes('success')) {
          logger.info(`ℹ️ Transaction status: success`, {
            transaction,
          });
          await setSavedReport(report);
          logger.info(
            `💾 Price stored | ${await getFeedName(report.feedId)}: ${formatUSD(
              getReportPrice(report)
            )}$`,
            { report }
          );
          return;
        }
      }
    }
    const chainId = await getChainId();
    if (!chainId) {
      logger.warn(
        `🛑 ChainId is missing. Connect to a chain and try again | Aborting`
      );
      return;
    }
    const { feedId } = report;
    if (!verifiedReport) {
      logger.warn(`🛑 Verified report is missing | Aborting`);
      return;
    }
    const functionName = await getFunctionName(feedId, chainId);
    if (!functionName) {
      logger.warn(`🛑 Function name is missing | Aborting`);
      return;
    }
    const abi = await getAbi(feedId, chainId);
    if (!abi) {
      logger.warn(`🛑 Contract ABI is missing | Aborting`);
      return;
    }
    logger.info('✅ Report verified', { verifiedReport });
    const transaction = await executeEVMContract({
      report: verifiedReport,
      abi: JSON.parse(abi),
      functionName,
      functionArgs: await getFunctionArgs(feedId, chainId),
    });
    if (transaction?.status) {
      logger.info(`ℹ️ Transaction status: ${transaction?.status}`, {
        transaction,
      });
    }
    if (transaction?.status === 'success') {
      await setSavedReport(report);
      logger.info(
        `💾 Price stored | ${await getFeedName(report.feedId)}: ${formatUSD(
          getReportPrice(report)
        )}$`,
        { report }
      );
    }
  } catch (error) {
    logger.error('ERROR', error);
  }
}

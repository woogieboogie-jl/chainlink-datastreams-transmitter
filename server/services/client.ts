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
  getTokenBalance as getEvmBalance,
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
  getIdl,
  getInstructionName,
  getInstructionPDA,
  getInstrutctionArgs,
  getSkipVerify,
  getVm,
  setSavedReport,
} from 'server/store';
import { zeroAddress } from 'viem';
import { StreamReport } from 'server/types';
import { logger } from './logger';
import { formatUSD, printError } from 'server/utils';
import { getReportPrice } from '~/lib/utils';

export async function getCurrentChain() {
  const vm = await getVm();
  if (vm === 'svm') return { vm, ...(await getCurrentSolanaChain()) };
  return { vm, ...(await getCurrentEvmChain()) };
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

export async function dataUpdater({ report }: { report: StreamReport }) {
  try {
    const { feedId } = report;
    if (!feedId) {
      logger.warn(`🛑 Invalid report feedId | Aborting`, { report });
      return;
    }

    const vm = await getVm();
    if (vm === 'svm') {
      const cluster = await getCluster();
      if (!cluster) {
        logger.warn(
          '🛑 Cluster is missing. Connect to a chain and try again | Aborting'
        );
        return;
      }

      const idl = await getIdl(feedId, cluster);
      if (!idl) {
        logger.warn('🛑 No IDL provided | Aborting');
        return;
      }
      const instructionName = await getInstructionName(feedId, cluster);
      if (!instructionName) {
        logger.warn('🛑 No instruction name provided | Aborting');
        return;
      }
      const instructionPDA = await getInstructionPDA(feedId, cluster);
      if (!instructionPDA) {
        logger.warn(
          `🛑 No PDA for the instruction '${instructionName}' provided | Aborting`
        );
        return;
      }
      const instructionArgs = (await getInstrutctionArgs(feedId, cluster)).map(
        (arg) => JSON.parse(arg) as { name: string; type: string }
      );
      if (!instructionArgs || instructionArgs.length === 0) {
        logger.warn('⚠️ No args provided');
        return;
      }

      const skipVerify = (await getSkipVerify(feedId, cluster)) === 'true';

      const reportPayload = skipVerify
        ? report
        : await solanaVerifyReport(report);
      if (!reportPayload) {
        if (!reportPayload) {
          logger.warn(`🛑 Verified report is missing | Aborting`);
          return;
        }
      }

      const transaction = await executeSolanaProgram({
        report: reportPayload,
        idl,
        instructionName,
        instructionPDA,
        instructionArgs,
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

    const skipVerify = (await getSkipVerify(feedId, chainId)) === 'true';

    const reportPayload = skipVerify ? report : await evmVerifyReport(report);
    if (!reportPayload) {
      if (!reportPayload) {
        logger.warn(`🛑 Verified report is missing | Aborting`);
        return;
      }
    }

    const transaction = await executeEVMContract({
      report: reportPayload,
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
    logger.error(printError(error), error);
    console.error(error);
  }
}

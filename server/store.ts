import { Address, isAddress, zeroAddress } from 'viem';
import { Config, StreamReport } from './types';
import {
  addToSet,
  deleteValue,
  getList,
  getSet,
  getValue,
  isSetMember,
  removeFromSet,
  setList,
  setValue,
} from './services/redis';
import { getReportPrice } from '~/lib/utils';
import { logger } from './services/logger';
import CronExpressionParser from 'cron-parser';

const latestReports: { [key: string]: StreamReport } = {};

const getFunctionName = async () => await getValue('functionName');
const setFunctionName = async (functionName: string) =>
  await setValue('functionName', functionName);
const getInterval = async () => await getValue('interval');
const setInterval = async (interval: string) =>
  await setValue('interval', interval);
const getFunctionArgs = async () => await getList('functionArgs');
const setFunctionArgs = async (functionArgs: string[]) =>
  await setList('functionArgs', functionArgs);
const getAbi = async () => await getValue('abi');
const setAbi = async (abi: string) => await setValue('abi', abi);
const getLatestReport = (feedId: string) => latestReports[feedId];
const setLatestReport = (report: StreamReport) =>
  (latestReports[report.feedId] = report);
const getSavedReportBenchmarkPrice = async (feedId: string) =>
  await getValue(`price:${feedId}`);
const setSavedReport = async (report: StreamReport) =>
  await setValue(`price:${report.feedId}`, getReportPrice(report).toString());
const getFeeds = async () => await getSet('feeds');
const getFeedName = async (feedId: string) => await getValue(`name:${feedId}`);
const addFeed = async (feed: { feedId: string; name: string }) => {
  await addToSet('feeds', feed.feedId);
  await setValue(`name:${feed.feedId}`, feed.name);
};
const removeFeed = async (feedId: string) => {
  await removeFromSet('feeds', feedId);
  await deleteValue(`name:${feedId}`);
};
const getFeedExists = async (feedId: string) =>
  await isSetMember('feeds', feedId);
const getPriceDelta = async () => await getValue('priceDelta');
const setPriceDelta = async (priceDelta: string) =>
  await setValue('priceDelta', priceDelta);
const getChainId = async () => await getValue('chainId');
const setChainId = async (chainId: number | string) =>
  await setValue('chainId', chainId);
const getContractAddress = async () => await getValue('contractAddress');
const setContractAddress = async (address: Address) =>
  await setValue('contractAddress', address);
const getGasCap = async () => await getValue('gasCap');
const setGasCap = async (gasCap: string) => await setValue('gasCap', gasCap);
const getChains = async () => await getSet('chains');
const getChain = async (chainId: string) => await getValue(`chain:${chainId}`);
const addChain = async (chainId: string, chain: string) => {
  await setValue(`chain:${chainId}`, chain);
  await addToSet('chains', chainId);
};
const removeChain = async (chainId: string) => {
  await deleteValue(`chain:${chainId}`);
  await removeFromSet('chains', chainId);
};
const getSeed = async () => getValue('seed');
const setSeed = async () => setValue('seed', new Date().toString());

const seedConfig = async (config: Config) => {
  try {
    const isSeeded = !!(await getSeed());
    if (isSeeded) {
      logger.info('ℹ️ App already configured');
      return;
    }
    logger.info('🎬 Start app configuration');

    await Promise.all(config.feeds.map(async (feed) => addFeed(feed)));
    logger.info(
      `📢 Feeds ${config.feeds
        .map(({ name }) => name)
        .join(', ')} have been added`,
      { feeds: config.feeds }
    );

    await Promise.all(
      config.chains.map(async (chain) => {
        if (!chain) {
          logger.warn('⚠ Invalid chain input', { chain });
          return null;
        }
        if (!chain.id || isNaN(Number(chain.id))) {
          logger.warn('⚠ Invalid chain id', { chain });
          return null;
        }
        if (!chain.name) {
          logger.warn('⚠ Chain name is missing', { chain });
          return null;
        }
        if (!chain.nativeCurrency) {
          logger.warn('⚠ Native currency object is missing', { chain });
          return null;
        }
        if (!chain.nativeCurrency.name) {
          logger.warn('⚠ Chain native currency name is missing', { chain });
          return null;
        }
        if (!chain.nativeCurrency.symbol) {
          logger.warn('⚠ Chain native currency symbol is missing', { chain });
          return null;
        }
        if (
          !chain.nativeCurrency.decimals ||
          isNaN(Number(chain.nativeCurrency.decimals))
        ) {
          logger.warn('⚠ Invalid chain native currency decimals', { chain });
          return null;
        }
        if (!chain.rpcUrls) {
          logger.warn('⚠ RPC urls object is missing', { chain });
          return null;
        }
        if (!chain.rpcUrls.default) {
          logger.warn('⚠ Default RPC urls object is missing', { chain });
          return null;
        }
        if (
          !chain.rpcUrls.default.http ||
          chain.rpcUrls.default.http.length === 0 ||
          !chain.rpcUrls.default.http[0]
        ) {
          logger.warn('⚠ Default http RPC url is missing', { chain });
          return null;
        }

        await addChain(chain.id.toString(), JSON.stringify(chain));
        logger.info(`📢 New chain has been added`, { chain });
      })
    );

    if (config.chainId && !isNaN(config.chainId)) {
      await setChainId(config.chainId);
      logger.info(`📢 Chain set to ${config.chainId}`, {
        chainId: config.chainId,
      });
    }

    if (
      isAddress(config.contractAddress) &&
      config.contractAddress !== zeroAddress
    ) {
      await setContractAddress(config.contractAddress);
      logger.info(`📢 New contract has been set ${config.contractAddress}`, {
        contractAddress: config.contractAddress,
      });
    }

    if (config.abi) {
      await setAbi(JSON.stringify(config.abi));
      logger.info(`📢 ABI has been set`, { abi: config.abi });
    }

    if (config.functionName) {
      await setFunctionName(config.functionName);
      logger.info(`📢 New function has been set ${config.functionName}`, {
        functionName: config.functionName,
      });
    }

    if (config.functionArgs && config.functionArgs.length > 0) {
      await setFunctionArgs(config.functionArgs);
      logger.info(
        `📢 Set of arguments has been set ${config.functionArgs.join(', ')}`,
        {
          functionArgs: config.functionArgs,
        }
      );
    }

    if (!isNaN(Number(config.gasCap))) {
      await setGasCap(config.gasCap);
      logger.info(`📢 Gas cap has been set ${config.gasCap}`, {
        gasCap: config.gasCap,
      });
    }

    if (config.interval) {
      try {
        const cronExpression = CronExpressionParser.parse(config.interval);
        const parsedInterval = cronExpression.stringify(true);
        setInterval(parsedInterval);
        logger.info(`📢 New interval has been set ${parsedInterval}`, {
          interval: parsedInterval,
        });
      } catch (error) {
        logger.warn('⚠ New interval invalid input', {
          interval: config.interval,
        });
      }
    }

    if (config.priceDelta && !isNaN(Number(config.priceDelta))) {
      await setPriceDelta(config.priceDelta);
      logger.info(`📢 Price delta has been set ${config.priceDelta}`, {
        priceDelta: config.priceDelta,
      });
    }

    await setSeed();
    logger.info('💽 App configured successfuly', { config });
  } catch (error) {
    logger.warn('⚠️ App configuration was not completed', { config, error });
  }
};

export {
  getFunctionName,
  setFunctionName,
  getInterval,
  setInterval,
  getFunctionArgs,
  setFunctionArgs,
  getAbi,
  setAbi,
  getLatestReport,
  setLatestReport,
  getSavedReportBenchmarkPrice,
  setSavedReport,
  getFeeds,
  getFeedName,
  addFeed,
  removeFeed,
  getFeedExists,
  getPriceDelta,
  setPriceDelta,
  getChainId,
  setChainId,
  getContractAddress,
  setContractAddress,
  getGasCap,
  setGasCap,
  getChains,
  getChain,
  addChain,
  removeChain,
  seedConfig,
};

import { Address, isAddress, isHex, zeroAddress } from 'viem';
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
import { getReportPrice } from '../app/lib/utils';
import { logger } from './services/logger';
import { CronExpressionParser } from 'cron-parser';
import { printError } from './utils';

const latestReports: { [key: string]: StreamReport } = {};

const getInterval = async () => await getValue('interval');
const setInterval = async (interval: string) =>
  await setValue('interval', interval);
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
const setPriceDelta = async (priceDelta: string | number) =>
  await setValue('priceDelta', priceDelta);
const getChainId = async () => await getValue('chainId');
const setChainId = async (chainId: number | string) =>
  await setValue('chainId', chainId);
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
const getVerifierAddresses = async () => await getSet('verifiers');
const getVerifierAddress = async (chainId: string) =>
  await getValue(`verifier:${chainId}`);
const addVerifierAddress = async (
  chainId: number | string,
  verifierAddress: Address
) => {
  await setValue(`verifier:${chainId}`, verifierAddress);
  await addToSet('verifiers', chainId);
};
const removeVerifierAddress = async (chainId: string) => {
  await deleteValue(`verifier:${chainId}`);
  await removeFromSet('verifiers', chainId);
};
const getSeed = async () => getValue('seed');
const setSeed = async () => setValue('seed', new Date().toString());

const getFunctionName = async (feedId: string, chainId: string) =>
  await getValue(`functionName:${feedId}:${chainId}`);
const setFunctionName = async (
  feedId: string,
  chainId: string,
  functionName: string
) => await setValue(`functionName:${feedId}:${chainId}`, functionName);
const getFunctionArgs = async (feedId: string, chainId: string) =>
  await getList(`functionArgs:${feedId}:${chainId}`);
const setFunctionArgs = async (
  feedId: string,
  chainId: string,
  functionArgs: string[]
) => await setList(`functionArgs:${feedId}:${chainId}`, functionArgs);
const getAbi = async (feedId: string, chainId: string) =>
  await getValue(`abi:${feedId}:${chainId}`);
const setAbi = async (feedId: string, chainId: string, abi: string) =>
  await setValue(`abi:${feedId}:${chainId}`, abi);
const getContractAddress = async (feedId: string, chainId: string) =>
  await getValue(`contractAddress:${feedId}:${chainId}`);
const setContractAddress = async (
  feedId: string,
  chainId: string,
  address: Address
) => await setValue(`contractAddress:${feedId}:${chainId}`, address);
const getSkipVerify = async (feedId: string, chainId: string) =>
  await getValue(`skipVerify:${feedId}:${chainId}`);
const setSkipVerify = async (
  feedId: string,
  chainId: string,
  skipVerify: string
) => await setValue(`skipVerify:${feedId}:${chainId}`, skipVerify);

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
      config.chains.map(async (data) => {
        const chain = {
          id: Number(data.id),
          name: data.name,
          nativeCurrency: {
            decimals: Number(data.currencyDecimals),
            name: data.currencyName,
            symbol: data.currencySymbol,
          },
          rpcUrls: {
            default: { http: [data.rpc] },
          },
          testnet: data.testnet,
        };
        if (!chain) {
          logger.warn('⚠ Invalid chain input', { chain });
          return;
        }
        if (!chain.id || isNaN(Number(chain.id))) {
          logger.warn('⚠ Invalid chain id', { chain });
          return;
        }
        if (!chain.name) {
          logger.warn('⚠ Chain name is missing', { chain });
          return;
        }
        if (!chain.nativeCurrency) {
          logger.warn('⚠ Native currency object is missing', { chain });
          return;
        }
        if (!chain.nativeCurrency.name) {
          logger.warn('⚠ Chain native currency name is missing', { chain });
          return;
        }
        if (!chain.nativeCurrency.symbol) {
          logger.warn('⚠ Chain native currency symbol is missing', { chain });
          return;
        }
        if (
          !chain.nativeCurrency.decimals ||
          isNaN(Number(chain.nativeCurrency.decimals))
        ) {
          logger.warn('⚠ Invalid chain native currency decimals', { chain });
          return;
        }
        if (!chain.rpcUrls) {
          logger.warn('⚠ RPC urls object is missing', { chain });
          return;
        }
        if (!chain.rpcUrls.default) {
          logger.warn('⚠ Default RPC urls object is missing', { chain });
          return;
        }
        if (
          !chain.rpcUrls.default.http ||
          chain.rpcUrls.default.http.length === 0 ||
          !chain.rpcUrls.default.http[0]
        ) {
          logger.warn('⚠ Default http RPC url is missing', { chain });
          return;
        }

        await addChain(chain.id.toString(), JSON.stringify(chain));
        logger.info(`📢 New chain has been added`, { chain });
      })
    );

    config.verifierAddresses &&
      (await Promise.all(
        config.verifierAddresses.map(async (verifier) => {
          if (!verifier.chainId || isNaN(Number(verifier.chainId))) {
            logger.warn('⚠ Invalid verifier chain id', { verifier });
            return;
          }
          if (
            !isAddress(verifier.address) ||
            verifier.address === zeroAddress
          ) {
            logger.warn('⚠ Invalid verifier contract address', { verifier });
            return;
          }
          await addVerifierAddress(verifier.chainId, verifier.address);
          logger.info(
            `📢 Verifier contract has been added for chain with ID ${verifier.chainId}`,
            { verifier }
          );
        })
      ));

    if (config.chainId && !isNaN(config.chainId)) {
      await setChainId(config.chainId);
      logger.info(`📢 Chain set to ${config.chainId}`, {
        chainId: config.chainId,
      });
    }

    await Promise.all(
      config.targetChains.map(async ({ chainId, targetContracts }) => {
        if (!chainId) {
          logger.warn('⚠ Contract chainId invalid input');
          return;
        }
        await Promise.all(
          targetContracts.map(async (contract) => {
            try {
              const {
                feedId,
                address,
                abi,
                functionArgs,
                functionName,
                skipVerify,
              } = contract;

              if (!feedId || !isHex(feedId)) {
                logger.warn('⚠ Contract feedId invalid input', contract);
                return;
              }
              if (isAddress(address) && address !== zeroAddress) {
                await setContractAddress(feedId, `${chainId}`, address);
                logger.info(
                  `📢 Contract ${address} has been set for feed ${feedId} on chain ${chainId}`,
                  {
                    feedId,
                    chainId,
                    address,
                  }
                );
              }
              if (abi) {
                await setAbi(feedId, `${chainId}`, JSON.stringify(abi));
                logger.info(
                  `📢 ABI has been set for feed ${feedId} on chain ${chainId}`,
                  {
                    feedId,
                    chainId,
                    abi,
                  }
                );
              }
              if (functionName) {
                await setFunctionName(feedId, `${chainId}`, functionName);
                logger.info(
                  `📢 New function ${functionName} has been set for feed ${feedId}`,
                  {
                    feedId,
                    chainId,
                    functionName,
                  }
                );
              }
              if (functionArgs && functionArgs.length > 0) {
                await setFunctionArgs(feedId, `${chainId}`, functionArgs);
                logger.info(
                  `📢 Set of arguments ${functionArgs.join(
                    ', '
                  )} has been set for feed ${feedId} on chain ${chainId}`,
                  { feedId, chainId, functionArgs }
                );
              }
              if (skipVerify) {
                await setSkipVerify(
                  feedId,
                  `${chainId}`,
                  skipVerify.toString()
                );
                logger.info(
                  `📢 Skip verification set to ${skipVerify.toString()} for feed ${feedId}}`,
                  { feedId, chainId, skipVerify }
                );
              }
            } catch (error) {
              logger.error(printError(error), error);
              console.error(error);
            }
          })
        );
      })
    );

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

    if (
      config.priceDeltaPercentage &&
      !isNaN(Number(config.priceDeltaPercentage))
    ) {
      await setPriceDelta(config.priceDeltaPercentage);
      logger.info(
        `📢 Price delta has been set ${config.priceDeltaPercentage}`,
        {
          priceDelta: config.priceDeltaPercentage,
        }
      );
    }

    await setSeed();
    logger.info('💽 App configured successfuly', { config });
  } catch (error) {
    logger.warn('⚠️ App configuration was not completed', { config });
    logger.error(printError(error), error);
    console.error(error);
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
  getSkipVerify,
  setSkipVerify,
  getGasCap,
  setGasCap,
  getChains,
  getChain,
  addChain,
  removeChain,
  getVerifierAddresses,
  getVerifierAddress,
  addVerifierAddress,
  removeVerifierAddress,
  seedConfig,
};

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
const getCluster = async () => await getValue('cluster');
const setCluster = async (cluster: string) =>
  await setValue('cluster', cluster);
const getGasCap = async () => await getValue('gasCap');
const setGasCap = async (gasCap: string) => await setValue('gasCap', gasCap);
const getEVMChains = async () => await getSet('chains-evm');
const getEVMChain = async (chainId: string) =>
  await getValue(`chain-evm:${chainId}`);
const addEVMChain = async (chainId: string, chain: string) => {
  await setValue(`chain-evm:${chainId}`, chain);
  await addToSet('chains-evm', chainId);
};
const removeEVMChain = async (chainId: string) => {
  await deleteValue(`chain-evm:${chainId}`);
  await removeFromSet('chains-evm', chainId);
};
const getSolanaChains = async () => await getSet('chains-solana');
const getSolanaChain = async (cluster: string) =>
  await getValue(`chain-solana:${cluster}`);
const addSolanaChain = async (cluster: string, chain: string) => {
  await setValue(`chain-solana:${cluster}`, chain);
  await addToSet('chains-solana', cluster);
};
const removeSolanaChain = async (cluster: string) => {
  await deleteValue(`chain-solana:${cluster}`);
  await removeFromSet('chains-solana', cluster);
};

const getEVMVerifierAddresses = async () => await getSet('verifiers-evm');
const getEVMVerifierAddress = async (chainId: string) =>
  await getValue(`verifier-evm:${chainId}`);
const addEVMVerifierAddress = async (
  chainId: number | string,
  verifierAddress: Address
) => {
  await setValue(`verifier-evm:${chainId}`, verifierAddress);
  await addToSet('verifiers-evm', chainId);
};
const removeEVMVerifierAddress = async (chainId: string) => {
  await deleteValue(`verifier-evm:${chainId}`);
  await removeFromSet('verifiers-evm', chainId);
};

const getSolanaVerifierPrograms = async () => await getSet('verifiers-solana');
const getSolanaVerifierProgram = async (cluster: string) =>
  await getValue(`verifier-solana:${cluster}`);
const addSolanaVerifierProgram = async (cluster: string, verifier: string) => {
  await setValue(`verifier-solana:${cluster}`, verifier);
  await addToSet('verifiers-solana', cluster);
};
const removeSolanaVerifierProgram = async (cluster: string) => {
  await deleteValue(`verifier-solana:${cluster}`);
  await removeFromSet('verifiers-solana', cluster);
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

const getIdl = async (feedId: string, cluster: string) =>
  await getValue(`idl:${feedId}:${cluster}`);
const setIdl = async (feedId: string, cluster: string, idl: string) =>
  await setValue(`idl:${feedId}:${cluster}`, idl);
const getInstructionName = async (feedId: string, cluster: string) =>
  await getValue(`instructionName:${feedId}:${cluster}`);
const setInstructionName = async (
  feedId: string,
  cluster: string,
  instructionName: string
) => await setValue(`instructionName:${feedId}:${cluster}`, instructionName);
const getInstrutctionArgs = async (feedId: string, cluster: string) =>
  await getList(`instructionArgs:${feedId}:${cluster}`);
const setInstructionArgs = async (
  feedId: string,
  chainId: string,
  instructionArgs: string[]
) => await setList(`instructionArgs:${feedId}:${chainId}`, instructionArgs);
const getInstructionPDA = async (feedId: string, cluster: string) =>
  await getValue(`instructionPDA:${feedId}:${cluster}`);
const setInstructionPDA = async (
  feedId: string,
  cluster: string,
  instructionPDA: string
) => await setValue(`instructionPDA:${feedId}:${cluster}`, instructionPDA);

const getVm = async () => {
  const vm = await getValue('vm');
  if (vm === 'svm') {
    return vm;
  }
  return 'evm';
};
const setVm = async (vm: 'evm' | 'svm') => setValue('vm', vm);

const seedConfig = async (config: Config) => {
  try {
    const isSeeded = !!(await getSeed());
    if (isSeeded) {
      logger.warn('ℹ️ App already configured');
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

    if (!config.vm || (config.vm !== 'evm' && config.vm !== 'svm')) {
      await setVm('evm');
      logger.info(`📢 No valid VM setting provided, setting to EVM`);
    } else {
      await setVm(config.vm);
      logger.info(`📢 VM set to ${config.vm.toUpperCase()}`);
    }

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

        await addEVMChain(chain.id.toString(), JSON.stringify(chain));
        logger.info(`📢 New chain has been added | ${chain.name}`, { chain });
      })
    );

    await Promise.all(
      config.verifierAddresses.map(async (verifier) => {
        if (!verifier.chainId || isNaN(Number(verifier.chainId))) {
          logger.warn('⚠ Invalid verifier chain id', { verifier });
          return;
        }
        if (!isAddress(verifier.address) || verifier.address === zeroAddress) {
          logger.warn('⚠ Invalid verifier contract address', { verifier });
          return;
        }
        await addEVMVerifierAddress(verifier.chainId, verifier.address);
        logger.info(
          `📢 Verifier contract has been added for chain with ID ${verifier.chainId}`,
          { verifier }
        );
      })
    );

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

    if (config.svm) {
      config.svm.chains &&
        (await Promise.all(
          config.svm.chains.map(async (data) => {
            const chain = {
              cluster: data.cluster,
              name: data.name,
              rpcUrl: data.rpcUrl,
              testnet: data.testnet,
            };
            if (!chain) {
              logger.warn('⚠ Invalid chain input', { chain });
              return;
            }
            if (!chain.cluster) {
              logger.warn('⚠ Cluster is missing', { chain });
              return;
            }
            if (!chain.name) {
              logger.warn('⚠ Chain name is missing', { chain });
              return;
            }
            if (!chain.rpcUrl) {
              logger.warn('⚠ RPC url is missing', { chain });
              return;
            }

            await addSolanaChain(chain.cluster, JSON.stringify(chain));
            logger.info(`📢 New chain has been added | ${chain.name}`, {
              chain,
            });
          })
        ));

      if (config.svm.cluster) {
        await setCluster(config.svm.cluster);
        logger.info(`📢 Cluster set to ${config.svm.cluster}`, {
          cluster: config.svm.cluster,
        });
      }

      config.svm.verifierPrograms &&
        (await Promise.all(
          config.svm.verifierPrograms.map(async (verifier) => {
            if (!verifier.cluster) {
              logger.warn('⚠ Invalid verifier cluster', { verifier });
              return;
            }
            if (!isAddress(verifier.verifierProgramID)) {
              logger.warn('⚠ Invalid verifier program ID', { verifier });
              return;
            }
            if (!isAddress(verifier.accessControllerAccount)) {
              logger.warn('⚠ Invalid access controller account', { verifier });
              return;
            }
            await addSolanaVerifierProgram(
              verifier.cluster,
              JSON.stringify({
                verifierProgramID: verifier.verifierProgramID,
                accessControllerAccount: verifier.accessControllerAccount,
              })
            );
            logger.info(
              `📢 Verifier program has been added for cluster ${verifier.cluster}`,
              { verifier }
            );
          })
        ));

      await Promise.all(
        config.svm.targetChains.map(async ({ cluster, targetPrograms }) => {
          if (!cluster) {
            logger.warn('⚠ Contract cluster invalid input');
            return;
          }
          await Promise.all(
            targetPrograms.map(async (program) => {
              try {
                const {
                  feedId,
                  idl,
                  instructionName,
                  instructionArgs,
                  instructionPDA,
                } = program;

                if (!feedId || !isHex(feedId)) {
                  logger.warn('⚠ Program feedId invalid input', program);
                  return;
                }
                if (idl) {
                  await setIdl(feedId, cluster, JSON.stringify(idl));
                  logger.info(
                    `📢 IDL has been set for feed ${feedId} on chain ${cluster}`,
                    {
                      feedId,
                      cluster,
                      idl,
                    }
                  );
                }
                if (instructionName) {
                  await setInstructionName(feedId, cluster, instructionName);
                  logger.info(
                    `📢 New instruction ${instructionName} has been set for feed ${feedId}`,
                    {
                      feedId,
                      cluster,
                      instructionName,
                    }
                  );
                }
                if (instructionArgs && instructionArgs.length > 0) {
                  await setInstructionArgs(
                    feedId,
                    cluster,
                    instructionArgs.map((arg) => JSON.stringify(arg))
                  );
                  logger.info(
                    `📢 Set of arguments ${instructionArgs
                      .map(({ name }) => name)
                      .join(
                        ', '
                      )} has been set for feed ${feedId} on chain ${cluster}`,
                    { feedId, cluster, instructionArgs }
                  );
                }
                if (instructionPDA) {
                  await setInstructionPDA(feedId, cluster, instructionPDA);
                  logger.info(
                    `📢 New instruction PDA ${instructionPDA} has been set for feed ${feedId}`,
                    {
                      feedId,
                      cluster,
                      instructionPDA,
                    }
                  );
                }
              } catch (error) {
                logger.error('ERROR', { error });
                console.error(error);
              }
            })
          );
        })
      );
    }

    await setSeed();
    logger.info('💽 App configured successfully', { config });
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
  getCluster,
  setCluster,
  getContractAddress,
  setContractAddress,
  getSkipVerify,
  setSkipVerify,
  getGasCap,
  setGasCap,
  getEVMChains,
  getEVMChain,
  addEVMChain,
  removeEVMChain,
  getSolanaChains,
  getSolanaChain,
  addSolanaChain,
  removeSolanaChain,
  getEVMVerifierAddresses,
  getEVMVerifierAddress,
  addEVMVerifierAddress,
  removeEVMVerifierAddress,
  getSolanaVerifierPrograms,
  getSolanaVerifierProgram,
  addSolanaVerifierProgram,
  removeSolanaVerifierProgram,
  seedConfig,
  getVm,
  setVm,
  getIdl,
  setIdl,
  getInstructionName,
  setInstructionName,
  getInstrutctionArgs,
  setInstructionArgs,
  getInstructionPDA,
  setInstructionPDA,
};

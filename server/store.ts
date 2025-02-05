import { Abi, Address } from 'viem';
import { clientConfig, onChainConfig } from './config/config';
import { StreamReport } from './types';

const store: {
  functionName: string;
  interval: string;
  functionArgs: string[];
  abi: Abi;
  latestReports: { [key: string]: StreamReport };
  savedReports: { [key: string]: StreamReport };
  feeds: { name: string; feedId: string }[];
  priceDelta: bigint;
  chainId: number;
  contractAddress: Address;
  gasCap: bigint;
} = {
  functionName: onChainConfig.functionName,
  interval: clientConfig.intervalSchedule,
  functionArgs: onChainConfig.functionArgs,
  abi: onChainConfig.abi,
  latestReports: {},
  savedReports: {},
  feeds: clientConfig.feeds,
  priceDelta: BigInt(clientConfig.priceDelta),
  chainId: onChainConfig.chainId,
  contractAddress: onChainConfig.contractAddress,
  gasCap: BigInt(onChainConfig.gasCap),
};

const getFunctionName = () => store.functionName;
const setFunctionName = (functionName: string) =>
  (store.functionName = functionName);
const getInterval = () => store.interval;
const setInterval = (interval: string) => (store.interval = interval);
const getFunctionArgs = () => store.functionArgs;
const setFunctionArgs = (functionArgs: string[]) =>
  (store.functionArgs = functionArgs);
const getAbi = () => store.abi;
const setAbi = (abi: Abi) => (store.abi = abi);
const getLatestReport = (feedId: string) => store.latestReports[feedId];
const setLatestReport = (report: StreamReport) =>
  (store.latestReports[report.feedId] = report);
const getSavedReportBenchmarkPrice = (feedId: string) =>
  store.savedReports[feedId]?.benchmarkPrice ?? BigInt(0);
const setSavedReport = (report: StreamReport) =>
  (store.savedReports[report.feedId] = report);
const getFeeds = () => store.feeds;
const getFeed = (feedId: string) =>
  store.feeds.find((feed) => feed.feedId === feedId);
const addFeed = (feed: { feedId: string; name: string }) =>
  store.feeds.push(feed);
const removeFeed = (feedId: string) =>
  (store.feeds = store.feeds.filter((feed) => feed.feedId !== feedId));
const getPriceDelta = () => store.priceDelta;
const setPriceDelta = (priceDelta: bigint) => (store.priceDelta = priceDelta);
const getChainId = () => store.chainId;
const setChainId = (chainId: number) => (store.chainId = chainId);
const getContractAddress = () => store.contractAddress;
const setContractAddress = (address: Address) =>
  (store.contractAddress = address);
const getGasCap = () => store.gasCap;
const setGasCap = (gasCap: bigint) => (store.gasCap = gasCap);

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
  getFeed,
  addFeed,
  removeFeed,
  getPriceDelta,
  setPriceDelta,
  getChainId,
  setChainId,
  getContractAddress,
  setContractAddress,
  getGasCap,
  setGasCap,
};

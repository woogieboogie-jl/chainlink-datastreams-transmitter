import { Address } from 'viem';
import { StreamReport } from './types';
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
};

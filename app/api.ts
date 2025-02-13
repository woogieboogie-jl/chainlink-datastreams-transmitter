import { Feed, Interval } from 'server/types';
import { Address } from 'viem';

const url = `${process.env.API_URL || 'http://localhost:3000'}/api`;
const postOptions = <T>(body?: T) => ({
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

export async function fetchFeeds() {
  const result = await fetch(`${url}/feeds`);
  const data: Feed[] = await result.json();
  return data;
}

export async function fetchInterval() {
  const result = await fetch(`${url}/interval`);
  const data: Interval = await result.json();
  return data;
}

export async function fetchAccountAddress() {
  const result = await fetch(`${url}/account`);
  const data: { address: Address } = await result.json();
  return data;
}

export async function fetchContractAddresses() {
  const result = await fetch(`${url}/contracts`);
  const data: {
    verifierProxyAddress: Address;
    feeManagerAddress: Address;
    rewardManagerAddress: Address;
    feeTokenAddress: Address;
  } = await result.json();
  return data;
}

export async function addFeed(feed: Feed) {
  return await fetch(`${url}/feeds/add`, postOptions<Feed>(feed));
}

export async function removeFeed(feed: { feedId: string }) {
  return await fetch(
    `${url}/feeds/remove`,
    postOptions<{ feedId: string }>(feed)
  );
}

export async function setInterval(interval: Interval) {
  return await fetch(`${url}/interval`, postOptions<Interval>(interval));
}

export async function fetchLogs() {
  const result = await fetch(`${url}/logs`);
  const data: { log: string } = await result.json();
  return data;
}

export async function fetchChainId() {
  const result = await fetch(`${url}/chain`);
  const data: { chainId: string } = await result.json();
  return data;
}

export async function switchChain(chain: { chainId: string | number }) {
  return await fetch(
    `${url}/chain`,
    postOptions<{ chainId: string | number }>(chain)
  );
}

export async function startStreams() {
  return await fetch(`${url}/start`, postOptions());
}

export async function stopStreams() {
  return await fetch(`${url}/stop`, postOptions());
}

export async function fetchAbi() {
  const result = await fetch(`${url}/abi`);
  const data: { abi: string } = await result.json();
  return data;
}

export async function setAbi(abi: { abi: string }) {
  return await fetch(`${url}/abi`, postOptions<{ abi: string }>(abi));
}

export async function fetchFunctionName() {
  const result = await fetch(`${url}/function`);
  const data: { functionName: string } = await result.json();
  return data;
}

export async function setFunctionName(functionName: { functionName: string }) {
  return await fetch(
    `${url}/function`,
    postOptions<{ functionName: string }>(functionName)
  );
}

export async function fetchFunctionArgs() {
  const result = await fetch(`${url}/args`);
  const data: { functionArgs: string[] } = await result.json();
  return data;
}

export async function setFunctionArgs(args: { args: string }) {
  return await fetch(
    `${url}/args`,
    postOptions<{ args: string[] }>({
      args: args.args.split(',').map((a) => a.trim()),
    })
  );
}

export async function fetchContractAddress() {
  const result = await fetch(`${url}/contract`);
  const data: { contract: string } = await result.json();
  return data;
}

export async function setContractAddress(contract: { contract: string }) {
  return await fetch(
    `${url}/contract`,
    postOptions<{ contract: string }>(contract)
  );
}

export async function fetchGasCap() {
  const result = await fetch(`${url}/gascap`);
  const data: { gasCap: string } = await result.json();
  return data;
}

export async function setGasCap(cap: { gasCap: string }) {
  return await fetch(`${url}/gascap`, postOptions<{ gasCap: string }>(cap));
}

export async function fetchPriceDelta() {
  const result = await fetch(`${url}/delta`);
  const data: { priceDelta: string } = await result.json();
  return data;
}

export async function setPriceDelta(delta: { priceDelta: string }) {
  return await fetch(
    `${url}/delta`,
    postOptions<{ priceDelta: string }>(delta)
  );
}

export async function addChain(chain: unknown) {
  return await fetch(`${url}/chains/add`, postOptions({ chain }));
}

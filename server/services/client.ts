import {
  getCurrentChain as getCurrentSolanaChain,
  accountAddress as solanaAccountAddress,
  getBalance as getSolanaBalanace,
} from './clientSolana';
import {
  getCurrentChain as getCurrentEvmChain,
  accountAddress as evmAccountAddress,
  getBalance as getEvmBalance,
  getLinkBalance as getEvmLinkBalance,
} from './clientEvm';
import { getChainId, getCluster, getVm } from 'server/store';
import { zeroAddress } from 'viem';

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

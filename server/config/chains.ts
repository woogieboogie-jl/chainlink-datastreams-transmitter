import { printError } from '../utils';
import { logger } from '../services/logger';
import { getChain, getChains, getSolanaChain, getSolanaChains } from '../store';
import { defineChain } from 'viem';
import {
  arbitrum,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  Chain,
  opBNB,
  opBNBTestnet,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
  shibarium,
  shibariumTestnet,
  soneiumMinato,
  sonic,
  sonicTestnet,
  worldchain,
  worldchainSepolia,
} from 'viem/chains';

export const defaultChains: readonly [Chain, ...Chain[]] = [
  arbitrum,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  opBNB,
  opBNBTestnet,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
  shibarium,
  shibariumTestnet,
  soneiumMinato,
  sonic,
  sonicTestnet,
  worldchain,
  worldchainSepolia,
];

export const getCustomChains = async () => {
  const chainsList = await getChains();
  return (
    await Promise.all(
      chainsList.map(async (chainId) => await getChain(chainId))
    )
  )
    .filter((chain) => chain !== null)
    .map((chain) => {
      try {
        return defineChain(JSON.parse(chain)) as Chain;
      } catch (error) {
        logger.error(printError(error), error);
        console.error(error);
        return null;
      }
    })
    .filter((chain) => chain !== null);
};

export const getAllChains = async () => {
  const customChains = await getCustomChains();
  const chains: readonly [Chain, ...Chain[]] = [
    ...defaultChains,
    ...customChains,
  ];
  return chains;
};

const solanaChains = [
  {
    cluster: 'devnet',
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
  },
];

const getCustomSolanaChains = async () => {
  const chainsList = await getSolanaChains();
  return (
    await Promise.all(
      chainsList.map(async (cluster) => await getSolanaChain(cluster))
    )
  )
    .filter((cluster) => cluster !== null)
    .map((chain) => {
      try {
        return JSON.parse(chain) as {
          cluster: string;
          name: string;
          rpcUrl: string;
        };
      } catch (error) {
        logger.error('ERROR', error);
        return null;
      }
    })
    .filter((chain) => chain !== null);
};

export const getAllSolanaChains = async () => {
  const customChains = await getCustomSolanaChains();
  return [...solanaChains, ...customChains];
};

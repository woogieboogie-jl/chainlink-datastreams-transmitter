import { printError } from '../utils';
import { logger } from '../services/logger';
import {
  getEVMChain,
  getEVMChains,
  getSolanaChain,
  getSolanaChains,
} from '../store';
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

export const getCustomEVMChains = async () => {
  const chainsList = await getEVMChains();
  return (
    await Promise.all(
      chainsList.map(async (chainId) => await getEVMChain(chainId))
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

export const getAllEVMChains = async () => {
  const customChains = await getCustomEVMChains();
  const chains: readonly [Chain, ...Chain[]] = [
    ...defaultChains,
    ...customChains,
  ];
  return chains;
};

const solanaChains = [
  {
    cluster: 'mainnet-beta',
    name: 'Solana Mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  },
  {
    cluster: 'devnet',
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    testnet: true,
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
          testnet?: boolean;
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

export const getAllChains = async () => {
  const evmChains = await getAllEVMChains();
  const solanaChains = await getAllSolanaChains();
  return [
    ...evmChains.map((c) => ({
      id: c.id.toString(),
      name: c.name,
      testnet: c.testnet,
      vm: 'evm',
    })),
    ...solanaChains.map((c) => ({
      id: c.cluster,
      name: c.name,
      testnet: c.testnet,
      vm: 'svm',
    })),
  ] as {
    id: string;
    name: string;
    testnet?: boolean;
    vm: 'evm' | 'svm';
  }[];
};

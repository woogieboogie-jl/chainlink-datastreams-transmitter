import { describe, jest, afterEach, it, expect } from '@jest/globals';
import {
  addEVMChain,
  addFeed,
  getAbi,
  getEVMChain,
  getChainId,
  getContractAddress,
  getFeedExists,
  getFeedName,
  getFeeds,
  getFunctionArgs,
  getFunctionName,
  getGasCap,
  getInterval,
  getLatestReport,
  getPriceDelta,
  getSavedReportBenchmarkPrice,
  getSkipVerify,
  removeEVMChain,
  removeFeed,
  seedConfig,
  setLatestReport,
  setSavedReport,
  getCluster,
  addSolanaChain,
  getSolanaChain,
  removeSolanaChain,
} from '../server/store';
import { Config, StreamReport } from '../server/types';
import { logger } from '../server/services/logger';

describe('Store', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('store', () => {
    it('should set and get latest report', () => {
      setLatestReport(mockRawReport as unknown as StreamReport);
      const result = getLatestReport(mockRawReport.feedId);
      expect(result).toEqual(mockRawReport);
    });
    it('should set and get saved report benchmark price', async () => {
      await setSavedReport(mockRawReport as unknown as StreamReport);
      const result = await getSavedReportBenchmarkPrice(mockRawReport.feedId);
      expect(result).toEqual(mockRawReport.benchmarkPrice.toString());
    });
    it('should seed', async () => {
      await seedConfig(mockConfig);
      const interval = await getInterval();
      expect(interval).toEqual(mockConfig.interval);
      const priceDelta = await getPriceDelta();
      expect(priceDelta).toEqual(mockConfig.priceDeltaPercentage.toString());
      const gasCap = await getGasCap();
      expect(gasCap).toEqual(mockConfig.gasCap);
      const chainId = await getChainId();
      expect(chainId).toEqual(mockConfig.chainId.toString());
      const functionName = await getFunctionName(
        '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796',
        '995'
      );
      expect(functionName).toEqual('set');
      const functionArgs = await getFunctionArgs(
        '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796',
        '995'
      );
      expect(functionArgs).toEqual(
        expect.arrayContaining(['fedId', 'price', 'validFromTimestamp'])
      );
      const contractAddress = await getContractAddress(
        '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796',
        '995'
      );
      expect(contractAddress).toEqual(
        '0xfa162F0A25b2C2aA32Ddaacda872B6D7b2c38E47'
      );
      const skipVerify = await getSkipVerify(
        '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796',
        '995'
      );
      expect(skipVerify).toEqual('true');
      const abi = await getAbi(
        '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796',
        '995'
      );
      expect(abi).toEqual(
        JSON.stringify(mockConfig.targetChains[0]?.targetContracts[0]?.abi)
      );
      const cluster = await getCluster();
      expect(cluster).toEqual('devnet');
    });
    it('should skip if already seeded', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      await seedConfig(mockConfig);
      await seedConfig(mockConfig);
      expect(logSpy).toHaveBeenCalledWith('ℹ️ App already configured');
    });
    it('should set get and remove feeds', async () => {
      const feed1 = {
        feedId:
          '0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba782',
        name: 'ETH/USD',
      };
      const feed2 = {
        feedId:
          '0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439',
        name: 'BTC/USD',
      };
      await addFeed(feed1);
      await addFeed(feed2);
      const allFeeds = await getFeeds();
      expect(allFeeds).toEqual(
        expect.arrayContaining([feed2.feedId, feed1.feedId])
      );
      const feedName = await getFeedName(feed1.feedId);
      expect(feedName).toEqual(feed1.name);
      const isFeedExist = await getFeedExists(feed2.feedId);
      expect(isFeedExist).toEqual(true);
      await removeFeed(feed2.feedId);
      const isFeedExistRemoved = await getFeedExists(feed2.feedId);
      expect(isFeedExistRemoved).toEqual(false);
    });
    it('should remove evm chain', async () => {
      const chainInput = {
        id: 995,
        name: '🔥 5ireChain',
        currencyName: '5ire Token',
        currencySymbol: '5IRE',
        currencyDecimals: 18,
        rpc: 'https://rpc.5ire.network',
      };
      await addEVMChain(chainInput.id.toString(), JSON.stringify(chainInput));
      const chainResult = await getEVMChain(chainInput.id.toString());
      expect(chainResult).toEqual(JSON.stringify(chainInput));
      await removeEVMChain(chainInput.id.toString());
      const chainResultAfter = await getEVMChain(chainInput.id.toString());
      expect(chainResultAfter).toEqual(null);
    });
    it('should remove svm chain', async () => {
      const chainInput = {
        cluster: 'devnet',
        name: 'Solana Devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        testnet: true,
      };
      await addSolanaChain(
        chainInput.cluster.toString(),
        JSON.stringify(chainInput)
      );
      const chainResult = await getSolanaChain(chainInput.cluster);
      expect(chainResult).toEqual(JSON.stringify(chainInput));
      await removeSolanaChain(chainInput.cluster);
      const chainResultAfter = await getSolanaChain(chainInput.cluster);
      expect(chainResultAfter).toEqual(null);
    });
  });
});

const mockRawReport = {
  feedId: '0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439',
  observationsTimestamp: 1744113993n,
  validFromTimestamp: 1744113993n,
  rawReport:
    '0x00094bdfff2836d6533428dd204f5864470dc055e6bdd01f34502fe890d5ed260000000000000000000000000000000000000000000000000000000000fe3e03000000000000000000000000000000000000000000000000000000030000000100000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002800001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012000037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b4390000000000000000000000000000000000000000000000000000000067f511490000000000000000000000000000000000000000000000000000000067f511490000000000000000000000000000000000000000000000000000b7aed0d99bb30000000000000000000000000000000000000000000000000060e3d80e9289d000000000000000000000000000000000000000000000000000000000681c9e490000000000000000000000000000000000000000000010ede9aaeb1152b900000000000000000000000000000000000000000000000010ede445c373e184f8000000000000000000000000000000000000000000000010edef0e4bef7189c8000000000000000000000000000000000000000000000000000000000000000002066e5b83d082f5ec425e97aae425f15923791c43594f34099cdb439d757607e744753d7b4743ae52c019b8dd8150f0c4955a956092f879a6f9ba19dd56e6349800000000000000000000000000000000000000000000000000000000000000027bcdde1477ab34cc72e341b19fa57a2dadf6d4df2fcc372c562b7d4542928140519a35dba9e1c5e1752b6197277897624609eb6ec47213b84d173e31b3f04524',
  nativeFee: 201961456114611n,
  linkFee: 27272114861148624n,
  expiresAt: 1746705993n,
  benchmarkPrice: 79946579600000000000000n,
  version: 'v3',
  marketStatus: 2n,
};

const mockConfig: Config = {
  gasCap: '150000',
  interval: '*/15 * * * * *',
  priceDeltaPercentage: 0.01,
  chainId: 995,
  chains: [
    {
      id: 995,
      name: '🔥 5ireChain',
      currencyName: '5ire Token',
      currencySymbol: '5IRE',
      currencyDecimals: 18,
      rpc: 'https://rpc.5ire.network',
    },
  ],
  verifierAddresses: [
    { chainId: 995, address: '0xfa162F0A25b2C2aA32Ddaacda872B6D7b2c38E47' },
  ],
  feeds: [
    {
      feedId:
        '0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba782',
      name: 'ETH/USD',
    },
    {
      feedId:
        '0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439',
      name: 'BTC/USD',
    },
  ],
  targetChains: [
    {
      chainId: 995,
      targetContracts: [
        {
          feedId:
            '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796',
          address: '0xfa162F0A25b2C2aA32Ddaacda872B6D7b2c38E47',
          skipVerify: true,
          functionName: 'set',
          functionArgs: ['fedId', 'price', 'validFromTimestamp'],
          abi: [
            {
              inputs: [
                {
                  internalType: 'bytes32',
                  name: 'feedId',
                  type: 'bytes32',
                },
                {
                  internalType: 'uint32',
                  name: 'validFromTimestamp',
                  type: 'uint32',
                },
                {
                  internalType: 'uint32',
                  name: 'observationsTimestamp',
                  type: 'uint32',
                },
                {
                  internalType: 'uint192',
                  name: 'nativeFee',
                  type: 'uint192',
                },
                {
                  internalType: 'uint192',
                  name: 'linkFee',
                  type: 'uint192',
                },
                {
                  internalType: 'uint32',
                  name: 'expiresAt',
                  type: 'uint32',
                },
                {
                  internalType: 'int192',
                  name: 'price',
                  type: 'int192',
                },
                { internalType: 'int192', name: 'bid', type: 'int192' },
                { internalType: 'int192', name: 'ask', type: 'int192' },
              ],
              name: 'set',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
        },
      ],
    },
  ],
  vm: 'evm',
  svm: {
    cluster: 'devnet',
    chains: [
      {
        cluster: 'devnet',
        name: 'Solana Devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        testnet: true,
      },
    ],
    targetChains: [
      {
        cluster: 'devnet',
        targetPrograms: [
          {
            feedId:
              '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796',
            skipVerify: false,
            instructionName: 'updatePrice',
            instructionArgs: [
              { name: 'feedId', type: 'string' },
              { name: 'price', type: 'number' },
            ],
            instructionPDA: 'price-feed',
            idl: {
              address: 'zDecnPdGtuXypFqhnUsVJtUT5BCwgdzygyECT1bKGNo',
              metadata: {
                name: 'price_feed',
                version: '0.1.0',
                spec: '0.1.0',
                description: 'Created with Anchor',
              },
              instructions: [
                {
                  name: 'initialize',
                  discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
                  accounts: [
                    {
                      name: 'price_feed',
                      writable: true,
                      pda: {
                        seeds: [
                          {
                            kind: 'const',
                            value: [
                              112, 114, 105, 99, 101, 45, 102, 101, 101, 100,
                            ],
                          },
                        ],
                      },
                    },
                    { name: 'signer', writable: true, signer: true },
                    {
                      name: 'system_program',
                      address: '11111111111111111111111111111111',
                    },
                  ],
                  args: [],
                },
                {
                  name: 'update_price',
                  discriminator: [61, 34, 117, 155, 75, 34, 123, 208],
                  accounts: [
                    { name: 'price_feed', writable: true },
                    { name: 'signer', signer: true },
                  ],
                  args: [
                    { name: 'feed_id', type: 'string' },
                    { name: 'price', type: 'i128' },
                    { name: 'date', type: 'i128' },
                  ],
                },
              ],
              accounts: [
                {
                  name: 'PriceFeed',
                  discriminator: [189, 103, 252, 23, 152, 35, 243, 156],
                },
              ],
              types: [
                {
                  name: 'PriceFeed',
                  type: {
                    kind: 'struct',
                    fields: [
                      { name: 'feed_id', type: 'string' },
                      { name: 'price', type: 'i128' },
                      { name: 'date', type: 'i128' },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  },
};

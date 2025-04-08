import { describe, it, expect } from '@jest/globals';
import { getAllChains, getCustomChains } from '../server/config/chains';
import { addChain } from '../server/store';
import { Chain } from 'viem';

describe('Client', () => {
  describe('chains', () => {
    it('should return an empty array on fetching customChains if none have been added', async () => {
      const result: (Chain | null)[] = await getCustomChains();
      expect(result).toEqual([]);
    });

    it('should return a list of defaultChains', async () => {
      const result = await getAllChains();
      expect(result).toBeInstanceOf(Array);
    });

    it('should add custom chains and return all valid chains', async () => {
      const chain1 = {
        id: 21000,
        name: 'Chain 1',
        nativeCurrency: {
          decimals: 18,
          name: 'CHAIN',
          symbol: 'CHA',
        },
        rpcUrls: {
          default: { http: {} },
        },
        testnet: true,
      };

      const chain2 = {
        id: 21001,
        name: 'Chain 2',
        nativeCurrency: {
          decimals: 18,
          name: 'CHAIN2',
          symbol: 'CHN',
        },
        rpcUrls: {
          default: { http: {} },
        },
        testnet: true,
      };

      const customChainsBefore = await getCustomChains();

      await addChain(chain1.id.toString(), JSON.stringify(chain1));
      await addChain(chain2.id.toString(), JSON.stringify(chain2));

      const customChainsAfter = await getCustomChains();

      expect(customChainsAfter.length).toBeGreaterThan(
        customChainsBefore.length
      );
    });
  });
});

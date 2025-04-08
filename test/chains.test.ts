import { describe, jest, afterEach, it, expect } from '@jest/globals';
import { getAllChains, getCustomChains } from '../server/config/chains';

describe('Client', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('chains', () => {
    it('should return an empty array on fetching customChains if none have been added', async () => {
      const result = await getCustomChains();
      expect(result).toEqual([]);
    });

    it('should return a list of defaultChains', async () => {
      const result = await getAllChains();
      expect(result).toBeInstanceOf(Array);
    });
  });
});

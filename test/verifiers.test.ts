import { describe, jest, afterEach, it, expect } from '@jest/globals';
import {
  getAllVerifiers,
  getCustomVerifiers,
  getVerifier,
} from '../server/config/verifiers';

describe('Client', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('verifiers', () => {
    it('should get correct verifier address', async () => {
      const result = await getVerifier('42161');
      expect(result).toEqual('0x478Aa2aC9F6D65F84e09D9185d126c3a17c2a93C');
    });

    it('should return undefined on incorrect chainId', async () => {
      const result = await getVerifier('123');
      expect(result).toEqual(undefined);
    });

    it('should return an empty array on fetching customVerifiers if none have been added', async () => {
      const result = await getCustomVerifiers();
      expect(result).toEqual([]);
    });

    it('should return a list of defaultVerifiers', async () => {
      const result = await getAllVerifiers();
      expect(result).toBeInstanceOf(Array);
    });
  });
});

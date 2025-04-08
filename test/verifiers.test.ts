import { describe, jest, afterEach, it, expect } from '@jest/globals';
import { getVerifier } from '../server/config/verifiers';

describe('Client', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('verifiers', () => {
    it.only('should get correct verifier address', async () => {
      const result = await getVerifier('42161');
      expect(result).toEqual('0x478Aa2aC9F6D65F84e09D9185d126c3a17c2a93C');
    });
  });
});

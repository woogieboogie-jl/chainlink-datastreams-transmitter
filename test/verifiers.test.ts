import {
  describe,
  jest,
  afterEach,
  it,
  expect,
  beforeEach,
} from '@jest/globals';
import {
  getAllEVMVerifiers,
  getCustomEVMVerifiers,
  getEVMVerifier,
  getSolanaVerifier,
} from '../server/config/verifiers';
import {
  addEVMVerifierAddress,
  addSolanaVerifierProgram,
} from '../server/store';
import { flushAll } from '../server/services/redis';
import { Callback } from 'ioredis';

describe('Client', () => {
  beforeEach(() => {
    process.env = { NODE_ENV: 'test' };
  });
  afterEach((done) => {
    jest.resetAllMocks();
    flushAll(done as Callback<'OK'>);
  });

  describe('verifiers', () => {
    it('should get correct verifier address', async () => {
      const defaultVerifier = await getEVMVerifier('42161');
      expect(defaultVerifier).toEqual(
        '0x478Aa2aC9F6D65F84e09D9185d126c3a17c2a93C'
      );
      await addEVMVerifierAddress(
        '42161',
        '0x76491E740d2aF4152c9fCbC4869CE1f5B98b71CD'
      );
      const customVerifier = await getEVMVerifier('42161');
      expect(customVerifier).toEqual(
        '0x76491E740d2aF4152c9fCbC4869CE1f5B98b71CD'
      );
    });

    it('should return undefined on incorrect chainId', async () => {
      const result = await getEVMVerifier('123');
      expect(result).toEqual(undefined);
    });

    it('should return an empty array on fetching customVerifiers if none have been added', async () => {
      const result = await getCustomEVMVerifiers();
      expect(result).toEqual([]);
    });

    it('should return a list of defaultVerifiers', async () => {
      const result = await getAllEVMVerifiers();
      expect(result).toBeInstanceOf(Array);
    });

    it('should get solana verifier', async () => {
      const defaultVerifier = await getSolanaVerifier('devnet');
      expect(defaultVerifier?.verifierProgramID).toEqual(
        'Gt9S41PtjR58CbG9JhJ3J6vxesqrNAswbWYbLNTMZA3c'
      );
      expect(defaultVerifier?.accessControllerAccount).toEqual(
        '2k3DsgwBoqrnvXKVvd7jX7aptNxdcRBdcd5HkYsGgbrb'
      );
      const customVerifierInput = {
        verifierProgramID: 'zDecnPdGtuXypFqhnUsVJtUT5BCwgdzygyECT1bKGNo',
        accessControllerAccount: '7mSn5MoBjyRLKoJShgkep8J17ueGG8rYioVAiSg5YWMF',
      };
      await addSolanaVerifierProgram(
        'devnet',
        JSON.stringify(customVerifierInput)
      );
      const customVerifier = await getSolanaVerifier('devnet');
      expect(customVerifier?.verifierProgramID).toEqual(
        customVerifierInput.verifierProgramID
      );
      expect(customVerifier?.accessControllerAccount).toEqual(
        customVerifierInput.accessControllerAccount
      );
    });
  });
});

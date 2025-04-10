import {
  describe,
  jest,
  afterEach,
  it,
  beforeEach,
  expect,
} from '@jest/globals';
import * as store from '../server/store';
import * as verifiers from '../server/config/verifiers';
import {
  executeSolanaProgram,
  verifyReport,
} from '../server/services/clientSolana';
import {
  mockInstructionArgs,
  mockInstructionName,
  mockInstructionPDA,
  mockInvalidRawReport,
  mockInvalidVersionRawReport,
  mockRawReport,
  mockSecretKey,
} from './mocks';
import { StreamReport } from '../server/types';
import { logger } from '../server/services/logger';

jest.mock('../server/services/logger');

const getClusterMock = jest.spyOn(store, 'getCluster');
const getVerifierMock = jest.spyOn(verifiers, 'getSolanaVerifier');

describe('SVM Client', () => {
  beforeEach(() => {
    process.env.SECRET_KEY_SVM = mockSecretKey;
  });
  afterEach(() => {
    jest.resetAllMocks();
    process.env = { NODE_ENV: 'test' };
  });

  describe('verifyReport', () => {
    it('should abort if secret key is missing', async () => {
      process.env = { NODE_ENV: 'test' };
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
    });
    it('should abort if cluster is missing', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      getClusterMock.mockResolvedValue(null);
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
      expect(logSpy).toHaveBeenCalledWith('⚠️ No cluster provided');
    });
    it('should abort if cluster is invalid', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      getClusterMock.mockResolvedValue('mocknet');
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
      expect(logSpy).toHaveBeenCalledWith('⚠️ Invalid chain', {
        cluster: 'mocknet',
      });
    });
    it('should abort if report is invalid', async () => {
      const logSpy = jest.spyOn(logger, 'error');
      getClusterMock.mockResolvedValue('devnet');
      const result = await verifyReport(
        mockInvalidRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
      expect(logSpy).toHaveBeenCalled();
    });
    it('should abort if invalid report version', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      getClusterMock.mockResolvedValue('devnet');
      const result = await verifyReport(
        mockInvalidVersionRawReport as unknown as StreamReport
      );
      expect(logSpy).toHaveBeenCalledWith('⚠️ Invalid report version', {
        report: mockInvalidVersionRawReport,
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if invalid verifier program', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      getClusterMock.mockResolvedValue('devnet');
      getVerifierMock.mockResolvedValueOnce(undefined);
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(logSpy).toHaveBeenCalledWith('⚠️ Invalid verifier', {
        cluster: 'devnet',
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if invalid verifier program', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      getClusterMock.mockResolvedValue('devnet');
      getVerifierMock.mockResolvedValueOnce(undefined);
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(logSpy).toHaveBeenCalledWith('⚠️ Invalid verifier', {
        cluster: 'devnet',
      });
      expect(result).toEqual(undefined);
    });
    it('should revert with 0 balance', async () => {
      const logSpy = jest.spyOn(logger, 'error');
      getClusterMock.mockResolvedValue('devnet');
      getVerifierMock.mockResolvedValueOnce({
        verifierProgramID: 'Gt9S41PtjR58CbG9JhJ3J6vxesqrNAswbWYbLNTMZA3c',
        accessControllerAccount: '2k3DsgwBoqrnvXKVvd7jX7aptNxdcRBdcd5HkYsGgbrb',
      });
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('executeSolanaProgram', () => {
    it('should abort if secret key is missing', async () => {
      const logSpy = jest.spyOn(logger, 'error');
      process.env = { NODE_ENV: 'test' };
      getClusterMock.mockResolvedValue('devnet');

      const result = await executeSolanaProgram({
        report: mockRawReport as unknown as StreamReport,
        instructionName: mockInstructionName,
        instructionArgs: mockInstructionArgs,
        idl: mockInstructionPDA,
        instructionPDA: mockInstructionPDA,
      });
      expect(result).toEqual(undefined);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('‼️ Account is missing')
      );
    });
  });
});

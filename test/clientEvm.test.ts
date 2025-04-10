import {
  describe,
  jest,
  afterEach,
  it,
  beforeEach,
  expect,
} from '@jest/globals';
import {
  executeContract,
  getClients,
  getTokenBalance,
  verifyReport,
} from '../server/services/clientEvm';
import { TransactionReceipt, zeroAddress, zeroHash } from 'viem';
import * as store from '../server/store';
import * as chains from '../server/config/chains';
import * as verifiers from '../server/config/verifiers';
import * as viemActions from 'viem/actions';
import { hardhat } from 'viem/chains';
import { StreamReport } from '../server/types';
import { logger } from '../server/services/logger';
import {
  mockAbi,
  mockFunctionArgs,
  mockFunctionName,
  mockInvalidRawReport,
  mockInvalidVersionRawReport,
  mockPrivateKey,
  mockRawReport,
  mockRawReportV4,
  mockReport,
  mockTransactionReceipt,
  mockVerifiedReport,
  mockVerifiedReportV4,
} from './mocks';

jest.mock('../server/services/logger');

const getContractAddressMock = jest.spyOn(store, 'getContractAddress');
const getChainIdMock = jest.spyOn(store, 'getChainId');
const getGasCapMock = jest.spyOn(store, 'getGasCap');
const getAllChainsMock = jest.spyOn(chains, 'getAllEVMChains');
const getCustomChainsMock = jest.spyOn(chains, 'getCustomEVMChains');
const estimateContractGasMock = jest.spyOn(viemActions, 'estimateContractGas');
const simulateContractMock = jest.spyOn(viemActions, 'simulateContract');
const simulateWriteContractMock = jest.spyOn(viemActions, 'writeContract');
const simulateReadContractMock = jest.spyOn(viemActions, 'readContract');
const simulateWaitForTransactionReceipt = jest.spyOn(
  viemActions,
  'waitForTransactionReceipt'
);
const getVerifierMock = jest.spyOn(verifiers, 'getEVMVerifier');
const getBalanceMock = jest.spyOn(viemActions, 'getBalance');

describe('Client', () => {
  beforeEach(() => {
    process.env.PRIVATE_KEY_EVM = mockPrivateKey;
  });
  afterEach(() => {
    jest.resetAllMocks();
    process.env = { NODE_ENV: 'test' };
  });

  describe('verifyReport', () => {
    it('should abort if private key is missing', async () => {
      process.env = { NODE_ENV: 'test' };
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
    });
    it('should abort if chain id is missing', async () => {
      getChainIdMock.mockResolvedValue(null);
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
    });
    it('should abort if chain is invalid', async () => {
      getChainIdMock.mockResolvedValue('31336');
      getAllChainsMock.mockResolvedValue([hardhat]);
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
    });
    it('should abort if report is invalid', async () => {
      getChainIdMock.mockResolvedValue('31337');
      getAllChainsMock.mockResolvedValue([hardhat]);
      const result = await verifyReport(
        mockInvalidRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
    });
    it('should abort if contracts are invalid', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      getVerifierMock.mockResolvedValueOnce(zeroAddress);
      simulateReadContractMock.mockResolvedValueOnce(zeroAddress);
      simulateReadContractMock.mockResolvedValueOnce(zeroAddress);
      simulateReadContractMock.mockResolvedValueOnce(zeroAddress);
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(logSpy).toHaveBeenCalledWith('⚠️ Invalid contract addresses', {
        contractAddresses: {
          feeManagerAddress: zeroAddress,
          feeTokenAddress: zeroAddress,
          rewardManagerAddress: zeroAddress,
          verifierProxyAddress: zeroAddress,
        },
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if exceeds gas cap', async () => {
      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      getVerifierMock.mockResolvedValueOnce(
        '0xE17A7C6A7c2eF0Cb859578aa1605f8Bc2434A365'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'
      );
      simulateReadContractMock.mockResolvedValueOnce([
        {
          assetAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
          amount: 25000000001n,
        },
      ]);
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      getGasCapMock.mockResolvedValueOnce(500n.toString());
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
    });
    it('should abort if invalid report version', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      const result = await verifyReport(
        mockInvalidVersionRawReport as unknown as StreamReport
      );
      expect(logSpy).toHaveBeenCalledWith('⚠️ Invalid report version', {
        report: mockInvalidVersionRawReport,
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if link approval is not successful', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      getVerifierMock.mockResolvedValueOnce(
        '0xE17A7C6A7c2eF0Cb859578aa1605f8Bc2434A365'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'
      );
      simulateReadContractMock.mockResolvedValueOnce([
        {
          assetAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
          amount: 25000000001n,
        },
      ]);
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      getGasCapMock.mockResolvedValueOnce(5000n.toString());
      simulateContractMock.mockResolvedValueOnce({
        request: { address: '0x0000000000000000000000000000000000000000' },
      } as unknown as viemActions.SimulateContractReturnType);
      simulateWriteContractMock.mockResolvedValueOnce(zeroHash);
      simulateWaitForTransactionReceipt.mockResolvedValueOnce({
        status: 'error',
      } as unknown as TransactionReceipt);

      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(logSpy).toHaveBeenCalledWith(
        '🛑 LINK approval transaction was not successful | Aborting',
        { transactionReceipt: { status: 'error' } }
      );
      expect(result).toEqual(undefined);
    });
    it('should abort if verification gas exceeds the limit', async () => {
      const logSpy = jest.spyOn(logger, 'warn');

      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      getVerifierMock.mockResolvedValueOnce(
        '0xE17A7C6A7c2eF0Cb859578aa1605f8Bc2434A365'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'
      );
      simulateReadContractMock.mockResolvedValueOnce([
        {
          assetAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
          amount: 25000000001n,
        },
      ]);
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      getGasCapMock.mockResolvedValueOnce(5000n.toString());
      simulateContractMock.mockResolvedValueOnce({
        request: { address: '0x0000000000000000000000000000000000000000' },
      } as unknown as viemActions.SimulateContractReturnType);
      simulateWriteContractMock.mockResolvedValueOnce(zeroHash);
      simulateWaitForTransactionReceipt.mockResolvedValueOnce(
        mockTransactionReceipt
      );
      estimateContractGasMock.mockResolvedValueOnce(12345n);

      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(logSpy).toHaveBeenCalledWith(
        '🛑 Verification gas is above the limit of 0.000000000000005 | Aborting',
        { gasCap: '5000', verifyReportGas: 12345n }
      );
      expect(result).toEqual(undefined);
    });
    it('should abort if verification transaction is not sufccessful', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      getVerifierMock.mockResolvedValueOnce(
        '0xE17A7C6A7c2eF0Cb859578aa1605f8Bc2434A365'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'
      );
      simulateReadContractMock.mockResolvedValueOnce([
        {
          assetAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
          amount: 25000000001n,
        },
      ]);
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      getGasCapMock.mockResolvedValueOnce(5000n.toString());
      simulateContractMock.mockResolvedValueOnce({
        request: { address: '0x0000000000000000000000000000000000000000' },
      } as unknown as viemActions.SimulateContractReturnType);
      simulateWriteContractMock.mockResolvedValueOnce(zeroHash);
      simulateWaitForTransactionReceipt.mockResolvedValueOnce(
        mockTransactionReceipt
      );
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      simulateContractMock.mockResolvedValueOnce({
        request: { address: '0x0000000000000000000000000000000000000000' },
        result: mockVerifiedReport,
      } as unknown as viemActions.SimulateContractReturnType);
      simulateWriteContractMock.mockResolvedValueOnce(zeroHash);
      simulateWaitForTransactionReceipt.mockResolvedValueOnce({
        status: 'error',
      } as unknown as TransactionReceipt);

      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(logSpy).toHaveBeenCalledWith(
        '🛑 Verification transaction was not successful | Aborting',
        { transactionReceipt: { status: 'error' } }
      );
      expect(result).toEqual(undefined);
    });
    it('should verify report v3', async () => {
      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      getVerifierMock.mockResolvedValueOnce(
        '0xE17A7C6A7c2eF0Cb859578aa1605f8Bc2434A365'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'
      );
      simulateReadContractMock.mockResolvedValueOnce([
        {
          assetAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
          amount: 25000000001n,
        },
      ]);
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      getGasCapMock.mockResolvedValueOnce(5000n.toString());
      simulateContractMock.mockResolvedValueOnce({
        request: { address: '0x0000000000000000000000000000000000000000' },
      } as unknown as viemActions.SimulateContractReturnType);
      simulateWriteContractMock.mockResolvedValueOnce(zeroHash);
      simulateWaitForTransactionReceipt.mockResolvedValueOnce(
        mockTransactionReceipt
      );
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      simulateContractMock.mockResolvedValueOnce({
        request: { address: '0x0000000000000000000000000000000000000000' },
        result: mockVerifiedReport,
      } as unknown as viemActions.SimulateContractReturnType);
      simulateWriteContractMock.mockResolvedValueOnce(zeroHash);
      simulateWaitForTransactionReceipt.mockResolvedValueOnce(
        mockTransactionReceipt
      );

      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(result?.feedId).toEqual(
        '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796'
      );
      expect(result?.price).toEqual(18854937605278083000n);
    });
    it('should verify report v4', async () => {
      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      getVerifierMock.mockResolvedValueOnce(
        '0xE17A7C6A7c2eF0Cb859578aa1605f8Bc2434A365'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
      );
      simulateReadContractMock.mockResolvedValueOnce(
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'
      );
      simulateReadContractMock.mockResolvedValueOnce([
        {
          assetAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
          amount: 25000000001n,
        },
      ]);
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      getGasCapMock.mockResolvedValueOnce(5000n.toString());
      simulateContractMock.mockResolvedValueOnce({
        request: { address: '0x0000000000000000000000000000000000000000' },
      } as unknown as viemActions.SimulateContractReturnType);
      simulateWriteContractMock.mockResolvedValueOnce(zeroHash);
      simulateWaitForTransactionReceipt.mockResolvedValueOnce(
        mockTransactionReceipt
      );
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      simulateContractMock.mockResolvedValueOnce({
        request: { address: '0x0000000000000000000000000000000000000000' },
        result: mockVerifiedReportV4,
      } as unknown as viemActions.SimulateContractReturnType);
      simulateWriteContractMock.mockResolvedValueOnce(zeroHash);
      simulateWaitForTransactionReceipt.mockResolvedValueOnce(
        mockTransactionReceipt
      );

      const result = await verifyReport(
        mockRawReportV4 as unknown as StreamReport
      );
      expect(result?.feedId).toEqual(
        '0x0004b9905d8337c34e00f8dbe31619428bac5c3937e73e6af75c71780f1770ce'
      );
      expect(result?.price).toEqual(1094620000000000000n);
    });
  });

  describe('executeContract', () => {
    it('should abort if private key is missing', async () => {
      const logSpy = jest.spyOn(logger, 'error');
      process.env = { NODE_ENV: 'test' };
      getChainIdMock.mockResolvedValueOnce('31337');
      getCustomChainsMock.mockResolvedValueOnce([hardhat]);
      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: mockFunctionName,
        abi: mockAbi,
      });
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('‼️ Account is missing')
      );
      expect(result).toEqual(undefined);
    });
    it('should abort if ABI is missing', async () => {
      getChainIdMock.mockResolvedValueOnce('31337');
      getCustomChainsMock.mockResolvedValueOnce([hardhat]);
      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: mockFunctionName,
        abi: [],
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if functionName is missing', async () => {
      getChainIdMock.mockResolvedValueOnce('31337');
      getCustomChainsMock.mockResolvedValueOnce([hardhat]);
      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: '',
        abi: mockAbi,
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if functionArguments are missing', async () => {
      getChainIdMock.mockResolvedValueOnce('31337');
      getCustomChainsMock.mockResolvedValueOnce([hardhat]);
      const result = await executeContract({
        report: mockReport,
        functionArgs: [],
        functionName: mockFunctionName,
        abi: mockAbi,
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if contract address is missing', async () => {
      getChainIdMock.mockResolvedValueOnce('31337');
      getCustomChainsMock.mockResolvedValueOnce([hardhat]);
      getContractAddressMock.mockResolvedValueOnce(null);

      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: mockFunctionName,
        abi: mockAbi,
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if chain is missing', async () => {
      getContractAddressMock.mockResolvedValueOnce(
        '0xfa162F0A25b2C2aA32Ddaacda872B6D7b2c38E47'
      );
      getChainIdMock.mockResolvedValueOnce(null);

      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: mockFunctionName,
        abi: mockAbi,
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if chain is invalid', async () => {
      getContractAddressMock.mockResolvedValueOnce(
        '0xfa162F0A25b2C2aA32Ddaacda872B6D7b2c38E47'
      );
      getChainIdMock.mockResolvedValueOnce('31336');
      getAllChainsMock.mockResolvedValueOnce([hardhat]);

      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: mockFunctionName,
        abi: mockAbi,
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if gas exceeds the limit', async () => {
      const logSpy = jest.spyOn(logger, 'warn');
      getContractAddressMock.mockResolvedValueOnce(
        '0xfa162F0A25b2C2aA32Ddaacda872B6D7b2c38E47'
      );
      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      getGasCapMock.mockResolvedValueOnce(500n.toString());

      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: mockFunctionName,
        abi: mockAbi,
      });
      expect(logSpy).toHaveBeenCalledWith(
        '🛑 Gas is above the limit of 0.0000000000000005 | Aborting',
        { gas: 1234n, gasCap: '500' }
      );
      expect(result).toEqual(undefined);
    });
    it('should execute contract', async () => {
      getContractAddressMock.mockResolvedValueOnce(
        '0xfa162F0A25b2C2aA32Ddaacda872B6D7b2c38E47'
      );
      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      getGasCapMock.mockResolvedValueOnce(5000n.toString());
      simulateContractMock.mockResolvedValueOnce({
        request: { address: '0x0000000000000000000000000000000000000000' },
      } as unknown as viemActions.SimulateContractReturnType);
      simulateWriteContractMock.mockResolvedValueOnce(zeroHash);
      simulateWaitForTransactionReceipt.mockResolvedValueOnce(
        mockTransactionReceipt
      );

      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: mockFunctionName,
        abi: mockAbi,
      });
      expect(result?.status).toEqual('success');
    });
  });

  describe('getClients', () => {
    it('should get clients from a default chain', async () => {
      getChainIdMock.mockResolvedValue('43113');
      const result = await getClients();
      expect(result?.publicClient.chain.name).toEqual('Avalanche Fuji');
      expect(result?.walletClient.chain.name).toEqual('Avalanche Fuji');
    });
  });

  describe('getTokenBalance', () => {
    it('should get token balance', async () => {
      getChainIdMock.mockResolvedValue('31337');
      getCustomChainsMock.mockResolvedValue([hardhat]);
      getBalanceMock.mockResolvedValue(12345n);
      const result = await getTokenBalance();
      expect(result?.value).toEqual('0.000000000000012345');
      expect(result?.symbol).toEqual('ETH');
    });
  });
});

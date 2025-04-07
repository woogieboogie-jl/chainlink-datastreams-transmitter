import {
  describe,
  jest,
  afterEach,
  it,
  beforeEach,
  expect,
} from '@jest/globals';
import { executeContract, verifyReport } from '../server/services/client';
import { Hex, TransactionReceipt, zeroAddress, zeroHash } from 'viem';
import * as store from '../server/store';
import * as chains from '../server/config/chains';
import * as verifiers from '../server/config/verifiers';
import * as viemActions from 'viem/actions';
import { hardhat } from 'viem/chains';
import { ReportV3, StreamReport } from '../server/types';

const getContractAddressMock = jest.spyOn(store, 'getContractAddress');
const getChainIdMock = jest.spyOn(store, 'getChainId');
const getGasCapMock = jest.spyOn(store, 'getGasCap');
const getAllChainsMock = jest.spyOn(chains, 'getAllChains');
const getCustomChainsMock = jest.spyOn(chains, 'getCustomChains');
const estimateContractGasMock = jest.spyOn(viemActions, 'estimateContractGas');
const simulateContractMock = jest.spyOn(viemActions, 'simulateContract');
const simulateWriteContractMock = jest.spyOn(viemActions, 'writeContract');
const simulateReadContractMock = jest.spyOn(viemActions, 'readContract');
const simulateWaitForTransactionReceipt = jest.spyOn(
  viemActions,
  'waitForTransactionReceipt'
);
const getVerifierMock = jest.spyOn(verifiers, 'getVerifier');

describe('Unit', () => {
  beforeEach(() => {
    process.env.PRIVATE_KEY = mockPrivateKey;
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
      getChainIdMock.mockResolvedValue('31337');
      getAllChainsMock.mockResolvedValue([hardhat]);
      getVerifierMock.mockResolvedValueOnce(zeroAddress);
      simulateReadContractMock.mockResolvedValueOnce(zeroAddress);
      simulateReadContractMock.mockResolvedValueOnce(zeroAddress);
      simulateReadContractMock.mockResolvedValueOnce(zeroAddress);
      const result = await verifyReport(
        mockRawReport as unknown as StreamReport
      );
      expect(result).toEqual(undefined);
    });
    it('should abort if exceeds gas cap', async () => {
      getChainIdMock.mockResolvedValue('31337');
      getAllChainsMock.mockResolvedValue([hardhat]);
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
    it('should verify report', async () => {
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
  });

  describe('executeContract', () => {
    it('should abort if private key is missing', async () => {
      process.env = { NODE_ENV: 'test' };
      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: mockFunctionName,
        abi: mockAbi,
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if ABI is missing', async () => {
      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: mockFunctionName,
        abi: [],
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if functionName is missing', async () => {
      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: '',
        abi: mockAbi,
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if functionArguments are missing', async () => {
      const result = await executeContract({
        report: mockReport,
        functionArgs: [],
        functionName: mockFunctionName,
        abi: mockAbi,
      });
      expect(result).toEqual(undefined);
    });
    it('should abort if contract address is missing', async () => {
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
    it('should abort if chain exceeds the limit', async () => {
      getContractAddressMock.mockResolvedValueOnce(
        '0xfa162F0A25b2C2aA32Ddaacda872B6D7b2c38E47'
      );
      getChainIdMock.mockResolvedValueOnce('31337');
      getCustomChainsMock.mockResolvedValueOnce([hardhat]);
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      getGasCapMock.mockResolvedValueOnce(500n.toString());

      const result = await executeContract({
        report: mockReport,
        functionArgs: mockFunctionArgs,
        functionName: mockFunctionName,
        abi: mockAbi,
      });
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
});

const mockReport: ReportV3 = {
  feedId:
    '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796' as Hex,
  validFromTimestamp: 1741956359,
  observationsTimestamp: 1741956359,
  nativeFee: 168454106500448n,
  linkFee: 22804404764507409n,
  expiresAt: 1742042759,
  price: 18624904418177297500n,
  bid: 18619563897291935000n,
  ask: 18629557461720030000n,
  rawReport:
    '0x0006aee203ef23a892e75b579f8c3f26fd933d9ca45de95c2f8ac470f4ddcd76000000000000000000000000000000000000000000000000000000001f3e0011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000026001010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000434a5b30cafe7e853832a458ea1591dc2f5fb5e4cf80b9979b8248065a7ea0000000000000000000000000000000000000000000000000000000067d45fd70000000000000000000000000000000000000000000000000000000067d45fd7000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000067d5b15700000000000000000000000000000000000000000000000008c6d7bbf74ce0000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000252e35605f977ca4ea98f57457b5dfae41dd0f6131d3e15fef10baf270b2a1c79c3dfc21411f65ab8da6019eceabc8e0b314843850fb4d156c1d97a41d4efb9cd00000000000000000000000000000000000000000000000000000000000000020282325283e17a7053db4e3c65b27620541175700164bc873bb6d2b7420ba5b6569fbce826b3ddb200a2f2896328da36ecd3924686164640687289f290619fe0',
};
const mockAbi = [
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
      {
        internalType: 'int192',
        name: 'bid',
        type: 'int192',
      },
      {
        internalType: 'int192',
        name: 'ask',
        type: 'int192',
      },
    ],
    name: 'set',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
const mockFunctionName = 'setReport';
const mockFunctionArgs = [
  'feedId',
  'validFromTimestamp',
  'observationsTimestamp',
  'nativeFee',
  'linkFee',
  'expiresAt',
  'price',
  'bid',
  'ask',
];

const mockPrivateKey =
  '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba';

const mockTransactionReceipt: TransactionReceipt = {
  blockHash:
    '0x565f99df4e32e15432f44c19b3d1d15447c41ca185a09aaf8d53356ce4086d8b',
  blockNumber: 36381676n,
  contractAddress: null,
  cumulativeGasUsed: 288318n,
  effectiveGasPrice: 25000000001n,
  from: '0x748cab9a6993a24ca6208160130b3f7b79098c6d',
  gasUsed: 288318n,
  logs: [],
  logsBloom:
    '0x01000000000000000001000000000004000000000000800000000000000000000000000008000000002000000000000000000000000000000000080000200000000000020000020000000008000000000100100000000000000010000000000000000000060000000000004000000802040000000000000000001050000000000002000000000000200000000000000400000000000080000800040000000000020000000000200600000000000000000080000000000000008100000000008100000002000000000001000000000000000000000000000800000000000024000010000000000000000000000000000004000200000000000000000000000000',
  status: 'success',
  to: '0xf694e193200268f9a4868e4aa017a0118c9a8177',
  transactionHash: zeroHash,
  transactionIndex: 0,
  type: 'eip1559',
};

const mockRawReport = {
  feedId: '0x000434a5b30cafe7e853832a458ea1591dc2f5fb5e4cf80b9979b8248065a7ea',
  observationsTimestamp: 1741971415n,
  validFromTimestamp: 1741971415n,
  rawReport:
    '0x0006aee203ef23a892e75b579f8c3f26fd933d9ca45de95c2f8ac470f4ddcd76000000000000000000000000000000000000000000000000000000001f3e0011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000026001010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000434a5b30cafe7e853832a458ea1591dc2f5fb5e4cf80b9979b8248065a7ea0000000000000000000000000000000000000000000000000000000067d45fd70000000000000000000000000000000000000000000000000000000067d45fd7000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000067d5b15700000000000000000000000000000000000000000000000008c6d7bbf74ce0000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000252e35605f977ca4ea98f57457b5dfae41dd0f6131d3e15fef10baf270b2a1c79c3dfc21411f65ab8da6019eceabc8e0b314843850fb4d156c1d97a41d4efb9cd00000000000000000000000000000000000000000000000000000000000000020282325283e17a7053db4e3c65b27620541175700164bc873bb6d2b7420ba5b6569fbce826b3ddb200a2f2896328da36ecd3924686164640687289f290619fe0',
  nativeFee: 0n,
  linkFee: 0n,
  expiresAt: 1742057815n,
  price: 632430000000000000n,
  version: 'v3',
  marketStatus: 2n,
};

const mockInvalidRawReport = {
  feedId: '0x000434a5b30cafe7e853832a458ea1591dc2f5fb5e4cf80b9979b8248065a7ea',
  observationsTimestamp: 1741971415n,
  validFromTimestamp: 1741971415n,
  rawReport: zeroHash,
  nativeFee: 0n,
  linkFee: 0n,
  expiresAt: 1742057815n,
  price: 632430000000000000n,
  version: 'v3',
  marketStatus: 2n,
};

const mockVerifiedReport =
  '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c7960000000000000000000000000000000000000000000000000000000067d469860000000000000000000000000000000000000000000000000000000067d46986000000000000000000000000000000000000000000000000000096b8ad3e29ec000000000000000000000000000000000000000000000000004eaa7d28c0f8800000000000000000000000000000000000000000000000000000000067d5bb0600000000000000000000000000000000000000000000000105aa31dab0c127b80000000000000000000000000000000000000000000000010591eed93a6c128c00000000000000000000000000000000000000000000000105c13f644322f1d8';

import {
  describe,
  jest,
  afterEach,
  it,
  beforeEach,
  expect,
} from '@jest/globals';
import { executeContract } from '../server/services/client';
import { Hex, TransactionReceipt, zeroHash } from 'viem';
import * as store from '../server/store';
import * as chains from '../server/config/chains';
import * as viemActions from 'viem/actions';
import { hardhat } from 'viem/chains';

const getContractAddressMock = jest.spyOn(store, 'getContractAddress');
const getChainIdMock = jest.spyOn(store, 'getChainId');
const getGasCapMock = jest.spyOn(store, 'getGasCap');
const getAllChainsMock = jest.spyOn(chains, 'getAllChains');
const estimateContractGasMock = jest.spyOn(viemActions, 'estimateContractGas');
const simulateContractMock = jest.spyOn(viemActions, 'simulateContract');
const simulateWriteContract = jest.spyOn(viemActions, 'writeContract');
const simulateWaitForTransactionReceipt = jest.spyOn(
  viemActions,
  'waitForTransactionReceipt'
);

describe('Unit', () => {
  beforeEach(() => {
    process.env.PRIVATE_KEY = mockPrivateKey;
  });
  afterEach(() => {
    jest.clearAllMocks();
    process.env = { NODE_ENV: 'test' };
  });

  describe('executeContract', () => {
    it('should execute contract', async () => {
      getContractAddressMock.mockResolvedValueOnce(
        '0xfa162F0A25b2C2aA32Ddaacda872B6D7b2c38E47'
      );
      getChainIdMock.mockResolvedValueOnce('31337');
      getAllChainsMock.mockResolvedValueOnce([hardhat]);
      estimateContractGasMock.mockResolvedValueOnce(1234n);
      getGasCapMock.mockResolvedValueOnce(5000n.toString());
      simulateContractMock.mockResolvedValueOnce({
        request: { address: '0x0000000000000000000000000000000000000000' },
      } as unknown as viemActions.SimulateContractReturnType);
      simulateWriteContract.mockResolvedValueOnce(zeroHash);
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

const mockReport = {
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

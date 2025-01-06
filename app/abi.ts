export const abi = [
  {
    inputs: [],
    name: 'get',
    outputs: [
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'feedId',
            type: 'bytes32',
          },
          {
            internalType: 'uint192',
            name: 'validFromTimestamp',
            type: 'uint192',
          },
          {
            internalType: 'uint192',
            name: 'observationsTimestamp',
            type: 'uint192',
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
            internalType: 'uint192',
            name: 'expiresAt',
            type: 'uint192',
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
        internalType: 'struct SimpleStorage.ReportV3',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'feedId',
            type: 'bytes32',
          },
          {
            internalType: 'uint192',
            name: 'validFromTimestamp',
            type: 'uint192',
          },
          {
            internalType: 'uint192',
            name: 'observationsTimestamp',
            type: 'uint192',
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
            internalType: 'uint192',
            name: 'expiresAt',
            type: 'uint192',
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
        internalType: 'struct SimpleStorage.ReportV3',
        name: 'x',
        type: 'tuple',
      },
    ],
    name: 'set',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

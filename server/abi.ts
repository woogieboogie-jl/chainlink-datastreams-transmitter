export const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_verifierProxy',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'uint16',
        name: 'version',
        type: 'uint16',
      },
    ],
    name: 'InvalidReportVersion',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'caller',
        type: 'address',
      },
    ],
    name: 'NotOwner',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NothingToWithdraw',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'int192',
        name: 'price',
        type: 'int192',
      },
    ],
    name: 'DecodedPrice',
    type: 'event',
  },
  {
    inputs: [],
    name: 'lastDecodedPrice',
    outputs: [
      {
        internalType: 'int192',
        name: '',
        type: 'int192',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 's_verifierProxy',
    outputs: [
      {
        internalType: 'contract IVerifierProxy',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'unverifiedReport',
        type: 'bytes',
      },
    ],
    name: 'verifyReport',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_beneficiary',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_token',
        type: 'address',
      },
    ],
    name: 'withdrawToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

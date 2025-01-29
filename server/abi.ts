export const verifierProxyAbi = [
  {
    inputs: [
      {
        internalType: 'contract AccessControllerInterface',
        name: 'accessController',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'AccessForbidden',
    type: 'error',
  },
  {
    inputs: [],
    name: 'BadVerification',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'configDigest',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'verifier',
        type: 'address',
      },
    ],
    name: 'ConfigDigestAlreadySet',
    type: 'error',
  },
  {
    inputs: [],
    name: 'FeeManagerInvalid',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'verifier',
        type: 'address',
      },
    ],
    name: 'VerifierAlreadyInitialized',
    type: 'error',
  },
  {
    inputs: [],
    name: 'VerifierInvalid',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'configDigest',
        type: 'bytes32',
      },
    ],
    name: 'VerifierNotFound',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroAddress',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldAccessController',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newAccessController',
        type: 'address',
      },
    ],
    name: 'AccessControllerSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'oldFeeManager',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newFeeManager',
        type: 'address',
      },
    ],
    name: 'FeeManagerSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'verifierAddress',
        type: 'address',
      },
    ],
    name: 'VerifierInitialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'oldConfigDigest',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'newConfigDigest',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'verifierAddress',
        type: 'address',
      },
    ],
    name: 'VerifierSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'configDigest',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'verifierAddress',
        type: 'address',
      },
    ],
    name: 'VerifierUnset',
    type: 'event',
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'configDigest',
        type: 'bytes32',
      },
    ],
    name: 'getVerifier',
    outputs: [
      {
        internalType: 'address',
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
        internalType: 'address',
        name: 'verifierAddress',
        type: 'address',
      },
    ],
    name: 'initializeVerifier',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 's_accessController',
    outputs: [
      {
        internalType: 'contract AccessControllerInterface',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 's_feeManager',
    outputs: [
      {
        internalType: 'contract IVerifierFeeManager',
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
        internalType: 'contract AccessControllerInterface',
        name: 'accessController',
        type: 'address',
      },
    ],
    name: 'setAccessController',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IVerifierFeeManager',
        name: 'feeManager',
        type: 'address',
      },
    ],
    name: 'setFeeManager',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'currentConfigDigest',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'newConfigDigest',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'addr',
            type: 'address',
          },
          {
            internalType: 'uint64',
            name: 'weight',
            type: 'uint64',
          },
        ],
        internalType: 'struct Common.AddressAndWeight[]',
        name: 'addressesAndWeights',
        type: 'tuple[]',
      },
    ],
    name: 'setVerifier',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'typeAndVersion',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'configDigest',
        type: 'bytes32',
      },
    ],
    name: 'unsetVerifier',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'payload',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'parameterPayload',
        type: 'bytes',
      },
    ],
    name: 'verify',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes[]',
        name: 'payloads',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes',
        name: 'parameterPayload',
        type: 'bytes',
      },
    ],
    name: 'verifyBulk',
    outputs: [
      {
        internalType: 'bytes[]',
        name: 'verifiedReports',
        type: 'bytes[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

export const feeManagerAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_linkAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_nativeAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_proxyAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_rewardManagerAddress',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'ExpiredReport',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidDeposit',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidDiscount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidQuote',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidReceivingAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidSurcharge',
    type: 'error',
  },
  {
    inputs: [],
    name: 'Unauthorized',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroDeficit',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'configDigest',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'subscriber',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'assetAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct Common.Asset',
        name: 'fee',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'assetAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct Common.Asset',
        name: 'reward',
        type: 'tuple',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'appliedDiscount',
        type: 'uint256',
      },
    ],
    name: 'DiscountApplied',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'poolId',
            type: 'bytes32',
          },
          {
            internalType: 'uint192',
            name: 'amount',
            type: 'uint192',
          },
        ],
        indexed: false,
        internalType: 'struct IRewardManager.FeePayment[]',
        name: 'rewards',
        type: 'tuple[]',
      },
    ],
    name: 'InsufficientLink',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'configDigest',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'linkQuantity',
        type: 'uint256',
      },
    ],
    name: 'LinkDeficitCleared',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'newSurcharge',
        type: 'uint64',
      },
    ],
    name: 'NativeSurchargeUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'subscriber',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'feedId',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint64',
        name: 'discount',
        type: 'uint64',
      },
    ],
    name: 'SubscriberDiscountUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'adminAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'assetAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint192',
        name: 'quantity',
        type: 'uint192',
      },
    ],
    name: 'Withdraw',
    type: 'event',
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'subscriber',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'report',
        type: 'bytes',
      },
      {
        internalType: 'address',
        name: 'quoteAddress',
        type: 'address',
      },
    ],
    name: 'getFeeAndReward',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'assetAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        internalType: 'struct Common.Asset',
        name: '',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'assetAddress',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        internalType: 'struct Common.Asset',
        name: '',
        type: 'tuple',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'i_linkAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'i_nativeAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'i_proxyAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'i_rewardManager',
    outputs: [
      {
        internalType: 'contract IRewardManager',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'linkAvailableForPayment',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
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
        internalType: 'bytes32',
        name: 'configDigest',
        type: 'bytes32',
      },
    ],
    name: 'payLinkDeficit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'payload',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'parameterPayload',
        type: 'bytes',
      },
      {
        internalType: 'address',
        name: 'subscriber',
        type: 'address',
      },
    ],
    name: 'processFee',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes[]',
        name: 'payloads',
        type: 'bytes[]',
      },
      {
        internalType: 'bytes',
        name: 'parameterPayload',
        type: 'bytes',
      },
      {
        internalType: 'address',
        name: 'subscriber',
        type: 'address',
      },
    ],
    name: 'processFeeBulk',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 's_linkDeficit',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 's_nativeSurcharge',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 's_subscriberDiscounts',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'configDigest',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'addr',
            type: 'address',
          },
          {
            internalType: 'uint64',
            name: 'weight',
            type: 'uint64',
          },
        ],
        internalType: 'struct Common.AddressAndWeight[]',
        name: 'rewardRecipientAndWeights',
        type: 'tuple[]',
      },
    ],
    name: 'setFeeRecipients',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint64',
        name: 'surcharge',
        type: 'uint64',
      },
    ],
    name: 'setNativeSurcharge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'typeAndVersion',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'subscriber',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'feedId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint64',
        name: 'discount',
        type: 'uint64',
      },
    ],
    name: 'updateSubscriberDiscount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'assetAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint192',
        name: 'quantity',
        type: 'uint192',
      },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

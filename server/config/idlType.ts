export type Verifier = {
  address: 'Gt9S41PtjR58CbG9JhJ3J6vxesqrNAswbWYbLNTMZA3c';
  metadata: {
    name: 'verifier';
    version: '0.4.0';
    spec: '0.1.0';
  };
  instructions: [
    {
      name: 'verify';
      docs: [
        'Verifies a Chainlink Data Streams report is signed by the Decentralized Oracle Network (DON).'
      ];
      discriminator: [133, 161, 141, 48, 120, 198, 88, 150];
      accounts: [
        {
          name: 'verifierAccount';
        },
        {
          name: 'accessController';
        },
        {
          name: 'user';
          signer: true;
        },
        {
          name: 'configAccount';
        }
      ];
      args: [
        {
          name: 'signedReport';
          type: 'bytes';
        }
      ];
    },
    {
      name: 'setConfigWithActivationTime';
      discriminator: [189, 64, 69, 231, 128, 29, 197, 29];
      accounts: [
        {
          name: 'verifierAccount';
          writable: true;
        },
        {
          name: 'owner';
          signer: true;
        }
      ];
      args: [
        {
          name: 'signers';
          type: {
            vec: {
              array: ['u8', 20];
            };
          };
        },
        {
          name: 'f';
          type: 'u8';
        },
        {
          name: 'activationTime';
          type: 'u32';
        }
      ];
    },
    {
      name: 'setConfig';
      discriminator: [108, 158, 154, 175, 212, 98, 52, 66];
      accounts: [
        {
          name: 'verifierAccount';
          writable: true;
        },
        {
          name: 'owner';
          signer: true;
        }
      ];
      args: [
        {
          name: 'signers';
          type: {
            vec: {
              array: ['u8', 20];
            };
          };
        },
        {
          name: 'f';
          type: 'u8';
        }
      ];
    },
    {
      name: 'setConfigActive';
      discriminator: [90, 95, 224, 173, 96, 184, 36, 136];
      accounts: [
        {
          name: 'verifierAccount';
          writable: true;
        },
        {
          name: 'owner';
          signer: true;
        }
      ];
      args: [
        {
          name: 'donConfigIndex';
          type: 'u64';
        },
        {
          name: 'isActive';
          type: 'u8';
        }
      ];
    },
    {
      name: 'removeLatestConfig';
      discriminator: [171, 221, 188, 175, 156, 87, 156, 63];
      accounts: [
        {
          name: 'verifierAccount';
          writable: true;
        },
        {
          name: 'owner';
          signer: true;
        }
      ];
      args: [];
    },
    {
      name: 'setAccessController';
      discriminator: [86, 87, 56, 58, 148, 233, 95, 125];
      accounts: [
        {
          name: 'verifierAccount';
          writable: true;
        },
        {
          name: 'owner';
          signer: true;
        },
        {
          name: 'accessController';
          optional: true;
        }
      ];
      args: [];
    },
    {
      name: 'initialize';
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: 'verifierAccount';
          writable: true;
        },
        {
          name: 'owner';
          writable: true;
          signer: true;
        },
        {
          name: 'program';
        },
        {
          name: 'programData';
        },
        {
          name: 'systemProgram';
        }
      ];
      args: [];
    },
    {
      name: 'initializeAccountData';
      discriminator: [15, 88, 71, 247, 173, 45, 110, 216];
      accounts: [
        {
          name: 'verifierAccount';
          writable: true;
        },
        {
          name: 'owner';
          signer: true;
        },
        {
          name: 'accessController';
          optional: true;
        },
        {
          name: 'program';
        },
        {
          name: 'programData';
        },
        {
          name: 'systemProgram';
        }
      ];
      args: [];
    },
    {
      name: 'reallocAccount';
      discriminator: [51, 237, 126, 233, 52, 244, 186, 244];
      accounts: [
        {
          name: 'verifierAccount';
          writable: true;
        },
        {
          name: 'owner';
          writable: true;
          signer: true;
        },
        {
          name: 'program';
        },
        {
          name: 'programData';
        },
        {
          name: 'systemProgram';
        }
      ];
      args: [
        {
          name: 'len';
          type: 'u32';
        }
      ];
    },
    {
      name: 'transferOwnership';
      discriminator: [65, 177, 215, 73, 53, 45, 99, 47];
      accounts: [
        {
          name: 'verifierAccount';
          writable: true;
        },
        {
          name: 'owner';
          signer: true;
        }
      ];
      args: [
        {
          name: 'proposedOwner';
          type: 'pubkey';
        }
      ];
    },
    {
      name: 'acceptOwnership';
      discriminator: [172, 23, 43, 13, 238, 213, 85, 150];
      accounts: [
        {
          name: 'verifierAccount';
          writable: true;
        },
        {
          name: 'owner';
          signer: true;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: 'verifierAccount';
      discriminator: [81, 120, 248, 87, 107, 174, 58, 157];
    }
  ];
  events: [
    {
      name: 'configActivated';
      discriminator: [235, 116, 42, 193, 113, 251, 137, 137];
    },
    {
      name: 'configRemoved';
      discriminator: [153, 151, 57, 84, 33, 148, 67, 62];
    },
    {
      name: 'reportVerified';
      discriminator: [37, 251, 156, 40, 166, 248, 79, 215];
    },
    {
      name: 'configSet';
      discriminator: [15, 104, 59, 16, 236, 241, 8, 6];
    },
    {
      name: 'accessControllerSet';
      discriminator: [68, 67, 28, 142, 3, 28, 36, 83];
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'zeroAddress';
      msg: 'Zero Address';
    },
    {
      code: 6001;
      name: 'faultToleranceMustBePositive';
      msg: 'Fault tolerance must be a positive non-zero value';
    },
    {
      code: 6002;
      name: 'excessSigners';
      msg: 'Too many signers provided';
    },
    {
      code: 6003;
      name: 'insufficientSigners';
      msg: 'Insufficient number of signers provided';
    },
    {
      code: 6004;
      name: 'nonUniqueSignatures';
      msg: 'Non-unique signatures provided';
    },
    {
      code: 6005;
      name: 'badActivationTime';
      msg: 'Activation time cannot be in the future';
    },
    {
      code: 6006;
      name: 'donConfigAlreadyExists';
      msg: 'DonConfig already exists';
    },
    {
      code: 6007;
      name: 'badVerification';
      msg: 'Bad verification';
    },
    {
      code: 6008;
      name: 'mismatchedSignatures';
      msg: 'Mismatched signatures';
    },
    {
      code: 6009;
      name: 'noSigners';
      msg: 'No Signers';
    },
    {
      code: 6010;
      name: 'donConfigDoesNotExist';
      msg: 'DonConfig does not exist';
    },
    {
      code: 6011;
      name: 'invalidPda';
      msg: 'Invalid PDA';
    },
    {
      code: 6012;
      name: 'unauthorized';
      msg: 'unauthorized';
    },
    {
      code: 6013;
      name: 'invalidAccessController';
      msg: 'Invalid Access Controller';
    },
    {
      code: 6014;
      name: 'invalidConfigAccount';
      msg: 'Invalid Config Account';
    },
    {
      code: 6015;
      name: 'maxNumberOfConfigsReached';
      msg: 'Max number of configs reached';
    },
    {
      code: 6016;
      name: 'configDeactivated';
      msg: 'Config is deactivated';
    },
    {
      code: 6017;
      name: 'invalidInputs';
      msg: 'Invalid inputs';
    }
  ];
  types: [
    {
      name: 'verifierAccountConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            type: 'pubkey';
          },
          {
            name: 'proposedOwner';
            type: 'pubkey';
          },
          {
            name: 'accessController';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'signingKey';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'key';
            type: {
              array: ['u8', 20];
            };
          }
        ];
      };
    },
    {
      name: 'signingKeys';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'xs';
            type: {
              array: [
                {
                  defined: {
                    name: 'signingKey';
                  };
                },
                31
              ];
            };
          },
          {
            name: 'len';
            type: 'u8';
          }
        ];
      };
    },
    {
      name: 'donConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'activationTime';
            type: 'u32';
          },
          {
            name: 'donConfigId';
            type: {
              array: ['u8', 24];
            };
          },
          {
            name: 'f';
            type: 'u8';
          },
          {
            name: 'isActive';
            type: 'u8';
          },
          {
            name: 'padding';
            type: 'u8';
          },
          {
            name: 'signers';
            type: {
              defined: {
                name: 'signingKeys';
              };
            };
          }
        ];
      };
    },
    {
      name: 'donConfigs';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'len';
            type: 'u16';
          },
          {
            name: 'padding';
            type: {
              array: ['u8', 6];
            };
          },
          {
            name: 'xs';
            type: {
              array: [
                {
                  defined: {
                    name: 'donConfig';
                  };
                },
                256
              ];
            };
          }
        ];
      };
    },
    {
      name: 'verifierAccount';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'version';
            type: 'u8';
          },
          {
            name: 'padding';
            type: {
              array: ['u8', 7];
            };
          },
          {
            name: 'verifierAccountConfig';
            type: {
              defined: {
                name: 'verifierAccountConfig';
              };
            };
          },
          {
            name: 'donConfigs';
            type: {
              defined: {
                name: 'donConfigs';
              };
            };
          }
        ];
      };
    },
    {
      name: 'configActivated';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'donConfigId';
            type: 'string';
          },
          {
            name: 'isActive';
            type: 'bool';
          }
        ];
      };
    },
    {
      name: 'configRemoved';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'donConfigId';
            type: 'string';
          }
        ];
      };
    },
    {
      name: 'reportVerified';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'feedId';
            type: {
              array: ['u8', 32];
            };
          },
          {
            name: 'requester';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'configSet';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'donConfigId';
            type: 'string';
          },
          {
            name: 'signers';
            type: {
              vec: {
                array: ['u8', 20];
              };
            };
          },
          {
            name: 'f';
            type: 'u8';
          },
          {
            name: 'donConfigIndex';
            type: 'u16';
          }
        ];
      };
    },
    {
      name: 'accessControllerSet';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'accessController';
            type: 'pubkey';
          }
        ];
      };
    }
  ];
};

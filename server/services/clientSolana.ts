import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import * as snappy from 'snappy';
import { logger } from './logger';
import { getCluster, setCluster } from '../store';
import { getAllSolanaChains } from '../config/chains';
import { ReportV2, ReportV3, ReportV4, ReportV5, ReportV6, ReportV7, ReportV8, ReportV9, ReportV10, StreamReport } from '../types';
import idl from '../config/idl.json';
import { Verifier } from '../config/idlType';
import { decodeAbiParameters, Hex } from 'viem';
import { getSolanaVerifier } from '../config/verifiers';
import { base64ToHex, kebabToCamel, printError } from '../utils';
import { BN } from 'bn.js';

// ABI definitions for different report versions
const reportBlobAbiV2 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
];

const reportBlobAbiV3 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
  { type: 'int192', name: 'bid' },
  { type: 'int192', name: 'ask' },
];

const reportBlobAbiV4 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
  { type: 'uint8', name: 'marketStatus' },
];

const reportBlobAbiV5 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'rate' },
  { type: 'uint32', name: 'timestamp' },
  { type: 'uint32', name: 'duration' },
];

const reportBlobAbiV6 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
  { type: 'int192', name: 'price2' },
  { type: 'int192', name: 'price3' },
  { type: 'int192', name: 'price4' },
  { type: 'int192', name: 'price5' },
];

const reportBlobAbiV7 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'exchangeRate' },
];

const reportBlobAbiV8 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'uint64', name: 'lastUpdateTimestamp' },
  { type: 'int192', name: 'price' },
  { type: 'uint32', name: 'marketStatus' },
];

const reportBlobAbiV9 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'benchmark' },
  { type: 'uint64', name: 'navDate' },
  { type: 'int192', name: 'aum' },
  { type: 'uint32', name: 'ripcord' },
];

const reportBlobAbiV10 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'uint64', name: 'lastUpdateTimestamp' },
  { type: 'int192', name: 'price' },
  { type: 'uint32', name: 'marketStatus' },
  { type: 'int192', name: 'currentMultiplier' },
  { type: 'int192', name: 'newMultiplier' },
  { type: 'uint32', name: 'activationDateTime' },
  { type: 'int192', name: 'tokenizedPrice' },
];

// Helper function to decode report by version for Solana
function decodeReportByVersion(reportData: Hex, reportVersion: number) {
  let abi;
  switch (reportVersion) {
    case 2:
      abi = reportBlobAbiV2;
      break;
    case 3:
      abi = reportBlobAbiV3;
      break;
    case 4:
      abi = reportBlobAbiV4;
      break;
    case 5:
      abi = reportBlobAbiV5;
      break;
    case 6:
      abi = reportBlobAbiV6;
      break;
    case 7:
      abi = reportBlobAbiV7;
      break;
    case 8:
      abi = reportBlobAbiV8;
      break;
    case 9:
      abi = reportBlobAbiV9;
      break;
    case 10:
      abi = reportBlobAbiV10;
      break;
    default:
      throw new Error(`Unsupported report version: ${reportVersion}`);
  }
  
  return decodeAbiParameters(abi, reportData);
}

const getKeyPair = () => {
  try {
    return (
      process.env.SECRET_KEY_SVM &&
      Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY_SVM))
    );
  } catch (error) {
    logger.error(printError(error), error);
    console.error(error);
    return;
  }
};

const getPublicKey = () => {
  const keypair = getKeyPair();
  if (keypair) return keypair.publicKey;
};

export const accountAddress = getPublicKey()?.toBase58();

async function getConnection() {
  const cluster = await getCluster();
  if (!cluster) {
    logger.warn('⚠️ No cluster provided');
    return;
  }
  const chains = await getAllSolanaChains();
  const chain = chains.find((chain) => chain.cluster === cluster);
  if (!chain || !chain.rpcUrl) {
    logger.warn('⚠️ Invalid chain', { cluster });
    setCluster('');
    return;
  }
  return new Connection(chain.rpcUrl);
}

export async function getBalance() {
  try {
    const connection = await getConnection();
    if (!connection) {
      logger.warn('⚠️ Invalid connection');
      return;
    }
    const publicKey = getPublicKey();
    if (!publicKey) {
      logger.warn('⚠️ Invalid public key');
      return;
    }
    const balance = await connection.getBalance(publicKey);
    return {
      value: `${balance / LAMPORTS_PER_SOL}`,
      symbol: 'SOL',
    };
  } catch (error) {
    logger.error(printError(error), error);
    console.error(error);
    return {
      value: '0',
      symbol: '',
    };
  }
}

export async function getCurrentChain() {
  const cluster = await getCluster();
  if (!cluster) {
    logger.warn('⚠️ No cluster provided');
    return;
  }
  const chains = await getAllSolanaChains();
  const chain = chains.find((chain) => chain.cluster === cluster);
  if (!chain || !chain.rpcUrl) {
    logger.warn('⚠️ Invalid chain', { cluster });
    setCluster('');
    return;
  }
  return { chainId: chain.cluster, name: chain.name };
}

export async function getVerifierProgram() {
  const cluster = await getCluster();
  if (!cluster) {
    logger.warn('⚠️ No cluster provided');
    return;
  }
  const verifier = await getSolanaVerifier(cluster);
  if (
    !verifier ||
    !verifier.verifierProgramID ||
    !verifier.accessControllerAccount
  ) {
    logger.warn('⚠️ Invalid verifier', { cluster });
    return;
  }
  const { verifierProgramID, accessControllerAccount } = verifier;
  return {
    verifierProgramID,
    accessControllerAccount,
  };
}

export async function verifyReport(report: StreamReport) {
  try {
    const keypair = getKeyPair();
    if (!keypair) {
      logger.error('‼️ Account is missing');
      return;
    }
    const wallet = new Wallet(keypair);
    const connection = await getConnection();

    if (!connection) {
      logger.warn('⚠️ Invalid connection');
      return;
    }

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    anchor.setProvider(provider);
    const program = new Program(idl as Verifier, provider);

    const [, reportData] = decodeAbiParameters(
      [
        { type: 'bytes32[3]', name: '' },
        { type: 'bytes', name: 'reportData' },
      ],
      report.rawReport
    );

    const reportVersion = parseInt(reportData.slice(0, 6), 16);
    if (reportVersion < 2 || reportVersion > 10) {
      logger.warn('⚠️ Invalid report version', { report, reportVersion });
      return;
    }

    const cleanHexString = report.rawReport.startsWith('0x')
      ? report.rawReport.slice(2)
      : report.rawReport;

    if (!/^[0-9a-fA-F]+$/.test(cleanHexString)) {
      logger.warn('⚠️ Invalid hex string format', { report });
      return;
    }

    const signedReport = new Uint8Array(
      cleanHexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const compressedReport = await snappy.compress(Buffer.from(signedReport));

    const verifier = await getVerifierProgram();

    if (
      !verifier ||
      !verifier.verifierProgramID ||
      !verifier.accessControllerAccount
    ) {
      logger.warn('⚠️ Invalid verifier program', { verifier });
      return;
    }
    const { verifierProgramID, accessControllerAccount } = verifier;

    const verifierAccount = PublicKey.findProgramAddressSync(
      [Buffer.from('verifier')],
      new PublicKey(verifierProgramID)
    );
    const configAccount = PublicKey.findProgramAddressSync(
      [signedReport.slice(0, 32)],
      new PublicKey(verifierProgramID)
    );
    if (!program.methods.verify) {
      logger.error('‼️ Program verify method is undefined', program);
      return;
    }
    const tx = await program.methods
      .verify(compressedReport)
      .accounts({
        verifierAccount: verifierAccount[0],
        accessController: new PublicKey(accessControllerAccount),
        configAccount: configAccount[0],
      })
      .rpc({ commitment: 'confirmed' });

    const txDetails = await provider.connection.getTransaction(tx, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (
      !txDetails?.meta?.logMessages ||
      txDetails?.meta?.logMessages.length === 0
    ) {
      logger.warn('⚠️ No log messages found in transaction details', {
        txDetails,
      });
      return;
    }

    for (const log of txDetails.meta.logMessages) {
      if (log.includes('Program return') || log.includes('Program consumed')) {
        const verifiedReportData = log.split(' ')[3];
        if (verifiedReportData) {
          try {
            const decodedData = decodeReportByVersion(`0x${base64ToHex(verifiedReportData)}`, reportVersion);
            
            // Create version-specific report based on decoded data
            switch (reportVersion) {
              case 2:
                const reportV2: ReportV2 = {
                  reportVersion,
                  verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
                  feedId: decodedData[0] as Hex,
                  validFromTimestamp: decodedData[1] as number,
                  observationsTimestamp: decodedData[2] as number,
                  nativeFee: decodedData[3] as bigint,
                  linkFee: decodedData[4] as bigint,
                  expiresAt: decodedData[5] as number,
                  price: decodedData[6] as bigint,
                  rawReport: report.rawReport,
                  parameterPayload: undefined, // Solana doesn't use parameter payload
                };
                return reportV2;
              
              case 3:
                const reportV3: ReportV3 = {
                  reportVersion,
                  verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
                  feedId: decodedData[0] as Hex,
                  validFromTimestamp: decodedData[1] as number,
                  observationsTimestamp: decodedData[2] as number,
                  nativeFee: decodedData[3] as bigint,
                  linkFee: decodedData[4] as bigint,
                  expiresAt: decodedData[5] as number,
                  price: decodedData[6] as bigint,
                  bid: decodedData[7] as bigint,
                  ask: decodedData[8] as bigint,
                  rawReport: report.rawReport,
                  parameterPayload: undefined, // Solana doesn't use parameter payload
                };
                return reportV3;
              
              case 4:
                const reportV4: ReportV4 = {
                  reportVersion,
                  verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
                  feedId: decodedData[0] as Hex,
                  validFromTimestamp: decodedData[1] as number,
                  observationsTimestamp: decodedData[2] as number,
                  nativeFee: decodedData[3] as bigint,
                  linkFee: decodedData[4] as bigint,
                  expiresAt: decodedData[5] as number,
                  price: decodedData[6] as bigint,
                  marketStatus: decodedData[7] as number,
                  rawReport: report.rawReport,
                  parameterPayload: undefined, // Solana doesn't use parameter payload
                };
                return reportV4;
              
              case 5:
                const reportV5: ReportV5 = {
                  reportVersion,
                  verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
                  feedId: decodedData[0] as Hex,
                  validFromTimestamp: decodedData[1] as number,
                  observationsTimestamp: decodedData[2] as number,
                  nativeFee: decodedData[3] as bigint,
                  linkFee: decodedData[4] as bigint,
                  expiresAt: decodedData[5] as number,
                  rate: decodedData[6] as bigint,
                  timestamp: decodedData[7] as number,
                  duration: decodedData[8] as number,
                  rawReport: report.rawReport,
                  parameterPayload: undefined, // Solana doesn't use parameter payload
                };
                return reportV5;
              
              case 6:
                const reportV6: ReportV6 = {
                  reportVersion,
                  verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
                  feedId: decodedData[0] as Hex,
                  validFromTimestamp: decodedData[1] as number,
                  observationsTimestamp: decodedData[2] as number,
                  nativeFee: decodedData[3] as bigint,
                  linkFee: decodedData[4] as bigint,
                  expiresAt: decodedData[5] as number,
                  price: decodedData[6] as bigint,
                  price2: decodedData[7] as bigint,
                  price3: decodedData[8] as bigint,
                  price4: decodedData[9] as bigint,
                  price5: decodedData[10] as bigint,
                  rawReport: report.rawReport,
                  parameterPayload: undefined, // Solana doesn't use parameter payload
                };
                return reportV6;
              
              case 7:
                const reportV7: ReportV7 = {
                  reportVersion,
                  verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
                  feedId: decodedData[0] as Hex,
                  validFromTimestamp: decodedData[1] as number,
                  observationsTimestamp: decodedData[2] as number,
                  nativeFee: decodedData[3] as bigint,
                  linkFee: decodedData[4] as bigint,
                  expiresAt: decodedData[5] as number,
                  exchangeRate: decodedData[6] as bigint,
                  rawReport: report.rawReport,
                  parameterPayload: undefined, // Solana doesn't use parameter payload
                };
                return reportV7;
              
              case 8:
                const reportV8: ReportV8 = {
                  reportVersion,
                  verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
                  feedId: decodedData[0] as Hex,
                  validFromTimestamp: decodedData[1] as number,
                  observationsTimestamp: decodedData[2] as number,
                  nativeFee: decodedData[3] as bigint,
                  linkFee: decodedData[4] as bigint,
                  expiresAt: decodedData[5] as number,
                  lastUpdateTimestamp: decodedData[6] as bigint,
                  price: decodedData[7] as bigint,
                  marketStatus: decodedData[8] as number,
                  rawReport: report.rawReport,
                  parameterPayload: undefined, // Solana doesn't use parameter payload
                };
                return reportV8;
              
              case 9:
                const reportV9: ReportV9 = {
                  reportVersion,
                  verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
                  feedId: decodedData[0] as Hex,
                  validFromTimestamp: decodedData[1] as number,
                  observationsTimestamp: decodedData[2] as number,
                  nativeFee: decodedData[3] as bigint,
                  linkFee: decodedData[4] as bigint,
                  expiresAt: decodedData[5] as number,
                  benchmark: decodedData[6] as bigint,
                  navDate: decodedData[7] as bigint,
                  aum: decodedData[8] as bigint,
                  ripcord: decodedData[9] as number,
                  rawReport: report.rawReport,
                  parameterPayload: undefined, // Solana doesn't use parameter payload
                };
                return reportV9;
              
              case 10:
                const reportV10: ReportV10 = {
                  reportVersion,
                  verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
                  feedId: decodedData[0] as Hex,
                  validFromTimestamp: decodedData[1] as number,
                  observationsTimestamp: decodedData[2] as number,
                  nativeFee: decodedData[3] as bigint,
                  linkFee: decodedData[4] as bigint,
                  expiresAt: decodedData[5] as number,
                  lastUpdateTimestamp: decodedData[6] as bigint,
                  price: decodedData[7] as bigint,
                  marketStatus: decodedData[8] as number,
                  currentMultiplier: decodedData[9] as bigint,
                  newMultiplier: decodedData[10] as bigint,
                  activationDateTime: decodedData[11] as number,
                  tokenizedPrice: decodedData[12] as bigint,
                  rawReport: report.rawReport,
                  parameterPayload: undefined, // Solana doesn't use parameter payload
                };
                return reportV10;
              
              default:
                logger.warn('⚠️ Unsupported report version for Solana', { reportVersion });
                return;
            }
          } catch (error) {
            logger.error('Error decoding report data', { error, reportVersion });
            return;
          }
        }
      }
    }
  } catch (error) {
    logger.error(printError(error), error);
    console.error(error);
  }
}

export async function executeSolanaProgram({
  report,
  idl,
  instructionName,
  instructionPDA,
  instructionArgs,
}: {
  report: ReportV2 | ReportV3 | ReportV4 | ReportV5 | ReportV6 | ReportV7 | ReportV8 | ReportV9 | ReportV10 | StreamReport;
  idl: string;
  instructionName: string;
  instructionPDA: string;
  instructionArgs: { name: string; type: string }[];
}) {
  try {
    const keypair = getKeyPair();
    if (!keypair) {
      logger.error('‼️ Account is missing');
      return;
    }
    const wallet = new Wallet(keypair);
    const connection = await getConnection();

    if (!connection) {
      logger.warn('⚠️ Invalid connection');
      return;
    }

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    anchor.setProvider(provider);
    const program = new Program(JSON.parse(idl), provider);
    const [PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(instructionPDA)],
      program.programId
    );
    const method =
      program.methods[instructionName as keyof typeof program.methods];
    if (!method) {
      logger.error('‼️ Program method is undefined', { instructionName });
      return;
    }
    const args = instructionArgs.map(({ name, type }) =>
      type === 'number'
        ? new BN(
            (report[name as keyof typeof report] ?? 0).toString().slice(0, 4)
          )
        : (report[name as keyof typeof report] ?? '').toString().slice(0, 4)
    );
    const tx = await method(...args)
      .accounts({
        [kebabToCamel(instructionPDA)]: PDA,
        signer: provider.publicKey,
      })
      .rpc({ commitment: 'confirmed' });
    const txDetails = await provider.connection.getTransaction(tx, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    return txDetails;
  } catch (error) {
    logger.error(printError(error), error);
    console.error(error);
  }
}

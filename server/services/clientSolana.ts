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
import { ReportV3, ReportV4, StreamReport } from '../types';
import idl from '../config/idl.json';
import { Verifier } from '../config/idlType';
import { decodeAbiParameters, Hex } from 'viem';
import { getSolanaVerifier } from '../config/verifiers';
import { base64ToHex, kebabToCamel, printError } from '../utils';
import { BN } from 'bn.js';

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
    if (reportVersion !== 3 && reportVersion !== 4) {
      logger.warn('⚠️ Invalid report version', { report });
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
        if (verifiedReportData && reportVersion === 3) {
          const [
            feedId,
            validFromTimestamp,
            observationsTimestamp,
            nativeFee,
            linkFee,
            expiresAt,
            price,
            bid,
            ask,
          ] = decodeAbiParameters(
            [
              { type: 'bytes32', name: 'feedId' },
              { type: 'uint32', name: 'validFromTimestamp' },
              { type: 'uint32', name: 'observationsTimestamp' },
              { type: 'uint192', name: 'nativeFee' },
              { type: 'uint192', name: 'linkFee' },
              { type: 'uint32', name: 'expiresAt' },
              { type: 'int192', name: 'price' },
              { type: 'int192', name: 'bid' },
              { type: 'int192', name: 'ask' },
            ],
            `0x${base64ToHex(verifiedReportData)}`
          );
          const verifiedReport: ReportV3 = {
            reportVersion,
            verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
            feedId,
            validFromTimestamp,
            observationsTimestamp,
            nativeFee,
            linkFee,
            expiresAt,
            price,
            bid,
            ask,
            rawReport: report.rawReport,
            parameterPayload: undefined, // Solana doesn't use parameter payload
          };
          return verifiedReport;
        }
        if (verifiedReportData && reportVersion === 4) {
          const [
            feedId,
            validFromTimestamp,
            observationsTimestamp,
            nativeFee,
            linkFee,
            expiresAt,
            price,
            marketStatus,
          ] = decodeAbiParameters(
            [
              { type: 'bytes32', name: 'feedId' },
              { type: 'uint32', name: 'validFromTimestamp' },
              { type: 'uint32', name: 'observationsTimestamp' },
              { type: 'uint192', name: 'nativeFee' },
              { type: 'uint192', name: 'linkFee' },
              { type: 'uint32', name: 'expiresAt' },
              { type: 'int192', name: 'price' },
              { type: 'uint32', name: 'marketStatus' },
            ],
            `0x${base64ToHex(verifiedReportData)}`
          );
          const verifiedReport: ReportV4 = {
            reportVersion,
            verifiedReport: `0x${base64ToHex(verifiedReportData)}` as Hex,
            feedId,
            validFromTimestamp,
            observationsTimestamp,
            nativeFee,
            linkFee,
            expiresAt,
            price,
            marketStatus,
            rawReport: report.rawReport,
            parameterPayload: undefined, // Solana doesn't use parameter payload
          };
          return verifiedReport;
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
  report: ReportV3 | ReportV4 | StreamReport;
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
        ? new BN((report[name as keyof typeof report] ?? 0).toString())
        : (report[name as keyof typeof report] ?? '').toString()
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

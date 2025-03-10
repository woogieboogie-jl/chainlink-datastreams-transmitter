import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import { logger } from './logger';
import { getCluster, setCluster } from 'server/store';
import { getAllSolanaChains } from 'server/config/chains';

const getKeyPair = () => {
  try {
    return (
      process.env.SECRET_KEY &&
      Keypair.fromSecretKey(bs58.decode(process.env.SECRET_KEY))
    );
  } catch (error) {
    logger.error('ERROR', { error });
    return;
  }
};

const getPublicKey = () => {
  const keypair = getKeyPair();
  if (keypair) return keypair.publicKey;
};

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
      value: balance / LAMPORTS_PER_SOL,
      symbol: 'SOL',
    };
  } catch (error) {
    logger.error('ERROR', { error });
    return {
      value: 0,
      symbol: '',
    };
  }
}

import { createRequestHandler } from '@remix-run/express';
import { type ServerBuild } from '@remix-run/node';
import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import { CronJob, CronTime } from 'cron';
import { logger } from 'server/services/logger.js';
import {
  executeContract as executeWriteContract,
  verifyReport,
  accountAddress,
  getContractAddresses,
} from 'server/services/client.js';
import { ReportV3, StreamReport } from 'server/types.js';
import { abs, formatUSD, isPositive } from 'server/utils.js';
import { readFile } from 'node:fs/promises';
import { chains } from './config/chains.js';
import { cdc } from './services/datastreams.js';
import {
  addFeed,
  getAbi,
  getChainId,
  getContractAddress,
  getFeedExists,
  getFeedName,
  getFeeds,
  getFunctionArgs,
  getFunctionName,
  getGasCap,
  getInterval,
  getLatestReport,
  getPriceDelta,
  getSavedReportBenchmarkPrice,
  removeFeed,
  setAbi,
  setChainId,
  setContractAddress,
  setFunctionArgs,
  setFunctionName,
  setGasCap,
  setInterval,
  setLatestReport,
  setPriceDelta,
  setSavedReport,
} from './store.js';
import { schedule } from './services/limiter.js';
import { formatEther, isAddress, zeroAddress } from 'viem';

const viteDevServer =
  process.env.NODE_ENV === 'production'
    ? undefined
    : await import('vite').then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();

app.use(express.json());
app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use(
    '/assets',
    express.static('build/client/assets', { immutable: true, maxAge: '1y' })
  );
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('build/client', { maxAge: '1h' }));

app.use(morgan('tiny'));

async function getBuild() {
  try {
    const build = viteDevServer
      ? await viteDevServer.ssrLoadModule('virtual:remix/server-build')
      : // @ts-expect-error - the file might not exist yet but it will
        // eslint-disable-next-line import/no-unresolved
        await import('../build/server/remix.js');

    return { build: build as unknown as ServerBuild, error: null };
  } catch (error) {
    // Catch error and return null to make express happy and avoid an unrecoverable crash
    console.error('Error creating build:', error);
    return { error: error, build: null as unknown as ServerBuild };
  }
}

const router = express.Router();

router.get('/feeds', async (req, res) => {
  const feedsIds = await getFeeds();
  const feeds = await Promise.all(
    feedsIds.map(async (feedId) => ({
      feedId,
      name: await getFeedName(feedId),
    }))
  );
  res.send(feeds);
});

router.get('/interval', async (req, res) => {
  res.send({ interval: await getInterval() });
});

router.get('/account', (req, res) => {
  res.send({ address: accountAddress });
});

router.get('/contracts', async (req, res) => {
  const data = await getContractAddresses();
  res.send(data);
});

router.post('/interval', (req, res) => {
  const interval: string = req.body.interval;

  if (!interval) {
    logger.warn('⚠ New interval invalid input', { body: req.body });
    res.status(400);
    return res.send({ warning: 'New interval invalid input' });
  }
  setInterval(interval);
  jobs.forEach(({ job }) => job.setTime(new CronTime(interval)));
  logger.info(`📢 New interval has been set ${interval}`, { interval });
  res.send({ interval });
});

router.post('/add', async (req, res) => {
  const name: string = req.body.name;
  const feedId: string = req.body.feedId;

  if (!name || !feedId) {
    logger.warn('⚠ Add feed invalid input', { body: req.body });
    res.status(400);
    return res.send({ warning: 'Add feed invalid input' });
  }
  const isFeedExist = await getFeedExists(feedId);

  if (isFeedExist) {
    logger.info('⚠ Feed already exists', { feed: { name, feedId } });
    res.status(400);
    return res.send({ warning: 'Feed already exists' });
  }

  await addFeed({ feedId, name });
  const interval = await getInterval();
  if (!interval) {
    logger.warn('⚠ Interval is missing. Set interval and try again');
    res.status(400);
    return res.send({ warning: 'Interval missing' });
  }
  jobs.push({ feedId, job: createCronJob(feedId, interval) });
  cdc.subscribeTo(feedId);
  logger.info(`📢 New feed ${name} has been added`, { feed: { name, feedId } });
  res.send(await getFeeds());
});

router.post('/remove', async (req, res) => {
  const feedId: string = req.body.feedId;
  if (!feedId) {
    logger.warn('⚠ Remove feed invalid input', { body: req.body });
    res.status(400);
    return res.send({ warning: 'Remove feed invalid input' });
  }

  const feedExists = getFeedExists(feedId);

  if (!feedExists) {
    logger.warn('⚠️ Feed does not exists', { feedId });
    res.status(400);
    return res.send({ warning: 'Feed does not exists' });
  }

  const job = jobs.find((job) => job.feedId === feedId);

  if (!job) {
    logger.warn('⚠️ Job does not exists', { feedId });
    res.status(400);
    return res.send({ warning: 'Job does not exists' });
  }

  cdc.unsubscribeFrom(feedId);
  job.job.stop();
  await removeFeed(feedId);
  jobs.splice(jobs.indexOf(job), 1);
  const name = await getFeedName(feedId);
  logger.info(`📢 Feed ${name} has been removed`, { feed: { feedId, name } });

  res.send(await getFeeds());
});

router.get('/chain', async (req, res) => {
  res.send({ chainId: await getChainId() });
});

router.post('/chain', (req, res) => {
  const chainId = Number(req.body.chainId);
  if (!chainId) {
    logger.warn('⚠ Chain id invalid input', { body: req.body });
    res.status(400);
    return res.send({ warning: 'Chain id invalid input' });
  }

  const chain = chains.find((chain) => chain.id === chainId);

  if (!chain) {
    logger.info('Invalid chain', { chainId });
    res.status(400);
    return res.send({ warning: 'Invalid chain' });
  }

  setChainId(chainId);
  logger.info(`📢 Chain switched to ${chain.name}`, { chain });

  res.send({ chainId });
});

router.get('/logs', async (req, res) => {
  try {
    const log = await readFile('./logs/all/all.log', 'utf8');
    return res.send({ log });
  } catch (error) {
    logger.error('ERROR', error);
    return res.send({ log: null });
  }
});

router.post('/start', async (req, res) => {
  const feeds = await getFeeds();
  cdc.subscribeTo(feeds);
  logger.info('🏁 All streams have been started', { feeds });
  res.send({ feeds });
});

router.post('/stop', async (req, res) => {
  const feeds = await getFeeds();
  cdc.unsubscribeFrom(feeds);
  logger.info('🛑 All streams have been stoped', { feeds });
  res.send({ feedsStopped: feeds });
});

router.get('/contract', async (req, res) =>
  res.send({ contract: await getContractAddress() })
);
router.post('/contract', async (req, res) => {
  const contract = req.body.contract;
  if (!isAddress(contract) || contract === zeroAddress) {
    logger.warn('⚠ Invalid contract address', { body: req.body });
    res.status(400);
    return res.send({ warning: 'Invalid contract address' });
  }
  await setContractAddress(contract);
  logger.info(`📢 New contract has been set ${contract}`, { contract });
  res.send({ contract });
});

router.get('/gascap', async (req, res) =>
  res.send({ gasCap: await getGasCap() })
);
router.post('/gascap', (req, res) => {
  const gasCap = req.body.contract;
  if (isNaN(Number(gasCap))) {
    logger.warn('⚠ Invalid gas cap', { body: req.body });
    res.status(400);
    return res.send({ warning: 'Invalid gas cap' });
  }
  setGasCap(gasCap);
  logger.info(`📢 New gas cap has been set ${gasCap}`, { gasCap });
  res.send({ gasCap });
});

router.get('/abi', async (req, res) => res.send({ abi: await getAbi() }));
router.post('/abi', async (req, res) => {
  const abi = req.body.abi;
  if (!abi) {
    logger.warn('⚠ Invalid abi input', { body: req.body });
    res.status(400);
    return res.send({ warning: 'Invalid abi input' });
  }
  try {
    JSON.parse(abi);
  } catch (error) {
    logger.error('ERROR', error);
    res.status(400);
    return res.send({ abi: null });
  }
  await setAbi(abi);
  logger.info(`📢 New abi has been set`, { abi });
  res.send({ info: 'abi updated' });
});

router.get('/function', async (req, res) =>
  res.send({ functionName: await getFunctionName() })
);
router.post('/function', async (req, res) => {
  const functionName = req.body.functionName;
  if (!functionName || functionName.length === 0) {
    logger.warn('⚠ Invalid functionName input', { body: req.body });
    res.status(400);
    return res.send({ warning: 'Invalid functionName input' });
  }
  await setFunctionName(functionName);
  logger.info(`📢 New function has been set ${functionName}`, { functionName });
  res.send({ functionName });
});

router.get('/args', async (req, res) =>
  res.send({ functionArgs: await getFunctionArgs() })
);
router.post('/args', async (req, res) => {
  const functionArgs = req.body.args;
  if (!functionArgs || functionArgs.length === 0) {
    logger.warn('⚠ Invalid args input', { body: req.body });
    res.status(400);
    return res.send({ warning: 'Invalid args input' });
  }
  await setFunctionArgs(functionArgs);
  logger.info(
    `📢 New set of arguments has been set ${functionArgs.join(', ')}`,
    { functionArgs }
  );
  res.send({ functionArgs });
});

router.get('/delta', async (req, res) => {
  res.send({ priceDelta: await getPriceDelta() });
});
router.post('/delta', async (req, res) => {
  const priceDelta = req.body.priceDelta;
  if (!priceDelta || isNaN(Number(priceDelta))) {
    logger.warn('⚠ Invalid price delta input', { body: req.body });
    res.status(400);
    return res.send({ warning: 'Invalid price delta input' });
  }
  await setPriceDelta(priceDelta);
  logger.info(`📢 New price delta has been set ${formatEther(priceDelta)}`, {
    priceDelta,
  });
  res.send({ priceDelta });
});

app.use('/api', router);

// handle SSR requests
app.all(
  '*',
  createRequestHandler({
    build: async () => {
      const { error, build } = await getBuild();
      if (error) {
        throw error;
      }
      return build;
    },
  })
);

const port = process.env.PORT || 3000;
const jobs: { job: CronJob<null, null>; feedId: string }[] = [];

app.listen(port, async () => {
  logger.info(`🚀 running at http://localhost:${port}`);
  const feeds = await getFeeds();
  const interval = await getInterval();
  if (!interval) {
    logger.warn('⚠ Interval is missing. Set interval and try again');
    return;
  }
  cdc.subscribeTo(feeds);
  jobs.push(
    ...feeds.map((feedId) => ({
      feedId,
      job: createCronJob(feedId, interval),
    }))
  );
  logger.info('🏁 Streams have been started', { feeds });
});

// https://docs.chain.link/data-streams/crypto-streams?network=arbitrum&page=1#testnet-crypto-streams

cdc.on('report', async (report: StreamReport) => {
  setLatestReport(report);
});

async function dataUpdater({ report }: { report: StreamReport }) {
  try {
    const verifiedReport = await verifyReport(report);
    if (!verifiedReport) {
      logger.warn(`🛑 Verified report is missing | Aborting`);
      return;
    }
    const functionName = await getFunctionName();
    if (!functionName) {
      logger.warn(`🛑 Function name is missing | Aborting`);
      return;
    }
    const abi = await getAbi();
    if (!abi) {
      logger.warn(`🛑 Contract ABI is missing | Aborting`);
      return;
    }
    logger.info('✅ Report verified', { verifiedReport });
    const transaction = await executeWriteContract({
      report: verifiedReport as ReportV3,
      abi: JSON.parse(abi),
      functionName,
      functionArgs: await getFunctionArgs(),
    });
    if (transaction?.status) {
      logger.info(`ℹ️ Transaction status: ${transaction?.status}`, {
        transaction,
      });
    }
    if (transaction?.status === 'success') {
      await setSavedReport(report);
      logger.info(
        `💾 Price stored | ${await getFeedName(report.feedId)}: ${formatUSD(
          report.benchmarkPrice
        )}$`,
        { report }
      );
    }
  } catch (error) {
    logger.error('ERROR', error);
  }
}

function createCronJob(feedId: string, interval: string) {
  return new CronJob(
    interval,
    async function () {
      const report = getLatestReport(feedId);
      const latestBenchmarkPrice = report.benchmarkPrice;
      if (!latestBenchmarkPrice) return;
      const savedBenchmarkPrice = await getSavedReportBenchmarkPrice(feedId);
      const diff = latestBenchmarkPrice - BigInt(savedBenchmarkPrice ?? 0);
      const priceDelta = await getPriceDelta();
      if (abs(diff) < BigInt(priceDelta ?? 0)) return;
      logger.info(
        `🚨 Price deviation detected | ${await getFeedName(
          report.feedId
        )}: ${formatUSD(latestBenchmarkPrice)}$ | ${
          isPositive(diff) ? '📈' : '📉'
        } ${isPositive(diff) ? '+' : ''}${formatUSD(diff)}$`,
        report
      );

      await schedule(() => dataUpdater({ report }));
    },
    null,
    true
  );
}

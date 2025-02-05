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
  getFeed,
  getFeeds,
  getFunctionArgs,
  getFunctionName,
  getInterval,
  getLatestReport,
  getPriceDelta,
  getSavedReportBenchmarkPrice,
  removeFeed,
  setAbi,
  setChainId,
  setFunctionArgs,
  setFunctionName,
  setInterval,
  setLatestReport,
  setSavedReport,
} from './store.js';
import { schedule } from './services/limiter.js';

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

router.get('/feeds', (req, res) => {
  res.send(getFeeds());
});

router.get('/interval', (req, res) => {
  res.send({ interval: getInterval() });
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
    logger.warn('⚠ New interval invalid input', req.body);
    res.status(400);
    return res.send({ warning: 'New interval invalid input' });
  }
  setInterval(interval);
  jobs.forEach(({ job }) => job.setTime(new CronTime(interval)));
  logger.info(`📢 New interval has been set ${interval}`, interval);
  res.send({ interval });
});

router.post('/add', (req, res) => {
  const name: string = req.body.name;
  const feedId: string = req.body.feedId;

  if (!name || !feedId) {
    logger.warn('⚠ Add feed invalid input', req.body);
    res.status(400);
    return res.send({ warning: 'Add feed invalid input' });
  }
  const isFeedExist = !!getFeed(feedId);

  if (isFeedExist) {
    logger.info('⚠ Feed already exists', { name, feedId });
    res.status(400);
    return res.send({ warning: 'Feed already exists' });
  }

  addFeed({ feedId, name });
  jobs.push({ feedId, job: createCronJob(feedId) });
  cdc.subscribeTo(feedId);
  logger.info(`📢 New feed ${name} has been added`, { name, feedId });
  res.send(getFeeds());
});

router.post('/remove', (req, res) => {
  const feedId: string = req.body.feedId;
  if (!feedId) {
    logger.warn('⚠ Remove feed invalid input', req.body);
    res.status(400);
    return res.send({ warning: 'Remove feed invalid input' });
  }

  const feed = getFeed(feedId);

  if (!feed) {
    logger.info('Feed does not exists', { feedId });
    res.status(400);
    return res.send({ warning: 'Feed does not exists' });
  }

  const job = jobs.find((job) => job.feedId === feedId);

  if (!job) {
    logger.info('Job does not exists', { feedId });
    res.status(400);
    return res.send({ warning: 'Job does not exists' });
  }

  cdc.unsubscribeFrom(feedId);
  job.job.stop();
  removeFeed(feedId);
  jobs.splice(jobs.indexOf(job), 1);

  logger.info(`📢 Feed ${feed.name} has been removed`, feed);

  res.send(getFeeds());
});

router.get('/chain', (req, res) => {
  res.send({ chainId: getChainId() });
});

router.post('/chain', (req, res) => {
  const chainId = Number(req.body.chainId);
  if (!chainId) {
    logger.warn('⚠ Chain id invalid input', req.body);
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
  logger.info(`📢 Chain switched to ${chain.name}`, chain);

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

router.post('/start', (req, res) => {
  const feeds = getFeeds();
  cdc.subscribeTo(feeds.map(({ feedId }) => feedId));
  logger.info('🏁 All streams have been started', { feeds });
  res.send({ feeds: feeds.map(({ feedId }) => feedId) });
});

router.post('/stop', (req, res) => {
  const feeds = getFeeds();
  cdc.unsubscribeFrom(feeds.map(({ feedId }) => feedId));
  logger.info('🛑 All streams have been stoped', { feeds });
  res.send({ feeds: [] });
});

router.get('/abi', (req, res) => res.send({ abi: JSON.stringify(getAbi()) }));
router.post('/abi', (req, res) => {
  try {
    const abi = JSON.parse(req.body.abi);
    if (!abi) {
      logger.warn('⚠ Invalid abi input', req.body);
      res.status(400);
      return res.send({ warning: 'Invalid abi input' });
    }
    setAbi(abi);
    res.send({ info: 'abi updated' });
  } catch (error) {
    logger.error('ERROR', error);
    res.status(400);
    return res.send({ abi: null });
  }
});

router.get('/function', (req, res) =>
  res.send({ functionName: getFunctionName() })
);
router.post('/function', (req, res) => {
  const functionName = req.body.functionName;
  if (!functionName || functionName.length === 0) {
    logger.warn('⚠ Invalid functionName input', req.body);
    res.status(400);
    return res.send({ warning: 'Invalid functionName input' });
  }
  setFunctionName(functionName);
  res.send({ functionName });
});

router.get('/args', (req, res) =>
  res.send({ functionArgs: getFunctionArgs() })
);
router.post('/args', (req, res) => {
  const functionArgs = req.body.args;
  if (!functionArgs || functionArgs.length === 0) {
    logger.warn('⚠ Invalid args input', req.body);
    res.status(400);
    return res.send({ warning: 'Invalid args input' });
  }
  setFunctionArgs(functionArgs);
  res.send({ functionArgs: getFunctionArgs() });
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

app.listen(port, () => logger.info(`🚀 running at http://localhost:${port}`));

// https://docs.chain.link/data-streams/crypto-streams?network=arbitrum&page=1#testnet-crypto-streams

const jobs = getFeeds().map(({ feedId }) => ({
  feedId,
  job: createCronJob(feedId),
}));

cdc.on('report', async (report: StreamReport) => {
  setLatestReport(report);
});

async function dataUpdater({ report }: { report: StreamReport }) {
  try {
    const verifiedReport = await verifyReport(report);
    if (!verifiedReport) return;
    logger.info('✅ Report verified', { verifiedReport });
    const transaction = await executeWriteContract({
      report: verifiedReport as ReportV3,
      abi: getAbi(),
      functionName: getFunctionName(),
      functionArgs: getFunctionArgs(),
    });
    if (transaction?.status) {
      logger.info(`ℹ️ Transaction status: ${transaction?.status}`, {
        transaction,
      });
    }
    if (transaction?.status === 'success') {
      setSavedReport(report);
      logger.info(
        `💾 Price stored | ${getReportFeedName(report)}: ${formatUSD(
          report.benchmarkPrice
        )}$`,
        { report }
      );
    }
  } catch (error) {
    logger.error('ERROR', error);
  }
}

function createCronJob(feedId: string) {
  return new CronJob(
    getInterval(),
    async function () {
      const report = getLatestReport(feedId);
      const latestBenchmarkPrice = report.benchmarkPrice;
      if (!latestBenchmarkPrice) return;
      const savedBenchmarkPrice = getSavedReportBenchmarkPrice(feedId);
      const diff = latestBenchmarkPrice - savedBenchmarkPrice;
      const priceDelta = getPriceDelta();
      if (abs(diff) < priceDelta) return;
      logger.info(
        `🚨 Price deviation detected | ${getReportFeedName(
          report
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

const getReportFeedName = (report: StreamReport) =>
  getFeeds().find((feed) => feed.feedId === report.feedId)?.name ?? '';

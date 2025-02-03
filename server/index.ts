import { createRequestHandler } from '@remix-run/express';
import { type ServerBuild } from '@remix-run/node';
import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import { CronJob, CronTime } from 'cron';
import Bottleneck from 'bottleneck';
import { logger } from 'server/logger.js';
import {
  cdc,
  interval as initialInterval,
  priceDelta,
  executeContract as executeWriteContract,
  feeds as initialFeeds,
  verifyReport,
  accountAddress,
  getContractAddresses,
  switchChain,
  getChainId,
} from 'server/client.js';
import { ReportV3, StreamReport } from 'server/types.js';
import { abs, formatUSD, isPositive } from 'server/utils.js';
import { readFile } from 'node:fs/promises';
import { chains } from './chains.js';
import { Abi } from 'viem';

const interval = { interval: initialInterval };

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
  res.send(feeds.map(({ name, feedId }) => ({ name, feedId })));
});

router.get('/interval', (req, res) => {
  res.send(interval);
});

router.get('/account', (req, res) => {
  res.send({ address: accountAddress });
});

router.get('/contracts', async (req, res) => {
  const data = await getContractAddresses();
  res.send(data);
});

router.post('/interval', (req, res) => {
  const newInterval: string = req.body.interval;

  if (!newInterval) {
    logger.warn('⚠ New interval invalid input', req.body);
    res.status(400);
    return res.send({ warning: 'New interval invalid input' });
  }
  interval.interval = newInterval;
  feeds.forEach(({ job }) => job.setTime(new CronTime(newInterval)));
  logger.info(`📢 New interval has been set ${newInterval}`, interval);
  res.send(interval);
});

router.post('/add', (req, res) => {
  const name: string = req.body.name;
  const feedId: string = req.body.feedId;

  if (!name || !feedId) {
    logger.warn('⚠ Add feed invalid input', req.body);
    res.status(400);
    return res.send({ warning: 'Add feed invalid input' });
  }
  const isFeedExist = !!feeds.find((feed) => feed.feedId === feedId);

  if (isFeedExist) {
    logger.info('⚠ Feed already exists', { name, feedId });
    res.status(400);
    return res.send({ warning: 'Feed already exists' });
  }

  const newFeed = {
    name,
    feedId,
    job: createCronJob({ name, feedId }),
  };

  feeds.push(newFeed);
  cdc.subscribeTo(newFeed.feedId);
  logger.info(`📢 New feed ${newFeed.name} has been added`, { name, feedId });
  res.send(feeds.map(({ name }) => name));
});

router.post('/remove', (req, res) => {
  const feedId: string = req.body.feedId;
  if (!feedId) {
    logger.warn('⚠ Remove feed invalid input', req.body);
    res.status(400);
    return res.send({ warning: 'Remove feed invalid input' });
  }

  const feed = feeds.find((feed) => feed.feedId === feedId);

  if (!feed) {
    logger.info('Feed does not exists', { feedId });
    res.status(400);
    return res.send({ warning: 'Feed does not exists' });
  }

  cdc.unsubscribeFrom(feedId);
  feed.job.stop();
  feeds.splice(feeds.indexOf(feed), 1);

  logger.info(`📢 Feed ${feed.name} has been removed`, {
    name: feed.name,
    feedId,
  });

  res.send(feeds.map(({ name }) => name));
});

router.get('/chain', (req, res) => {
  const chainId = getChainId();
  res.send({ chainId });
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

  switchChain(chainId);
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
  cdc.subscribeTo(feeds.map(({ feedId }) => feedId));
  logger.info('🏁 All streams have been started', { feeds });
  res.send({ feeds: feeds.map(({ feedId }) => feedId) });
});

router.post('/stop', (req, res) => {
  cdc.unsubscribeFrom(feeds.map(({ feedId }) => feedId));
  logger.info('🛑 All streams have been stoped', { feeds });
  res.send({ feeds: [] });
});

router.get('/abi', (req, res) => res.send({ abi: JSON.stringify(abi) }));
router.post('/abi', (req, res) => {
  try {
    const newAbi = JSON.parse(req.body.abi);
    if (!newAbi) {
      logger.warn('⚠ Invalid abi input', req.body);
      res.status(400);
      return res.send({ warning: 'Invalid abi input' });
    }
    abi = newAbi;
    res.send({ info: 'abi updated' });
  } catch (error) {
    logger.error('ERROR', error);
    res.status(400);
    return res.send({ abi: null });
  }
});

router.get('/function', (req, res) => res.send({ functionName }));
router.post('/function', (req, res) => {
  const newFunctionName = req.body.functionName;
  if (!newFunctionName || newFunctionName.length === 0) {
    logger.warn('⚠ Invalid functionName input', req.body);
    res.status(400);
    return res.send({ warning: 'Invalid functionName input' });
  }
  functionName = newFunctionName;
  res.send({ functionName });
});

router.get('/args', (req, res) => res.send({ functionArgs }));
router.post('/args', (req, res) => {
  const newArgs = req.body.args;
  if (!newArgs || newArgs.length === 0) {
    logger.warn('⚠ Invalid args input', req.body);
    res.status(400);
    return res.send({ warning: 'Invalid args input' });
  }
  functionArgs = newArgs;
  res.send({ functionArgs });
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
const feeds = initialFeeds.map((feed) => ({
  ...feed,
  job: createCronJob(feed),
}));
const reports: { [key: string]: StreamReport } = {};
const store: { [key: string]: StreamReport } = {};
let abi: Abi = [];
let functionName = '';
let functionArgs: string[] = [];

cdc.on('report', async (report: StreamReport) => {
  reports[report.feedId] = report;
});

const limiter = new Bottleneck({
  maxConcurrent: 1,
});

limiter.on('failed', function (error, jobInfo) {
  logger.warn('⚠️ Writing onchain failed', error, jobInfo);
});

limiter.on('retry', function (message, jobInfo) {
  logger.info('🔄 Retrying', message, jobInfo);
});

limiter.on('received', function (info) {
  logger.info('📆 Scheduled for writing onchain', info);
});

async function dataUpdater({ report }: { report: StreamReport }) {
  try {
    const verifiedReport = await verifyReport(report);
    if (!verifiedReport) return;
    logger.info('✅ Report verified', { verifiedReport });

    const transaction = await executeWriteContract({
      report: verifiedReport as ReportV3,
      abi,
      functionName,
      functionArgs,
    });
    if (transaction?.status) {
      logger.info(`ℹ️ Transaction status: ${transaction?.status}`, {
        transaction,
      });
    }
    if (transaction?.status === 'success') {
      store[report.feedId] = report;
      logger.info(
        `💾 Price stored | ${getReportFeedName(report)}: ${formatUSD(
          report.benchmarkPrice
        )}$`,
        report
      );
    }
  } catch (error) {
    logger.error('ERROR', error);
  }
}

function createCronJob(feed: { feedId: string; name: string }) {
  return new CronJob(
    interval.interval,
    async function () {
      const report = { ...reports[feed.feedId] };
      if (!report.benchmarkPrice) return;

      const diff =
        report.benchmarkPrice -
        (store[feed.feedId]?.benchmarkPrice ?? BigInt(0));
      if (abs(diff) < priceDelta) return;
      logger.info(
        `🚨 Price deviation detected | ${getReportFeedName(
          report
        )}: ${formatUSD(report.benchmarkPrice)}$ | ${
          isPositive(diff) ? '📈' : '📉'
        } ${isPositive(diff) ? '+' : ''}${formatUSD(diff)}$`,
        report
      );

      await limiter.schedule(() => dataUpdater({ report }));
    },
    null,
    true
  );
}

const getReportFeedName = (report: StreamReport) =>
  feeds.find((feed) => feed.feedId === report.feedId)?.name ?? '';

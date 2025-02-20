import { createRequestHandler } from '@remix-run/express';
import { type ServerBuild } from '@remix-run/node';
import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import { CronJob, CronTime } from 'cron';
import type ChainlinkDatastreamsConsumer from '@hackbg/chainlink-datastreams-consumer';
import { logger } from 'server/services/logger.js';
import {
  executeContract as executeWriteContract,
  verifyReport,
} from 'server/services/client.js';
import { ReportV3, StreamReport } from 'server/types.js';
import { abs, formatUSD, isPositive } from 'server/utils.js';
import { readFile } from 'node:fs/promises';
import {
  addFeed,
  getAbi,
  getFeedExists,
  getFeedName,
  getFeeds,
  getFunctionArgs,
  getFunctionName,
  getInterval,
  getLatestReport,
  getPriceDelta,
  getSavedReportBenchmarkPrice,
  removeFeed,
  setInterval,
  setLatestReport,
  setSavedReport,
} from './store.js';
import { schedule } from './services/limiter.js';
import { createDatastream } from './services/datastreams.js';

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

router.post('/interval', async (req, res) => {
  const interval: string = req.body.interval;

  if (!interval) {
    logger.warn('⚠ New interval invalid input', { body: req.body });
    res.status(400);
    return res.send({ warning: 'New interval invalid input' });
  }
  setInterval(interval);
  if (jobs.length > 0)
    jobs.forEach(({ job }) => job.setTime(new CronTime(interval)));

  if (jobs.length < 1) {
    const feeds = await getFeeds();
    initJobs({ feeds, interval });
  }

  logger.info(`📢 New interval has been set ${interval}`, { interval });
  res.send({ interval });
});

router.post('/feeds/add', async (req, res) => {
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
  const consumer = createDatastream([feedId]);
  consumer.on('report', async (report: StreamReport) => {
    setLatestReport(report);
  });
  jobs.push({
    feedId,
    job: createCronJob(feedId, interval),
    consumer,
  });
  logger.info(`📢 New feed ${name} has been added`, { feed: { name, feedId } });
  res.send(await getFeeds());
});

router.post('/feeds/remove', async (req, res) => {
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

  const name = await getFeedName(feedId);
  await job.consumer.unsubscribeFrom(feedId);
  job.job.stop();
  await removeFeed(feedId);
  jobs.splice(jobs.indexOf(job), 1);
  logger.info(`📢 Feed ${name} has been removed`, { feed: { feedId, name } });

  res.send(await getFeeds());
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
  await Promise.all(
    jobs.map(async ({ consumer, feedId, job }) => {
      await consumer.subscribeTo([feedId]);
      job.start();
    })
  );
  const feeds = jobs.map(({ feedId }) => feedId);
  logger.info('🏁 All streams have been started', {
    feeds,
  });
  res.send({ feeds });
});

router.post('/stop', async (req, res) => {
  await Promise.all(
    jobs.map(async ({ consumer, job }) => {
      const feeds = [...consumer.feeds];
      await consumer.unsubscribeFrom(feeds);
      job.stop();
    })
  );
  const feeds = jobs.map(({ feedId }) => feedId);
  logger.info('🛑 All streams have been stoped', { feeds });
  res.send({ feedsStopped: feeds });
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
const jobs: {
  job: CronJob<null, null>;
  feedId: string;
  consumer: ChainlinkDatastreamsConsumer;
}[] = [];

app.listen(port, async () => {
  logger.info(`🚀 running at http://localhost:${port}`);
  const feeds = await getFeeds();
  const interval = await getInterval();
  if (!interval) {
    logger.warn('⚠ Interval is missing. Set interval and try again');
    return;
  }

  initJobs({ feeds, interval });

  logger.info('🏁 Streams have been started', { feeds });
});

// https://docs.chain.link/data-streams/crypto-streams?network=arbitrum&page=1#testnet-crypto-streams

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
      const latestBenchmarkPrice = report?.benchmarkPrice;
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

function initJobs({ feeds, interval }: { feeds: string[]; interval: string }) {
  jobs.push(
    ...feeds.map((feedId) => {
      const consumer = createDatastream([feedId]);
      consumer.on('report', async (report: StreamReport) => {
        setLatestReport(report);
      });
      return {
        feedId,
        job: createCronJob(feedId, interval),
        consumer,
      };
    })
  );
}

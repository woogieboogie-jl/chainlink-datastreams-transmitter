import { createRequestHandler } from '@remix-run/express';
import { type ServerBuild } from '@remix-run/node';
import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import { CronJob } from 'cron';
import Bottleneck from 'bottleneck';
import { logger } from 'server/logger.js';
import {
  cdc,
  interval,
  priceDelta,
  setPrice,
  feeds as feedsList,
} from 'server/client.js';
import { ReportV3 } from 'server/types.js';
import { abs, formatUSD, isPositive } from 'server/utils.js';

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
      : // eslint-disable-next-line import/no-unresolved
        await import('../build/server/remix.js');

    return { build: build as unknown as ServerBuild, error: null };
  } catch (error) {
    // Catch error and return null to make express happy and avoid an unrecoverable crash
    console.error('Error creating build:', error);
    return { error: error, build: null as unknown as ServerBuild };
  }
}

app.post('/add', (req, res) => {
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

app.post('/remove', (req, res) => {
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
const feeds = feedsList.map((feed) => ({ ...feed, job: createCronJob(feed) }));

const reports: { [key: string]: ReportV3 } = {};
const store: { [key: string]: ReportV3 } = {};

cdc.on('report', async (report: ReportV3) => {
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

async function dataUpdater({ report }: { report: ReportV3 }) {
  try {
    const transaction = await setPrice(report);
    logger.info(`ℹ️ Transaction status: ${transaction.status}`, transaction);
    if (transaction.status === 'success') {
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
    interval,
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

const getReportFeedName = (report: ReportV3) =>
  feeds.find((feed) => feed.feedId === report.feedId)?.name ?? '';

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

const feeds: { [key: string]: string } = feedsList.reduce(
  (prev, curr) => ({ ...prev, [curr.name]: curr.feedId }),
  {}
);
const reports: { [key: string]: ReportV3 } = {};
const store: { [key: string]: ReportV3 } = {};

const getReportFeedName = (report: ReportV3) =>
  Object.keys(feeds).find((feedId) => feeds[feedId] === report.feedId);

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const jobs = feedsList.map(
  (feed) =>
    new CronJob(
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
    )
);

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

import {
  cdc,
  interval,
  priceDelta,
  setPrice,
  feeds as feedsList,
} from './client';
import { ReportV3 } from './types';
import { abs, formatUSD, isPositive } from './utils';
import { CronJob } from 'cron';
import Bottleneck from 'bottleneck';
import { logger } from './logger';

logger.info(`🚀 Scheduler started`);

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

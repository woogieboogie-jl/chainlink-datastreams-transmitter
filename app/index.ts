import { format, fromUnixTime } from 'date-fns';
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

const feeds: { [key: string]: string } = feedsList.reduce(
  (prev, curr) => ({ ...prev, [curr.name]: curr.feedId }),
  {}
);

const reports: { [key: string]: ReportV3 } = {};
const store: { [key: string]: ReportV3 } = {};

cdc.on('report', async (report: ReportV3) => {
  reports[report.feedId] = report;
});

const limiter = new Bottleneck({
  maxConcurrent: 1,
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

        await limiter.schedule(() => dataUpdater({ report, diff }));
      },
      null,
      true
    )
);

async function dataUpdater({
  report,
  diff,
}: {
  report: ReportV3;
  diff: bigint;
}) {
  try {
    const transaction = await setPrice(report);
    if (transaction.status === 'success') {
      store[report.feedId] = report;
      console.log(
        `🚨 ${format(
          fromUnixTime(Number(report.observationsTimestamp)),
          'y/MM/dd HH:mm:ss'
        )} | ${Object.keys(feeds).find(
          (feedId) => feeds[feedId] === report.feedId
        )}: ${formatUSD(report.benchmarkPrice)}$ | ${
          isPositive(diff) ? '📈' : '📉'
        } ${isPositive(diff) ? '+' : ''}${formatUSD(
          diff
        )}$ | Updated onchain: ${format(Date.now(), 'y/MM/dd HH:mm:ss')}`
      );
    }
  } catch (error) {
    console.error(error);
  }
}

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

let isLoading = false;

const feeds: { [key: string]: string } = feedsList.reduce(
  (prev, curr) => ({ ...prev, [curr.name]: curr.feedId }),
  {}
);

const timeouts: { [key: string]: boolean } = {};

const prices: { [key: string]: bigint } = {};

cdc.on('report', async (report: ReportV3) => {
  if (isLoading) {
    console.log('⌛️ Transaction is in progress...');
    return;
  }
  if (timeouts[report.feedId]) return;
  await dataUpdater({ report });
  timeouts[report.feedId] = true;
  setTimeout(() => (timeouts[report.feedId] = false), interval);
});

async function dataUpdater({ report }: { report: ReportV3 }) {
  try {
    const diff = report.benchmarkPrice - (prices[report.feedId] ?? BigInt(0));
    if (abs(diff) < priceDelta) return;
    isLoading = true;
    const transaction = await setPrice(report);
    if (transaction.status === 'success') {
      prices[report.feedId] = report.benchmarkPrice;
      console.log(
        `🚨 ${format(
          fromUnixTime(Number(report.observationsTimestamp)),
          'y/MM/dd HH:mm:ss'
        )} | ${Object.keys(feeds).find(
          (feedId) => feeds[feedId] === report.feedId
        )}: ${formatUSD(report.benchmarkPrice)}$ | ${
          isPositive(diff) ? '📈' : '📉'
        } ${isPositive(diff) ? '+' : ''}${formatUSD(diff)}$`
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    isLoading = false;
  }
}

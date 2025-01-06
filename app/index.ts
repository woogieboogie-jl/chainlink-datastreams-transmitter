import { format, fromUnixTime } from 'date-fns';
import { cdc, getPrice, interval, priceDelta, setPrice } from './client';
import { ReportV3 } from './types';
import { abs, formatUSD, isPositive } from './utils';
import { setTimeout } from 'timers/promises';

let isLoading = false;

cdc.on('report', async (report: ReportV3) => {
  if (isLoading) return;
  await dataUpdater({ report });
});

async function dataUpdater({ report }: { report: ReportV3 }) {
  try {
    const data = await getPrice();
    const diff = report.benchmarkPrice - data.price;
    if (abs(diff) < priceDelta) return;
    isLoading = true;
    const transaction = await setPrice(report);
    if (transaction.status === 'success') {
      console.log(
        `🚨 ${format(
          fromUnixTime(Number(report.observationsTimestamp)),
          'y/MM/dd HH:mm:ss'
        )} | ETH/USD: ${formatUSD(report.benchmarkPrice)}$ | ${
          isPositive(diff) ? '📈' : '📉'
        } ${isPositive(diff) ? '+' : ''}${formatUSD(diff)}$`
      );
    }
    await setTimeout(interval);
  } catch (error) {
    console.error(error);
  } finally {
    isLoading = false;
  }
}

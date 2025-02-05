import Bottleneck from 'bottleneck';
import { logger } from './logger';

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

export const schedule = async <R>(fn: () => PromiseLike<R>) =>
  await limiter.schedule(fn);

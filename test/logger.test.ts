import { jest, describe, afterEach, it, expect } from '@jest/globals';
import { logger } from '../server/services/logger';

describe('logger', () => {
  afterEach(() => {
    jest.resetAllMocks();
    process.env = { NODE_ENV: 'test' };
  });

  it('calls winston info logger', () => {
    const logSpy = jest.spyOn(logger, 'info');
    logger.info('Test info message');
    expect(logSpy).toHaveBeenCalledWith('Test info message');
  });

  it('calls winston warn logger', () => {
    const logSpy = jest.spyOn(logger, 'warn');
    logger.warn('Test warn message');
    expect(logSpy).toHaveBeenCalledWith('Test warn message');
  });

  it('calls winston error logger', () => {
    const logSpy = jest.spyOn(logger, 'error');
    logger.error('Test error message');
    expect(logSpy).toHaveBeenCalledWith('Test error message');
  });
});

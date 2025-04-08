import { describe, it, expect } from '@jest/globals';
import { formatUSD, abs, isPositive, printError } from '../server/utils';

describe('formatUSD', () => {
  it('formats bigint to USD string with 2 decimals', () => {
    const value = 12345678900000000n;
    expect(formatUSD(value)).toBe('0.01');
  });

  it('formats larger values correctly', () => {
    const value = 5000000000000000000000n; // 5e21 with 8 decimals → 5e13 / 1e10 = 5e3
    expect(formatUSD(value)).toBe('5000.00');
  });

  it('formats zero correctly', () => {
    expect(formatUSD(0n)).toBe('0.00');
  });
});

describe('abs', () => {
  it('returns the absolute value of a negative bigint', () => {
    expect(abs(-1000n)).toBe(1000n);
  });

  it('returns the same value if positive', () => {
    expect(abs(1000n)).toBe(1000n);
  });

  it('returns zero if input is zero', () => {
    expect(abs(0n)).toBe(0n);
  });
});

describe('isPositive', () => {
  it('returns true for positive bigint', () => {
    expect(isPositive(42n)).toBe(true);
  });

  it('returns true for zero', () => {
    expect(isPositive(0n)).toBe(true);
  });

  it('returns false for negative bigint', () => {
    expect(isPositive(-1n)).toBe(false);
  });
});

describe('printError', () => {
  it('prints a message if error is an Error instance', () => {
    const error = new Error('Something went wrong');
    expect(printError(error)).toBe('ERROR: Something went wrong');
  });

  it('prints a stringified unknown error object with bigint', () => {
    const error = { reason: 'failure', code: 123, amount: 1000n };
    expect(printError(error)).toBe(
      'ERROR: {"reason":"failure","code":123,"amount":"1000n"}'
    );
  });

  it('prints stringified error for non-object values', () => {
    expect(printError('just a string')).toBe('ERROR: "just a string"');
    expect(printError(123)).toBe('ERROR: 123');
    expect(printError(null)).toBe('ERROR: null');
  });
});

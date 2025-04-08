import { describe, it, expect } from '@jest/globals';
import { cn, detectSchemaVersion, getReportPrice } from '../app/lib/utils';
import { type StreamReport } from '../server/types';

describe('cn', () => {
  it('merges Tailwind classes correctly', () => {
    const result = cn('px-2', 'py-2', 'text-sm', 'text-sm', undefined, null, false);
    expect(result).toBe('px-2 py-2 text-sm');
  });

  it('removes conflicting classes using tailwind-merge', () => {
    const result = cn('text-sm', 'text-lg');
    expect(result).toBe('text-lg');
  });

  it('handles conditional class values', () => {
    const condition = true;
    const result = cn('block', condition && 'hidden');
    expect(result).toBe('hidden');
  });
});

describe('detectSchemaVersion', () => {
  it('detects schema version from full feedId with 0x prefix', () => {
    const result = detectSchemaVersion('0x01020304abcd');
    expect(result).toBe('v258'); // 0x0102 → 258
  });

  it('detects schema version from feedId without 0x prefix', () => {
    const result = detectSchemaVersion('01020304abcd');
    expect(result).toBe('v258');
  });

  it('handles short feedIds safely', () => {
    const result = detectSchemaVersion('0x01');
    expect(result).toBe('v1');
  });
});

describe('getReportPrice', () => {
  it('returns benchmarkPrice for v3 reports', () => {
    const report: StreamReport = {
      version: 'v3',
      benchmarkPrice: BigInt(100),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    expect(getReportPrice(report)).toBe(BigInt(100));
  });

  it('returns price for v4 reports', () => {
    const report: StreamReport = {
      version: 'v4',
      price: BigInt(500),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    expect(getReportPrice(report)).toBe(BigInt(500));
  });

  it('returns 0 for unknown versions', () => {
    const report: StreamReport = {
      version: 'v5',
      price: BigInt(999),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    expect(getReportPrice(report)).toBe(BigInt(0));
  });

  it('returns 0 for undefined report', () => {
    expect(getReportPrice(undefined)).toBe(BigInt(0));
  });
});

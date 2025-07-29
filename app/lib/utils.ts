import { clsx, type ClassValue } from 'clsx';
import { ReportV2, ReportV3, ReportV4, ReportV5, ReportV6, ReportV7, ReportV8, ReportV9, ReportV10, StreamReport } from 'server/types';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function detectSchemaVersion(feedId: string) {
  // Remove the '0x' prefix if present
  if (feedId.startsWith('0x')) {
    feedId = feedId.slice(2);
  }

  // Extract the first two bytes (4 hex characters)
  const firstTwoBytesHex = feedId.slice(0, 4);

  // Convert hex to a number and return with 'v' prefix
  return `v${parseInt(firstTwoBytesHex, 16)}`;
}

export const getReportPrice = (report?: StreamReport | ReportV2 | ReportV3 | ReportV4 | ReportV5 | ReportV6 | ReportV7 | ReportV8 | ReportV9 | ReportV10) => {
  if (!report) return BigInt(0);
  
  // For legacy StreamReport, use existing logic
  if ('version' in report && typeof report.version === 'string') {
    return report?.version === 'v3'
      ? report.benchmarkPrice
      : report?.version === 'v4'
      ? report.price
      : BigInt(0);
  }
  
  // For new report types, use reportVersion property directly
  switch (report.reportVersion) {
    case 2:
    case 3:
    case 4:
    case 6:
    case 8:
    case 10:
      return (report as ReportV2 | ReportV3 | ReportV4 | ReportV6 | ReportV8 | ReportV10).price || BigInt(0);
    case 5:
      return (report as ReportV5).rate || BigInt(0);
    case 7:
      return (report as ReportV7).exchangeRate || BigInt(0);
    case 9:
      return (report as ReportV9).benchmark || BigInt(0);
    default:
      return BigInt(0);
  }
};

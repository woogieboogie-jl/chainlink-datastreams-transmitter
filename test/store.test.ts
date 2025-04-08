import { describe, jest, afterEach, it, expect } from '@jest/globals';
import {
  addFeed,
  getFeedExists,
  getFeedName,
  getFeeds,
  getInterval,
  getLatestReport,
  getSavedReportBenchmarkPrice,
  removeFeed,
  setInterval,
  setLatestReport,
  setSavedReport,
} from '../server/store';
import { StreamReport } from '../server/types';

describe('Store', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('store', () => {
    it('should set and get interval', async () => {
      const interval = '*/15 * * * * *';
      await setInterval('*/15 * * * * *');
      const result = await getInterval();
      expect(result).toEqual(interval);
    });
    it('should set and get latest report', () => {
      setLatestReport(mockRawReport as unknown as StreamReport);
      const result = getLatestReport(mockRawReport.feedId);
      expect(result).toEqual(mockRawReport);
    });
    it('should set and get saved report benchmark price', async () => {
      await setSavedReport(mockRawReport as unknown as StreamReport);
      const result = await getSavedReportBenchmarkPrice(mockRawReport.feedId);
      expect(result).toEqual(mockRawReport.benchmarkPrice.toString());
    });
    it('should set get and remove feeds', async () => {
      const feed1 = {
        feedId:
          '0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba782',
        name: 'ETH/USD',
      };
      const feed2 = {
        feedId:
          '0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439',
        name: 'BTC/USD',
      };
      await addFeed(feed1);
      await addFeed(feed2);
      const allFeeds = await getFeeds();
      expect(allFeeds).toEqual(
        expect.arrayContaining([feed2.feedId, feed1.feedId])
      );
      const feedName = await getFeedName(feed1.feedId);
      expect(feedName).toEqual(feed1.name);
      const isFeedExist = await getFeedExists(feed2.feedId);
      expect(isFeedExist).toEqual(true);
      await removeFeed(feed2.feedId);
      const isFeedExistRemoved = await getFeedExists(feed2.feedId);
      expect(isFeedExistRemoved).toEqual(false);
    });
  });
});

const mockRawReport = {
  feedId: '0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439',
  observationsTimestamp: 1744113993n,
  validFromTimestamp: 1744113993n,
  rawReport:
    '0x00094bdfff2836d6533428dd204f5864470dc055e6bdd01f34502fe890d5ed260000000000000000000000000000000000000000000000000000000000fe3e03000000000000000000000000000000000000000000000000000000030000000100000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002800001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012000037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b4390000000000000000000000000000000000000000000000000000000067f511490000000000000000000000000000000000000000000000000000000067f511490000000000000000000000000000000000000000000000000000b7aed0d99bb30000000000000000000000000000000000000000000000000060e3d80e9289d000000000000000000000000000000000000000000000000000000000681c9e490000000000000000000000000000000000000000000010ede9aaeb1152b900000000000000000000000000000000000000000000000010ede445c373e184f8000000000000000000000000000000000000000000000010edef0e4bef7189c8000000000000000000000000000000000000000000000000000000000000000002066e5b83d082f5ec425e97aae425f15923791c43594f34099cdb439d757607e744753d7b4743ae52c019b8dd8150f0c4955a956092f879a6f9ba19dd56e6349800000000000000000000000000000000000000000000000000000000000000027bcdde1477ab34cc72e341b19fa57a2dadf6d4df2fcc372c562b7d4542928140519a35dba9e1c5e1752b6197277897624609eb6ec47213b84d173e31b3f04524',
  nativeFee: 201961456114611n,
  linkFee: 27272114861148624n,
  expiresAt: 1746705993n,
  benchmarkPrice: 79946579600000000000000n,
  version: 'v3',
  marketStatus: 2n,
};

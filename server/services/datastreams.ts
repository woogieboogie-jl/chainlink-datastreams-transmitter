import ChainlinkDatastreamsConsumer from '@hackbg/chainlink-datastreams-consumer';
import { cdcConfig, clientConfig } from 'server/config/config';

export const cdc = new ChainlinkDatastreamsConsumer({
  ...cdcConfig,
  feeds: clientConfig.feeds.map(({ feedId }) => feedId),
});

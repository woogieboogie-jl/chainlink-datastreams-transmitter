import ChainlinkDatastreamsConsumer from '@hackbg/chainlink-datastreams-consumer';

export const cdc = new ChainlinkDatastreamsConsumer({
  hostname: process.env.DATASTREAMS_HOSTNAME,
  wsHostname: process.env.DATASTREAMS_WS_HOSTNAME,
  clientID: process.env.DATASTREAMS_CLIENT_ID,
  clientSecret: process.env.DATASTREAMS_CLIENT_SECRET,
});

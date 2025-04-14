import ChainlinkDatastreamsConsumer from '@hackbg/chainlink-datastreams-consumer';

export const createDatastream = (feeds?: string[]) =>
  new ChainlinkDatastreamsConsumer({
    apiUrl: process.env.DATASTREAMS_HOSTNAME,
    wsUrl: process.env.DATASTREAMS_WS_HOSTNAME,
    clientId: process.env.DATASTREAMS_CLIENT_ID,
    clientSecret: process.env.DATASTREAMS_CLIENT_SECRET,
    feeds,
    reconnect: {
      enabled: Boolean(process.env.DATASTREAMS_WS_RECONNECT_ENABLED) || true,
      maxReconnectAttempts:
        Number(process.env.DATASTREAMS_WS_RECONNECT_MAX_ATTEMPTS) || Infinity,
      reconnectInterval:
        Number(process.env.DATASTREAMS_WS_RECONNECT_INTERVAL) || 5000,
    },
  });

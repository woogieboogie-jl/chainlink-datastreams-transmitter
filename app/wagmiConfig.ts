import { chains } from 'server/config/chains';
import { createClient } from 'viem';
import { http, createConfig } from 'wagmi';

export const config = createConfig({
  chains,
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

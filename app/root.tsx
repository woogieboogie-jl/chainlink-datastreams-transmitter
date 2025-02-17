import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import type { LinksFunction, MetaFunction } from '@remix-run/node';

import './tailwind.css';
import { Navigation } from './components/navigation';
import { createConfig, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getAllChains } from 'server/config/chains';
import { Chain, createClient, http } from 'viem';
import {
  fetchAccountAddress,
  fetchChainId,
  fetchContractAddresses,
} from './api';

const queryClient = new QueryClient();

export const meta: MetaFunction = () => {
  return [
    { title: 'Datastreams Scheduler' },
    { name: 'description', content: 'Chainlink Datastreams Scheduler' },
  ];
};

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { account, contracts, chain, chains } = useLoaderData<typeof loader>();
  const config = createConfig({
    chains: chains as readonly [Chain, ...Chain[]],
    client({ chain }) {
      return createClient({ chain, transport: http() });
    },
  });
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <body className="min-h-screen bg-background text-foreground">
            <Navigation
              address={account.address}
              contracts={contracts}
              chainId={chain.chainId}
            />
            <main className="container mx-auto flex flex-col p-4 md:p-10 gap-10">
              {children}
            </main>
            <ScrollRestoration />
            <Scripts />
          </body>
        </QueryClientProvider>
      </WagmiProvider>
    </html>
  );
}

export async function loader() {
  const [chains, account, contracts, chain] = await Promise.all([
    getAllChains(),
    fetchAccountAddress(),
    fetchContractAddresses(),
    fetchChainId(),
  ]);
  return { chains, account, contracts, chain };
}

export default function App() {
  return <Outlet />;
}

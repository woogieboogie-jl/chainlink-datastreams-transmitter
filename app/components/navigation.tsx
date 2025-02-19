import { buttonVariants } from '~/components/ui/button';
import { Link } from '@remix-run/react';
import { SquareTerminal } from 'lucide-react';
import { ChainInfo } from './chain-info';
import { Address } from 'viem';

export function Navigation({
  address,
  chain,
  balance,
  linkBalance,
}: {
  address: Address;
  chain?: { chainId?: number; name?: string };
  balance?: { value: string; symbol?: string };
  linkBalance?: { value: string; symbol?: string };
}) {
  return (
    <header className="w-full shrink-0 sticky top-0 z-50 bg-card backdrop-blur-sm shadow-md">
      <nav className="container mx-auto flex py-4 items-center px-4 md:px-10 ">
        <Link to="/">
          <img src="/chainlink.svg" alt="cl" className="size-10" />
        </Link>
        <h1 className="hidden lg:block leading text-3xl font-semibold">
          Datastreams
        </h1>
        <div className="grow" />
        <ChainInfo
          address={address}
          chain={chain}
          balance={balance}
          linkBalance={linkBalance}
        />
        <Link to="/logs" className={buttonVariants({ variant: 'link' })}>
          <SquareTerminal className="size-6" />
          Logs
        </Link>
      </nav>
    </header>
  );
}

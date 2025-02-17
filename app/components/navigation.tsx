import { buttonVariants } from '~/components/ui/button';
import { Link } from '@remix-run/react';
import { SquareTerminal } from 'lucide-react';
import { ChainInfo } from './chain-info';
import { Address } from 'viem';

export function Navigation({
  address,
  chainId,
  contracts,
}: {
  address: Address;
  chainId: string;
  contracts: {
    verifierProxyAddress: Address;
    feeManagerAddress: Address;
    rewardManagerAddress: Address;
    feeTokenAddress: Address;
  };
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
        <ChainInfo address={address} chainId={chainId} contracts={contracts} />
        <Link to="/logs" className={buttonVariants({ variant: 'link' })}>
          <SquareTerminal className="size-6" />
          Logs
        </Link>
      </nav>
    </header>
  );
}

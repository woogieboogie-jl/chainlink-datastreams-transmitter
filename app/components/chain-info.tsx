import { useEffect } from 'react';
import { Address, erc20Abi, formatEther, formatUnits } from 'viem';
import {
  useBalance,
  useChainId,
  useReadContracts,
  useSwitchChain,
} from 'wagmi';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from './ui/dialog';
import { buttonVariants } from './ui/button';
import { Link } from '@remix-run/react';
import { cn } from '~/lib/utils';
import { ChevronDown } from 'lucide-react';

export function ChainInfo({
  address,
  chainId,
  contracts: { feeTokenAddress },
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
  const currentChainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const { data: balance } = useBalance({
    address,
  });
  const { data: tokenBalance } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      },
      {
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      },
      {
        address: feeTokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      },
    ],
  });

  useEffect(() => {
    if (chainId && currentChainId !== Number(chainId)) {
      switchChain({ chainId: Number(chainId) });
    }
  }, [chainId, currentChainId, switchChain]);

  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'w-32 truncate flex'
        )}
      >
        <span className="truncate">{address}</span>
        <ChevronDown className="size-4 shrink-0" />
      </DialogTrigger>
      <DialogContent className="divide-y px-0 gap-2">
        <div className="flex gap-2 items-center px-4">
          <p className="font-semibold">{`${
            chains.find((chain) => chain.id === currentChainId)?.name
          }`}</p>
          <DialogClose asChild>
            <Link
              to="/chain/switch"
              className={cn(buttonVariants({ variant: 'link' }), 'text-base')}
            >
              Switch chain
            </Link>
          </DialogClose>
        </div>
        <div className="w-full px-4 pt-2 truncate">{address}</div>
        {balance && (
          <div className="w-full flex gap-2 items-center px-4 pt-2 truncate">
            <span className="w-24">{balance.symbol}</span>
            <span className="truncate">{formatEther(balance.value)}</span>
          </div>
        )}
        {tokenBalance && (
          <div className="w-full flex gap-2 items-center px-4 pt-2 truncate">
            <span className="w-24">{tokenBalance[2]}</span>
            <span className="truncate">
              {formatUnits(tokenBalance[0], tokenBalance[1])}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

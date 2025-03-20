import { Address } from 'viem';
import { Root as VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { buttonVariants } from './ui/button';
import { Link } from '@remix-run/react';
import { cn } from '~/lib/utils';
import { ChevronDown } from 'lucide-react';

export function ChainInfo({
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
    <Dialog>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'w-40 md:w-60 truncate flex'
        )}
      >
        {chain?.name && (
          <>
            <span className="size-2 rounded-full bg-green-500 shrink-0" />
            <span>{`${chain.name}`}</span>
          </>
        )}
        <span className="hidden md:inline truncate">{address}</span>
        <ChevronDown className="size-4 shrink-0" />
      </DialogTrigger>
      <DialogContent className="px-0 gap-2" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Token balances</DialogTitle>
        </VisuallyHidden>
        <div className="flex gap-2 items-center px-4">
          <p className="font-semibold">{`${chain?.name} (${chain?.chainId})`}</p>
          <DialogClose asChild>
            <Link
              to="/chain/switch"
              className={cn(buttonVariants({ variant: 'link' }), 'text-base')}
            >
              Switch chain
            </Link>
          </DialogClose>
        </div>
        <div className="w-full px-4 pt-2 truncate border-t">{address}</div>
        {balance && (
          <div className="w-full flex gap-2 items-center px-4 pt-2 truncate border-t">
            <span className="w-24">{balance.symbol}</span>
            <span className="truncate">{balance.value}</span>
          </div>
        )}
        {linkBalance && (
          <div className="w-full flex gap-2 items-center px-4 pt-2 truncate border-t">
            <span className="w-24">{linkBalance.symbol}</span>
            <span className="truncate">{linkBalance.value}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

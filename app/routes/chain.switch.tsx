import { Link, useLoaderData, useNavigate, useSubmit } from '@remix-run/react';
import { useChainId, useSwitchChain } from 'wagmi';
import {
  fetchAccountAddress,
  fetchChainId,
  fetchContractAddresses,
  switchChain,
} from '~/api';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
} from '~/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { ActionFunctionArgs } from '@remix-run/node';
import { useEffect, useState } from 'react';
import { Button, buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Plus } from 'lucide-react';

export async function loader() {
  const chain = await fetchChainId();
  return chain;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const chain = Object.fromEntries(formData) as { chainId: string };
  await switchChain(chain);
  return null;
}

export default function SwitchChain() {
  const { chainId } = useLoaderData<typeof loader>();

  const currentChainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const submit = useSubmit();

  useEffect(() => {
    if (chainId && currentChainId !== Number(chainId)) {
      switchChain({ chainId: Number(chainId) });
    }
  }, [chainId, currentChainId, switchChain]);

  const [chainInput, setChainInput] = useState(currentChainId.toString());
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Switch chain</CardTitle>
        <CardDescription>{`${chainId} (${
          chains.find((chain) => chain.id === currentChainId)?.name
        })`}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 w-full">
          <Select onValueChange={(value) => setChainInput(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue asChild placeholder="Select Chain">
                <div>
                  {
                    chains.find((chain) => chain.id === Number(chainInput))
                      ?.name
                  }
                  {chainInput}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Mainnet</SelectLabel>
                {chains
                  .filter((chain) => !chain.testnet)
                  .map((chain) => (
                    <SelectItem value={chain.id.toString()} key={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Testnet</SelectLabel>
                {chains
                  .filter((chain) => chain.testnet)
                  .map((chain) => (
                    <SelectItem value={chain.id.toString()} key={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            disabled={currentChainId === Number(chainInput)}
            onClick={() => {
              switchChain({ chainId: Number(chainInput) });
              submit({ chainId: chainInput }, { method: 'post' });
            }}
          >
            Switch chain
          </Button>
        </div>
      </CardContent>
      <CardFooter className="space-x-4">
        <Link
          to="/chain/new"
          className={cn(buttonVariants({ variant: 'default' }), 'w-fit')}
        >
          Add new chain <Plus />
        </Link>
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </CardFooter>
    </Card>
  );
}

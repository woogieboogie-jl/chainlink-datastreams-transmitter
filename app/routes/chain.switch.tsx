import { Link, useLoaderData, useNavigate, useSubmit } from '@remix-run/react';
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
import { useState } from 'react';
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
import { getAllChains } from 'server/config/chains';
import { setChainId, setCluster, setVm } from 'server/store';
import { logger } from 'server/services/logger';
import { getCurrentChainId } from 'server/services/client';

export async function loader() {
  const [chainId, chains] = await Promise.all([
    getCurrentChainId(),
    getAllChains(),
  ]);
  return { chainId, chains };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData) as { chainId: string };
  const chainId = data.chainId;
  if (!chainId) {
    logger.warn('⚠ Chain id invalid input', { data });
    return null;
  }
  const chains = await getAllChains();
  const chain = chains.find((chain) => chain.id === chainId);

  if (!chain) {
    logger.info('Invalid chain', { chainId });
    return null;
  }

  await setVm(chain.vm);

  if (chain.vm === 'svm') {
    await setCluster(chainId);
  } else {
    setChainId(chainId);
  }

  logger.info(
    `📢 Chain switched to ${chain.name} on ${chain.vm.toUpperCase()}`,
    { chain }
  );
  return null;
}

export default function SwitchChain() {
  const { chainId, chains } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const [chainInput, setChainInput] = useState(chainId);
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Switch chain</CardTitle>
        <CardDescription>{`${
          chains.find((chain) => chain.id === chainId)?.name
        } (${chainId})`}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 w-full">
          <Select onValueChange={(value) => setChainInput(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue asChild placeholder="Select Chain">
                <div>
                  {chains.find((chain) => chain.id === chainInput)?.name}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Mainnet</SelectLabel>
                {chains
                  .filter((chain) => !chain.testnet)
                  .map((chain, i) => (
                    <SelectItem
                      value={chain.id.toString()}
                      key={`${chain.id}${i}`}
                    >
                      {chain.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Testnet</SelectLabel>
                {chains
                  .filter((chain) => chain.testnet)
                  .map((chain, i) => (
                    <SelectItem
                      value={chain.id.toString()}
                      key={`${chain.id}${i}`}
                    >
                      {chain.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            disabled={chainId === chainInput}
            onClick={() => {
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

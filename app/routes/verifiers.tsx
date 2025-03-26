import { ActionFunctionArgs } from '@remix-run/node';
import { logger } from 'server/services/logger';
import { addVerifierAddress, removeVerifierAddress } from 'server/store';
import { Address, isAddress, zeroAddress } from 'viem';
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useSubmit,
} from '@remix-run/react';
import { Plus, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { getAllChains } from 'server/config/chains';
import { defaultVerifiers, getCustomVerifiers } from 'server/config/verifiers';
import { Button, buttonVariants } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  if (request.method === 'POST') {
    const data = Object.fromEntries(formData) as {
      chainId: string;
      address: Address;
    };
    if (!data.chainId || isNaN(Number(data.chainId))) {
      logger.warn('⚠ Invalid chain id', { data });
      return 'Invalid chain id';
    }
    if (!isAddress(data.address) || data.address === zeroAddress) {
      logger.warn('⚠ Invalid verifier contract address', { data });
      return 'Invalid contract address';
    }
    await addVerifierAddress(data.chainId, data.address);
  }
  if (request.method === 'DELETE') {
    const data = Object.fromEntries(formData) as {
      chainId: string;
    };
    if (!data.chainId || isNaN(Number(data.chainId))) {
      logger.warn('⚠ Invalid chain id', { data });
      return;
    }
    await removeVerifierAddress(data.chainId);
  }
  return null;
}

export async function loader() {
  const [chains, customVerifiers] = await Promise.all([
    getAllChains(),
    getCustomVerifiers(),
  ]);
  return {
    chains,
    customVerifiers,
    defaultVerifiers: Object.entries(defaultVerifiers).map(
      ([chainId, address]) => ({
        chainId,
        address,
      })
    ),
  };
}

export default function Verifiers() {
  const navigate = useNavigate();
  const submit = useSubmit();
  const { chains, customVerifiers, defaultVerifiers } =
    useLoaderData<typeof loader>();
  const warning = useActionData<typeof action>();
  const [chainIdInput, setChainIdInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data Streams Verifier Network Addresses</CardTitle>
          <CardDescription>
            This contract verifies the signature from the DON to
            cryptographically guarantee that the report has not been altered
            from the time that the DON reached consensus to the point where you
            use the data in your application. Check out up-to-date contract
            addresses and more information in{' '}
            <a
              href="https://docs.chain.link/data-streams/crypto-streams?page=1#streams-verifier-network-addresses"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'link' }), 'p-0 h-auto')}
            >
              Streams Verifiers Documentation
            </a>{' '}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-xl">Mainnet</Label>
          <Table className="border-separate border-spacing-y-2 mb-6">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48 max-w-48">Chain ID</TableHead>
                <TableHead>Verifier address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defaultVerifiers
                .filter((verifier) => {
                  const chain = chains.find(
                    (chain) => chain.id === Number(verifier.chainId)
                  );
                  return (
                    chain &&
                    (!Object.prototype.hasOwnProperty.call(chain, 'testnet') ||
                      chain.testnet === undefined ||
                      chain.testnet === false)
                  );
                })
                .sort((a, b) =>
                  (
                    chains.find((chain) => chain.id === Number(a.chainId))
                      ?.name ?? ''
                  ).localeCompare(
                    chains.find((chain) => chain.id === Number(b.chainId))
                      ?.name ?? ''
                  )
                )
                .map((verifier, i) => (
                  <TableRow
                    key={i}
                    className="rounded-md ring-1 ring-inset ring-gray-300 bg-background [&_td:last-child]:rounded-r-md [&_td:first-child]:rounded-l-md"
                  >
                    <TableCell>
                      {
                        chains.find(
                          (chain) => chain.id === Number(verifier.chainId)
                        )?.name
                      }
                    </TableCell>
                    <TableCell className="font-mono">
                      {verifier.address}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          <Label className="text-xl">Testnet</Label>
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48 max-w-48">Chain ID</TableHead>
                <TableHead>Verifier address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defaultVerifiers
                .filter(
                  (verifier) =>
                    chains.find(
                      (chain) => chain.id === Number(verifier.chainId)
                    )?.testnet === true
                )
                .sort((a, b) =>
                  (
                    chains.find((chain) => chain.id === Number(a.chainId))
                      ?.name ?? ''
                  ).localeCompare(
                    chains.find((chain) => chain.id === Number(b.chainId))
                      ?.name ?? ''
                  )
                )
                .map((verifier, i) => (
                  <TableRow
                    key={i}
                    className="rounded-md ring-1 ring-inset ring-gray-300 bg-background [&_td:last-child]:rounded-r-md [&_td:first-child]:rounded-l-md"
                  >
                    <TableCell>
                      {
                        chains.find(
                          (chain) => chain.id === Number(verifier.chainId)
                        )?.name
                      }
                    </TableCell>
                    <TableCell className="font-mono">
                      {verifier.address}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Custom Verifier Addresses</CardTitle>
          <CardDescription>
            If a custom verifier contract is not set for a certain chain the
            default one will be used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-60">Chain ID</TableHead>
                <TableHead>Verifier address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customVerifiers
                .sort((a, b) =>
                  (
                    chains.find((chain) => chain.id === Number(a.chainId))
                      ?.name ?? ''
                  ).localeCompare(
                    chains.find((chain) => chain.id === Number(b.chainId))
                      ?.name ?? ''
                  )
                )
                .map((verifier, i) => (
                  <TableRow
                    key={i}
                    className="rounded-md ring-1 ring-inset ring-gray-300 bg-background [&_td:last-child]:rounded-r-md [&_td:first-child]:rounded-l-md"
                  >
                    <TableCell>
                      {
                        chains.find(
                          (chain) => chain.id === Number(verifier.chainId)
                        )?.name
                      }
                    </TableCell>
                    <TableCell className="font-mono">
                      {verifier.address}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:text-red-500 hover:ring-1 hover:ring-red-500"
                        onClick={() => {
                          const response = confirm(
                            `Delete verifier contract ${verifier.address} for ${
                              chains.find(
                                (chain) => chain.id === Number(verifier.chainId)
                              )?.name
                            }?`
                          );
                          if (!response) {
                            return;
                          }
                          submit(
                            { chainId: verifier.chainId },
                            { method: 'delete' }
                          );
                        }}
                      >
                        <Trash2Icon className="size-6" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>New verifier contract address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="max-w-96">
              <Label htmlFor="chain">Chain</Label>
              <Select
                onValueChange={(value) => setChainIdInput(value)}
                name="chain"
              >
                <SelectTrigger>
                  <SelectValue asChild placeholder="Select Chain">
                    <div>
                      {
                        chains.find(
                          (chain) => chain.id === Number(chainIdInput)
                        )?.name
                      }
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
            </div>
            <div className="max-w-96">
              <Label htmlFor="contract">Contract Address</Label>
              <Input
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                name="contract"
                placeholder="0x..."
              />
            </div>
            {warning && (
              <p className="text-sm font-medium text-destructive">{warning}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex gap-4 flex-wrap">
            <Button
              disabled={!chainIdInput || !addressInput}
              onClick={() => {
                submit(
                  { chainId: chainIdInput, address: addressInput },
                  { method: 'post' }
                );
                if (!warning) {
                  setAddressInput('');
                }
              }}
            >
              <Plus /> Add verifier address
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              className="w-fit"
            >
              Back
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}

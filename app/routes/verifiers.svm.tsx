import { ActionFunctionArgs } from '@remix-run/node';
import { logger } from 'server/services/logger';
import {
  addSolanaVerifierProgram,
  removeSolanaVerifierProgram,
} from 'server/store';
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useSubmit,
} from '@remix-run/react';
import { Plus, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { getAllSolanaChains } from 'server/config/chains';
import {
  defaultSolanaVerifiers,
  getCustomSolanaVerifiers,
} from 'server/config/verifiers';
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
      cluster: string;
      verifierProgramID: string;
      accessControllerAccount: string;
    };
    if (!data.cluster) {
      logger.warn('⚠ Invalid chain cluster', { data });
      return 'Invalid chain cluster';
    }
    if (!data.verifierProgramID) {
      logger.warn('⚠ Invalid verifier porogram ID', { data });
      return 'Invalid porogram ID';
    }
    if (!data.accessControllerAccount) {
      logger.warn('⚠ Invalid verifier access controller account', { data });
      return 'Invalid access controller account';
    }
    await addSolanaVerifierProgram(
      data.cluster,
      JSON.stringify({
        verifierProgramID: data.verifierProgramID,
        accessControllerAccount: data.accessControllerAccount,
      })
    );
  }
  if (request.method === 'DELETE') {
    const data = Object.fromEntries(formData) as {
      cluster: string;
    };
    if (!data.cluster) {
      logger.warn('⚠ Invalid chain cluster', { data });
      return 'Invalid chain cluster';
    }
    await removeSolanaVerifierProgram(data.cluster);
  }
  return null;
}

export async function loader() {
  const [chains, customVerifiers] = await Promise.all([
    getAllSolanaChains(),
    getCustomSolanaVerifiers(),
  ]);
  return {
    chains,
    customVerifiers,
    defaultVerifiers: Object.entries(defaultSolanaVerifiers).map(
      ([cluster, verifier]) => ({
        cluster,
        verifierProgramID: verifier.verifierProgramID,
        accessControllerAccount: verifier.accessControllerAccount,
      })
    ),
  };
}

export default function SVMVerifiers() {
  const navigate = useNavigate();
  const submit = useSubmit();
  const { chains, customVerifiers, defaultVerifiers } =
    useLoaderData<typeof loader>();
  const warning = useActionData<typeof action>();
  const [clusterInput, setClusterInput] = useState('');
  const [programIdInput, setProgramIdInput] = useState('');
  const [accessControllerInput, setAccessControllerInput] = useState('');
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data Streams Verifier Network Programs</CardTitle>
          <CardDescription>
            This program verifies the signature from the DON to
            cryptographically guarantee that the report has not been altered
            from the time that the DON reached consensus to the point where you
            use the data in your application. Check out up-to-date program
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
                <TableHead className="min-w-48 max-w-48">Cluster</TableHead>
                <TableHead>Verifier program ID</TableHead>
                <TableHead>Access Controller Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defaultVerifiers
                .filter((verifier) => {
                  const chain = chains.find(
                    (chain) => chain.cluster === verifier.cluster
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
                    chains.find((chain) => chain.cluster === a.cluster)?.name ??
                    ''
                  ).localeCompare(
                    chains.find((chain) => chain.cluster === b.cluster)?.name ??
                      ''
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
                          (chain) => chain.cluster === verifier.cluster
                        )?.name
                      }
                    </TableCell>
                    <TableCell className="font-mono">
                      {verifier.verifierProgramID}
                    </TableCell>
                    <TableCell className="font-mono">
                      {verifier.accessControllerAccount}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          <Label className="text-xl">Testnet</Label>
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48 max-w-48">Cluster</TableHead>
                <TableHead>Verifier program ID</TableHead>
                <TableHead>Access Controller Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defaultVerifiers
                .filter(
                  (verifier) =>
                    chains.find((chain) => chain.cluster === verifier.cluster)
                      ?.testnet === true
                )
                .sort((a, b) =>
                  (
                    chains.find((chain) => chain.cluster === a.cluster)?.name ??
                    ''
                  ).localeCompare(
                    chains.find((chain) => chain.cluster === b.cluster)?.name ??
                      ''
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
                          (chain) => chain.cluster === verifier.cluster
                        )?.name
                      }
                    </TableCell>
                    <TableCell className="font-mono">
                      {verifier.verifierProgramID}
                    </TableCell>
                    <TableCell className="font-mono">
                      {verifier.accessControllerAccount}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Custom Verifier Programs</CardTitle>
          <CardDescription>
            If a custom verifier program is not set for a certain chain the
            default one will be used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-60">Cluster</TableHead>
                <TableHead>Verifier program ID</TableHead>
                <TableHead>Access Controller Account</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customVerifiers
                .sort((a, b) =>
                  (
                    chains.find((chain) => chain.cluster === a.cluster)?.name ??
                    ''
                  ).localeCompare(
                    chains.find((chain) => chain.cluster === b.cluster)?.name ??
                      ''
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
                          (chain) => chain.cluster === verifier.cluster
                        )?.name
                      }
                    </TableCell>
                    <TableCell className="font-mono">
                      {verifier.verifierProgramID}
                    </TableCell>
                    <TableCell className="font-mono">
                      {verifier.accessControllerAccount}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:text-red-500 hover:ring-1 hover:ring-red-500"
                        onClick={() => {
                          const response = confirm(
                            `Delete verifier program ${
                              verifier.verifierProgramID
                            } for ${
                              chains.find(
                                (chain) => chain.cluster === verifier.cluster
                              )?.name
                            }?`
                          );
                          if (!response) {
                            return;
                          }
                          submit(
                            { cluster: verifier.cluster },
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
          <CardTitle>New verifier program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="max-w-96">
              <Label htmlFor="chain">Chain</Label>
              <Select
                onValueChange={(value) => setClusterInput(value)}
                name="chain"
              >
                <SelectTrigger>
                  <SelectValue asChild placeholder="Select Chain">
                    <div>
                      {
                        chains.find((chain) => chain.cluster === clusterInput)
                          ?.name
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
                          value={chain.cluster}
                          key={`${chain.cluster}${i}`}
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
                          value={chain.cluster}
                          key={`${chain.cluster}${i}`}
                        >
                          {chain.name}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="max-w-96">
              <Label htmlFor="programId">Program ID</Label>
              <Input
                value={programIdInput}
                onChange={(e) => setProgramIdInput(e.target.value)}
                name="programId"
              />
            </div>
            <div className="max-w-96">
              <Label htmlFor="accessControllerAccount">
                AccessControllerAccount
              </Label>
              <Input
                value={accessControllerInput}
                onChange={(e) => setAccessControllerInput(e.target.value)}
                name="accessControllerAccount"
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
              disabled={
                !clusterInput || !programIdInput || !accessControllerInput
              }
              onClick={() => {
                submit(
                  {
                    cluster: clusterInput,
                    verifierProgramID: programIdInput,
                    accessControllerAccount: accessControllerInput,
                  },
                  { method: 'post' }
                );
                if (!warning) {
                  setProgramIdInput('');
                }
              }}
            >
              <Plus /> Add verifier program
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

import { useLoaderData, useSubmit } from '@remix-run/react';
import { erc20Abi, formatUnits, formatEther } from 'viem';
import {
  useBalance,
  useChainId,
  useReadContracts,
  useSwitchChain,
} from 'wagmi';
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
import { Button } from '~/components/ui/button';

export async function loader() {
  const [account, contracts, chain] = await Promise.all([
    fetchAccountAddress(),
    fetchContractAddresses(),
    fetchChainId(),
  ]);
  return { account, contracts, chain };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const chain = Object.fromEntries(formData) as { chainId: string };
  await switchChain(chain);
  return null;
}

export default function Chain() {
  const {
    account: { address },
    contracts: { feeTokenAddress, rewardManagerAddress },
    chain: { chainId },
  } = useLoaderData<typeof loader>();
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
        functionName: 'allowance',
        args: [address, rewardManagerAddress],
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
  const currentChainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const submit = useSubmit();

  useEffect(() => {
    if (chainId && currentChainId !== Number(chainId)) {
      switchChain({ chainId: Number(chainId) });
    }
  }, [chainId, currentChainId, switchChain]);

  const [chainInput, setChainInput] = useState(currentChainId.toString());

  return (
    <>
      {address && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Chain</TableHead>
                <TableHead>Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">{`${chainId} (${
                  chains.find((chain) => chain.id === currentChainId)?.name
                })`}</TableCell>
                <TableCell>{address}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="flex gap-2 w-full">
            <Select
              defaultValue={chainInput}
              onValueChange={(value) => setChainInput(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue asChild>
                  <div>
                    {
                      chains.find((chain) => chain.id === Number(chainInput))
                        ?.name
                    }
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
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
        </>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Token</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balance && (
            <TableRow>
              <TableCell className="font-medium">{balance.symbol}</TableCell>
              <TableCell>{formatEther(balance.value)}</TableCell>
            </TableRow>
          )}
          {tokenBalance && (
            <TableRow>
              <TableCell className="font-medium">{tokenBalance[3]}</TableCell>
              <TableCell>
                {formatUnits(tokenBalance[0], tokenBalance[2])}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {tokenBalance && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Allowance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                {`${formatUnits(tokenBalance[1], tokenBalance[2])} ${
                  tokenBalance[3]
                }`}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </>
  );
}

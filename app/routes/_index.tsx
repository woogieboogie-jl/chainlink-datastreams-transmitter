import { useLoaderData } from '@remix-run/react';
import { erc20Abi, formatEther, formatUnits } from 'viem';
import { useBalance, useReadContracts } from 'wagmi';
import {
  fetchAccountAddress,
  fetchContractAddresses,
  fetchFeeds,
  fetchInterval,
} from '~/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';

export async function loader() {
  const [feeds, interval, account, contracts] = await Promise.all([
    fetchFeeds(),
    fetchInterval(),
    fetchAccountAddress(),
    fetchContractAddresses(),
  ]);
  return { feeds, interval, account, contracts };
}

export default function Index() {
  const {
    feeds,
    interval,
    account: { address },
    contracts: { feeTokenAddress, rewardManagerAddress },
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

  return (
    <>
      {address && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">{address}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Schedule patern</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">{interval.interval}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Stream</TableHead>
            <TableHead>Feed ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeds.map((feed, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{feed.name}</TableCell>
              <TableCell>{feed.feedId}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

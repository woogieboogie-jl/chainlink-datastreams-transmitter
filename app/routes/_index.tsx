import { Form, Link, useLoaderData } from '@remix-run/react';
import { Pause, Play, Plus, Trash2Icon } from 'lucide-react';
import { formatEther } from 'viem';
import {
  fetchContractAddress,
  fetchFeeds,
  fetchFunctionName,
  fetchGasCap,
  fetchInterval,
  fetchPriceDelta,
} from '~/api';
import { Button, buttonVariants } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { cn } from '~/lib/utils';

export async function loader() {
  const [feeds, interval, priceDelta, gasCap, contractAddress, functionName] =
    await Promise.all([
      fetchFeeds(),
      fetchInterval(),
      fetchPriceDelta(),
      fetchGasCap(),
      fetchContractAddress(),
      fetchFunctionName(),
    ]);
  return { feeds, interval, priceDelta, gasCap, contractAddress, functionName };
}

export default function Index() {
  const { feeds, interval, priceDelta, gasCap, contractAddress, functionName } =
    useLoaderData<typeof loader>();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data streams</CardTitle>
          <CardDescription>
            The price feeds you are subscribed to. Check{' '}
            <a
              href="https://docs.chain.link/data-streams/crypto-streams"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'link' }), 'p-0 h-auto')}
            >
              Chainlink Data Streams documentation
            </a>{' '}
            for a list of supported streams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="border-spacing-x-0 border-spacing-y-2 border-separate">
            <TableHeader>
              <TableRow>
                <TableHead>Stream</TableHead>
                <TableHead>Feed ID</TableHead>
                <TableHead>Remove</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeds.map((feed, i) => (
                <TableRow
                  key={i}
                  className="bg-background [&_td:last-child]:rounded-r-md [&_td:first-child]:rounded-l-md"
                >
                  <TableCell>{feed.name}</TableCell>
                  <TableCell>{feed.feedId}</TableCell>
                  <TableCell>
                    <Form
                      method="post"
                      action="feed/delete"
                      onSubmit={(event) => {
                        const response = confirm(`Delete stream ${feed.name}?`);
                        if (!response) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        name="feedId"
                        value={feed.feedId}
                      >
                        <Trash2Icon className="size-6" />
                      </Button>
                    </Form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Link
            to="/feed/new"
            className={cn(buttonVariants({ variant: 'default' }), 'w-fit')}
          >
            Add new data feed <Plus />
          </Link>
        </CardFooter>
      </Card>
      <div className="grid md:grid-cols-2 gap-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Schedule</CardTitle>
            <CardDescription>
              Set the interval to check for price changes and write it on-chain.
              It is represented as a cron expression with granularity in
              seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Pattern: <strong>{interval.interval}</strong>
            </p>
            <Link
              to="/schedule/new"
              className={cn(buttonVariants({ variant: 'default' }), 'w-fit')}
            >
              Set new pattern
            </Link>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-4">
              <Form
                method="post"
                action="schedule/start"
                onSubmit={(event) => {
                  const response = confirm(`Start all data streams`);
                  if (!response) {
                    event.preventDefault();
                  }
                }}
              >
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-600/90"
                >
                  Start <Play />
                </Button>
              </Form>
              <Form
                method="post"
                action="schedule/stop"
                onSubmit={(event) => {
                  const response = confirm(`Stop all data streams`);
                  if (!response) {
                    event.preventDefault();
                  }
                }}
              >
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-600/90"
                >
                  Stop <Pause />
                </Button>
              </Form>
            </div>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Contract</CardTitle>
            <CardDescription>
              The contract address and function that will be invoked when feed
              price data changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full flex gap-2 items-center pt-2 truncate">
              <span className="w-24">Contract address:</span>
              <span className="truncate font-mono">
                {contractAddress.contract}
              </span>
            </div>
            <div className="w-full flex gap-2 items-center pt-2 truncate">
              <span className="w-24">Function:</span>
              <span className="truncate font-mono">
                {functionName.functionName}
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              to="/contract"
              className={cn(buttonVariants({ variant: 'default' }), 'w-fit')}
            >
              Edit contract settings
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Price delta</CardTitle>
            <CardDescription>
              Set the price deviation. Only changes that are equal to or greater
              will be written on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              <strong>{`${formatEther(BigInt(priceDelta.priceDelta ?? 0))} (${
                priceDelta.priceDelta
              })`}</strong>
            </p>
            <Form
              method="post"
              action="price/delta"
              id="delta-form"
              className="space-y-4"
            >
              <div>
                <Label htmlFor="priceDelta">New price delta</Label>
                <Input name="priceDelta" type="number" step="0.0001" min="0" />
              </div>
              <Button type="submit">Submit</Button>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gas cap</CardTitle>
            <CardDescription>
              Set the maximum amount of gas you are willing to spend on a
              transaction. If the estimated gas is greater, the transaction will
              be canceled. The value is set in WEI (the smallest unit on the
              chain).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              <strong>{`${formatEther(BigInt(gasCap.gasCap ?? 0))} ETH (${
                gasCap.gasCap
              } WEI)`}</strong>
            </p>
            <Form
              method="post"
              action="gas/cap"
              id="gas-cap-form"
              className="space-y-4"
            >
              <div>
                <Label htmlFor="gasCap">New gas cap WEI</Label>
                <Input name="gasCap" type="number" min="0" />
              </div>
              <Button type="submit">Submit</Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

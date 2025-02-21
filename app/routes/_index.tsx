import { Form, Link, useLoaderData, useRevalidator } from '@remix-run/react';
import { Power, Play, Plus, Trash2Icon } from 'lucide-react';
import { useEffect } from 'react';
import {
  getContractAddress,
  getFeedName,
  getFeeds,
  getFunctionName,
  getGasCap,
  getInterval,
  getPriceDelta,
  getSavedReportBenchmarkPrice,
} from 'server/store';
import { formatUSD } from 'server/utils';
import { formatEther } from 'viem';
import { fetchLatestPrice, fetchStatus } from '~/api';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { cn, detectSchemaVersion } from '~/lib/utils';

export async function loader() {
  const [feeds, interval, priceDelta, gasCap, contractAddress, functionName] =
    await Promise.all([
      (async function () {
        const feedsIds = await getFeeds();
        return await Promise.all(
          feedsIds.map(async (feedId) => ({
            feedId,
            name: await getFeedName(feedId),
            savedPrice: await getSavedReportBenchmarkPrice(feedId),
            latestReport: await fetchLatestPrice(feedId),
            status: await fetchStatus(feedId),
          })),
        );
      })(),
      getInterval(),
      getPriceDelta(),
      getGasCap(),
      getContractAddress(),
      getFunctionName(),
    ]);
  return { feeds, interval, priceDelta, gasCap, contractAddress, functionName };
}

export default function Index() {
  const { feeds, interval, priceDelta, gasCap, contractAddress, functionName } =
    useLoaderData<typeof loader>();

  const revalidator = useRevalidator();

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (revalidator.state === 'idle') {
        revalidator.revalidate();
      }
    }, 5000);
    return () => {
      clearInterval(intervalId);
    };
  }, [revalidator]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Data streams</CardTitle>
          <CardDescription>
            The feeds you are subscribed to. Check{' '}
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
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow>
                <TableHead>Stream</TableHead>
                <TableHead>Feed ID</TableHead>
                <TableHead>Report Schema</TableHead>
                <TableHead>Saved price</TableHead>
                <TableHead>Last reported</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remove</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeds.map((feed, i) => (
                <TableRow
                  key={i}
                  className="rounded-md ring-1 ring-inset ring-gray-300 bg-background [&_td:last-child]:rounded-r-md [&_td:first-child]:rounded-l-md"
                >
                  <TableCell>{feed.name}</TableCell>
                  <TableCell>{feed.feedId}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-600/20 ring-inset">
                      {detectSchemaVersion(feed.feedId)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatUSD(BigInt(feed.savedPrice ?? 0))}
                  </TableCell>
                  <TableCell>
                    {formatUSD(BigInt(feed.latestReport ?? 0))}
                  </TableCell>
                  <TableCell>
                    <Status status={feed.status} />
                  </TableCell>
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
                <Play /> Start
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
              <Button type="submit" className="bg-red-600 hover:bg-red-600/90">
                <Power /> Stop
              </Button>
            </Form>
            <Link
              to="/feed/new"
              className={cn(buttonVariants({ variant: 'default' }), 'w-fit')}
            >
              <Plus />
              Add new data stream
            </Link>
          </div>
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
              Pattern: <strong>{interval}</strong>
            </p>
          </CardContent>
          <CardFooter>
            <Link
              to="/schedule/new"
              className={cn(buttonVariants({ variant: 'default' }), 'w-fit')}
            >
              Set new pattern
            </Link>
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
              <span className="w-32">Contract address:</span>
              <span className="truncate font-mono">{contractAddress}</span>
            </div>
            <div className="w-full flex gap-2 items-center pt-2 truncate">
              <span className="w-32">Function:</span>
              <span className="truncate font-mono">{functionName}</span>
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
              <strong>{`${formatEther(
                BigInt(priceDelta ?? 0),
              )} (${priceDelta})`}</strong>
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
              <strong>{`${formatEther(
                BigInt(gasCap ?? 0),
              )} ETH (${gasCap} WEI)`}</strong>
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

function Status({ status }: { status?: number | string }) {
  if (status === 0)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className="inline-flex items-center rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-yellow-600/20 ring-inset">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
              </span>
              <span className="ml-1">Connecting</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connecting</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  if (status === 1)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              <span className="ml-1">Running</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Running</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  if (status === 2)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className="inline-flex items-center rounded-md bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-orange-600/20 ring-inset">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
              </span>
              <span className="ml-1">Stopping</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Stopping</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/20 ring-inset">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
            <span className="ml-1">Stopped</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Stopped</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData, useNavigate } from '@remix-run/react';
import { getCurrentChain } from 'server/services/client';
import { logger } from 'server/services/logger';
import {
  getAbi,
  getContractAddress,
  getFeedExists,
  getFeedName,
  getFunctionArgs,
  getFunctionName,
  setAbi,
  setContractAddress,
  setFunctionArgs,
  setFunctionName,
} from 'server/store';
import { isAddress, zeroAddress } from 'viem';
import { Button, buttonVariants } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Textarea } from '~/components/ui/textarea';
import { cn } from '~/lib/utils';

enum Intent {
  CONTRACT = 'CONTRACT',
  ABI = 'ABI',
  FUNCTION = 'FUNCTION',
  ARGS = 'ARGS',
}

export async function action({ request, params }: ActionFunctionArgs) {
  const chain = await getCurrentChain();
  if (!chain || !chain.chainId) {
    logger.warn('⚠️ Chain is missing. Connect to a chain and try again');
    return;
  }
  const chainId = `${chain.chainId}`;
  const chainName = chain.name;
  const feedId = params.feedId;
  if (!feedId) {
    logger.warn('⚠ Feed ID is missing', { params });
    return null;
  }
  const isValidFeedId = await getFeedExists(feedId);
  if (!isValidFeedId) {
    logger.warn(
      `⚠ Feed ID ${feedId} is not valid. First add it to the list of streams`,
      { params }
    );
    return null;
  }
  const formData = await request.formData();
  const { intent, ...data } = Object.fromEntries(formData);
  if (intent === Intent.CONTRACT) {
    const contract = (data as { contract: string }).contract;
    if (!isAddress(contract) || contract === zeroAddress) {
      logger.warn('⚠ Invalid contract address', { data });
      return null;
    }
    await setContractAddress(feedId, chainId, contract);
    logger.info(
      `📢 New contract has been set ${contract} on chain ${chainName} (${chainId})`,
      { contract }
    );
    return null;
  }
  if (intent === Intent.ABI) {
    const abi = (data as { abi: string }).abi;
    if (!abi) {
      logger.warn('⚠ Invalid abi input', { data });
      return null;
    }
    try {
      JSON.parse(abi);
    } catch (error) {
      logger.error('ERROR', error);
      return null;
    }
    await setAbi(feedId, chainId, abi);
    logger.info(`📢 New abi has been set on chain ${chainName} (${chainId})`, {
      abi,
    });
    return null;
  }
  if (intent === Intent.FUNCTION) {
    const functionName = (data as { functionName: string }).functionName;
    if (!functionName || functionName.length === 0) {
      logger.warn('⚠ Invalid functionName input', { data });
      return null;
    }
    await setFunctionName(feedId, chainId, functionName);
    logger.info(
      `📢 New function has been set ${functionName} on chain ${chainName} (${chainId})`,
      {
        functionName,
      }
    );
    return null;
  }
  if (intent === Intent.ARGS) {
    const args = (data as { args: string }).args;
    if (!args || args.length === 0) {
      logger.warn('⚠ Invalid args input', { data });
      return null;
    }
    const newArgs = args.split(',').map((a) => a.trim());
    await setFunctionArgs(feedId, chainId, newArgs);
    logger.info(
      `📢 New set of arguments has been set ${newArgs.join(
        ', '
      )} on chain ${chainName} (${chainId})`,
      {
        functionArgs: args,
      }
    );

    return null;
  }

  return null;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const chain = await getCurrentChain();
  if (!chain || !chain.chainId) {
    throw new Response(null, {
      status: 400,
      statusText: 'Not connected to a chain',
    });
  }
  const chainId = `${chain.chainId}`;
  const chainName = chain.name;
  const feedId = params.feedId;
  if (!feedId) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    });
  }
  const isValidFeedId = await getFeedExists(feedId);
  if (!isValidFeedId) {
    throw new Response(null, {
      status: 404,
      statusText: `Feed ${feedId} not found`,
    });
  }

  const [contract, abi, functionName, args, feedName] = await Promise.all([
    getContractAddress(feedId, chainId),
    getAbi(feedId, chainId),
    getFunctionName(feedId, chainId),
    getFunctionArgs(feedId, chainId),
    getFeedName(feedId),
  ]);
  return { contract, abi, functionName, args, feedName, chainName, chainId };
}

export default function Contract() {
  const navigate = useNavigate();
  const { contract, abi, functionName, args, feedName, chainName, chainId } =
    useLoaderData<typeof loader>();

  return (
    <>
      <h1 className="leading text-2xl font-semibold">
        {`Feed ${feedName} settings on chain ${chainName} (${chainId})`}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Contract address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex gap-2 items-center pt-2 truncate">
            <span className="w-24">Address:</span>
            <span className="truncate font-mono">{contract}</span>
          </div>
          <Form method="post" className="space-y-4" id="contract-form">
            <Input type="hidden" name="intent" value={Intent.CONTRACT} />
            <div>
              <Label htmlFor="contract">New address</Label>
              <Input name="contract" placeholder="0x..." />
            </div>
            <Button type="submit">Submit</Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Function</CardTitle>
          <div className="text-sm text-muted-foreground pt-2">
            Enter the name of the contract function to be called to store report
            result data on-chain.
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full flex gap-2 items-center pt-2 truncate">
            <span>Selected function:</span>
            <span className="truncate font-mono">{functionName}</span>
          </div>
          <Form method="post" className="space-y-4" id="function-form">
            <Input type="hidden" name="intent" value={Intent.FUNCTION} />
            <div>
              <Label htmlFor="functionName">Function name</Label>
              <Input name="functionName" placeholder="functionName" />
            </div>
            <Button type="submit">Submit</Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Function arguments</CardTitle>
          <div className="text-sm text-muted-foreground pt-2">
            Enter report arguments field names in the sequense the contract
            expects them to be passed in the selected method, separated by comma
            &#40;, &#41;
            <br />
            Valid arguments:
            <ul className="list-disc list-inside">
              <li>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-1 text-xs font-semibold text-gray-600">
                  feedId
                </span>
              </li>
              <li>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-1 text-xs font-semibold text-gray-600">
                  validFromTimestamp
                </span>
              </li>
              <li>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-1 text-xs font-semibold text-gray-600">
                  observationsTimestamp
                </span>
              </li>
              <li>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-1 text-xs font-semibold text-gray-600">
                  nativeFee
                </span>
              </li>
              <li>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-1 text-xs font-semibold text-gray-600">
                  linkFee
                </span>
              </li>
              <li>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-1 text-xs font-semibold text-gray-600">
                  expiresAt
                </span>
              </li>
              <li>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-1 text-xs font-semibold text-gray-600">
                  price
                </span>
              </li>
              <li>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-1 text-xs font-semibold text-gray-600">
                  bid
                </span>
              </li>
              <li>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1 py-1 text-xs font-semibold text-gray-600">
                  ask
                </span>
              </li>
            </ul>
            See documentation for{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'link' }), 'p-0 h-auto')}
              href="https://docs.chain.link/data-streams/reference/report-schema"
            >
              Data Streams Report Schemas
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            Selected arguments:
            <br />
            <ul className="list-disc list-inside font-mono">
              {args.map((arg, i) => (
                <li key={i}>{arg}</li>
              ))}
            </ul>
          </div>
          <Form method="post" className="space-y-2 w-full" id="args-form">
            <Input type="hidden" name="intent" value={Intent.ARGS} />
            <div>
              <Label htmlFor="args">Args</Label>
              <Input name="args" placeholder="Enter arguments " />
            </div>
            <Button type="submit">Submit</Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ABI</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 font-mono">
            <code>
              <pre>{abi && JSON.stringify(JSON.parse(abi), null, 2)}</pre>
            </code>
          </ScrollArea>
          <Form method="post" className="space-y-2 w-full" id="abi-form">
            <Input type="hidden" name="intent" value={Intent.ABI} />
            <div>
              <Label htmlFor="abi">New ABI</Label>
              <Textarea
                placeholder="Paste contract's ABI here"
                className="font-mono"
                name="abi"
              />
            </div>
            <Button type="submit">Submit</Button>
          </Form>
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="secondary"
        onClick={() => navigate(-1)}
        className="w-fit"
      >
        Back
      </Button>
    </>
  );
}

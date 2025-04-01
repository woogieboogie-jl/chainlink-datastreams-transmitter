import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { getCurrentChain } from 'server/services/client';
import { logger } from 'server/services/logger';
import {
  getFeedExists,
  getIdl,
  getInstructionName,
  getInstructionPDA,
  getInstrutctionArgs,
  getVm,
  setIdl,
  setInstructionArgs,
  setInstructionName,
  setInstructionPDA,
} from 'server/store';
import { printError } from 'server/utils';
import { Button, buttonVariants } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Textarea } from '~/components/ui/textarea';
import { cn } from '~/lib/utils';

enum Intent {
  INSTRUCTION = 'INSTRUCTION',
  IDL = 'IDL',
  PDA = 'PDA',
  ARGS = 'ARGS',
}

export async function action({ request, params }: ActionFunctionArgs) {
  const chain = await getCurrentChain();
  if (!chain || !chain.chainId) {
    logger.warn('⚠️ Chain is missing. Connect to a chain and try again');
    return;
  }
  const cluster = `${chain.chainId}`;
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
  switch (intent) {
    case Intent.INSTRUCTION: {
      const instructionName = (data as { instructionName: string })
        .instructionName;
      if (!instructionName || instructionName.length === 0) {
        logger.warn('⚠ Invalid instructionName input', { data });
        return null;
      }
      await setInstructionName(feedId, cluster, instructionName);
      logger.info(
        `📢 New instruction has been set ${instructionName} on chain ${chainName} (${cluster})`,
        {
          instructionName,
        }
      );
      return null;
    }
    case Intent.PDA: {
      const instructionPDA = (data as { instructionPDA: string })
        .instructionPDA;
      if (!instructionPDA || instructionPDA.length === 0) {
        logger.warn('⚠ Invalid instructionPDA input', { data });
        return null;
      }
      await setInstructionPDA(feedId, cluster, instructionPDA);
      logger.info(
        `📢 New instruction PDA has been set ${instructionPDA} on chain ${chainName} (${cluster})`,
        {
          instructionPDA,
        }
      );
      return null;
    }
    case Intent.ARGS: {
      const args = (data as { args: string }).args;
      if (!args || args.length === 0) {
        logger.warn('⚠ Invalid args input', { data });
        return null;
      }
      const newArgs = args
        .split(',')
        .map((a) => a.trim())
        .map((a) => {
          const [name, type] = a.split(' ');
          return { name, type };
        });
      await setInstructionArgs(
        feedId,
        cluster,
        newArgs.map((arg) => JSON.stringify(arg))
      );
      logger.info(
        `📢 New set of arguments has been set ${JSON.stringify(
          newArgs
        )} on chain ${chainName} (${cluster})`,
        {
          functionArgs: args,
        }
      );

      return null;
    }
    case Intent.IDL: {
      const idl = (data as { idl: string }).idl;
      if (!idl) {
        logger.warn('⚠ Invalid IDL input', { data });
        return null;
      }
      try {
        JSON.parse(idl);
      } catch (error) {
        logger.error(printError(error), error);
        console.error(error);
        return null;
      }
      await setIdl(feedId, cluster, idl);
      logger.info(
        `📢 New IDL has been set on chain ${chainName} (${cluster})`,
        {
          idl,
        }
      );
      return null;
    }
    default: {
      return null;
    }
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const vm = await getVm();
  if (vm === 'evm') {
    return redirect(`/contract/${params.feedId}/evm`);
  }
  const chain = await getCurrentChain();
  if (!chain || !chain.chainId) {
    throw new Response(null, {
      status: 400,
      statusText: 'Not connected to a chain',
    });
  }
  const cluster = `${chain.chainId}`;
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

  const [idl, instructionName, instructionPDA, instructionArgs] =
    await Promise.all([
      getIdl(feedId, cluster),
      getInstructionName(feedId, cluster),
      getInstructionPDA(feedId, cluster),
      getInstrutctionArgs(feedId, cluster),
    ]);

  return { idl, instructionName, instructionPDA, instructionArgs };
}

export default function ContractSVM() {
  const { idl, instructionName, instructionPDA, instructionArgs } =
    useLoaderData<typeof loader>();
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Function</CardTitle>
          <div className="text-sm text-muted-foreground pt-2">
            Enter the name of the program instruction to be called to store
            report result data on-chain.
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full flex gap-2 items-center pt-2 truncate">
            <span>Selected instruction:</span>
            <span className="truncate font-mono">{instructionName}</span>
          </div>
          <Form method="post" className="space-y-4" id="instruction-form">
            <Input type="hidden" name="intent" value={Intent.INSTRUCTION} />
            <div>
              <Label htmlFor="instructionName">Instruction name</Label>
              <Input name="instructionName" placeholder="instructionName" />
            </div>
            <Button type="submit">Submit</Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instruction arguments</CardTitle>
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
              {instructionArgs.map((arg, i) => (
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
          <CardTitle>Program Derived Address (PDA)</CardTitle>
          <div className="text-sm text-muted-foreground pt-2">
            Enter the name of the program PDA where the result will be stored.
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full flex gap-2 items-center pt-2 truncate">
            <span>PDA:</span>
            <span className="truncate font-mono">{instructionPDA}</span>
          </div>
          <Form method="post" className="space-y-4" id="instruction-form">
            <Input type="hidden" name="intent" value={Intent.PDA} />
            <div>
              <Label htmlFor="instructionPDA">PDA</Label>
              <Input name="instructionPDA" placeholder="instructionPDA" />
            </div>
            <Button type="submit">Submit</Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IDL</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 font-mono">
            <code>
              <pre>{idl && JSON.stringify(JSON.parse(idl), null, 2)}</pre>
            </code>
          </ScrollArea>
          <Form method="post" className="space-y-2 w-full" id="abi-form">
            <Input type="hidden" name="intent" value={Intent.IDL} />
            <div>
              <Label htmlFor="idl">New IDL</Label>
              <Textarea
                placeholder="Paste program's IDL here"
                className="font-mono"
                name="idl"
              />
            </div>
            <Button type="submit">Submit</Button>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}

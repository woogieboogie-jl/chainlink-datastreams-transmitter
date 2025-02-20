import { ActionFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData, useNavigate } from '@remix-run/react';
import { logger } from 'server/services/logger';
import {
  getAbi,
  getContractAddress,
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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { intent, ...data } = Object.fromEntries(formData);
  if (intent === Intent.CONTRACT) {
    const contract = (data as { contract: string }).contract;
    if (!isAddress(contract) || contract === zeroAddress) {
      logger.warn('⚠ Invalid contract address', { data });
      return null;
    }
    await setContractAddress(contract);
    logger.info(`📢 New contract has been set ${contract}`, { contract });
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
    await setAbi(abi);
    logger.info(`📢 New abi has been set`, { abi });
    return null;
  }
  if (intent === Intent.FUNCTION) {
    const functionName = (data as { functionName: string }).functionName;
    if (!functionName || functionName.length === 0) {
      logger.warn('⚠ Invalid functionName input', { data });
      return null;
    }
    await setFunctionName(functionName);
    logger.info(`📢 New function has been set ${functionName}`, {
      functionName,
    });
    return null;
  }
  if (intent === Intent.ARGS) {
    const args = (data as { args: string }).args;
    if (!args || args.length === 0) {
      logger.warn('⚠ Invalid args input', { data });
      return null;
    }
    const newArgs = args.split(',').map((a) => a.trim());
    await setFunctionArgs(newArgs);
    logger.info(`📢 New set of arguments has been set ${newArgs.join(', ')}`, {
      functionArgs: args,
    });

    return null;
  }

  return null;
}

export async function loader() {
  const [contract, abi, functionName, args] = await Promise.all([
    getContractAddress(),
    getAbi(),
    getFunctionName(),
    getFunctionArgs(),
  ]);
  return { contract, abi, functionName, args };
}

export default function Contract() {
  const navigate = useNavigate();
  const { contract, abi, functionName, args } = useLoaderData<typeof loader>();

  return (
    <>
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
            <span className="w-24">Selected function:</span>
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
              <li>feedId</li>
              <li>validFromTimestamp</li>
              <li>observationsTimestamp</li>
              <li>nativeFee</li>
              <li>linkFee</li>
              <li>expiresAt</li>
              <li>price</li>
              <li>bid</li>
              <li>ask</li>
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

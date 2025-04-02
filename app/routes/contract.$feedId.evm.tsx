import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import { Plus, Trash2Icon } from 'lucide-react';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { getCurrentChain } from 'server/services/client';
import { logger } from 'server/services/logger';
import {
  getAbi,
  getContractAddress,
  getFeedExists,
  getFunctionArgs,
  getFunctionName,
  setAbi,
  setContractAddress,
  setFunctionArgs,
  setFunctionName,
  getVm,
} from 'server/store';
import { printError } from 'server/utils';
import { isAddress, zeroAddress } from 'viem';
import { Button, buttonVariants } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Textarea } from '~/components/ui/textarea';
import { cn } from '~/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';

enum Intent {
  CONTRACT = 'CONTRACT',
  ABI = 'ABI',
  FUNCTION = 'FUNCTION',
  ARGS = 'ARGS',
}

const contractAddressSchema = z.object({
  contract: z
    .string()
    .refine(
      (a) => isAddress(a) && a !== zeroAddress,
      'Invalid contract address'
    ),
});
const functionNameSchema = z.object({ functionName: z.string() });
const functionArgsSchema = z.object({
  args: z.array(z.object({ name: z.string() })),
});
const contractABISchema = z.object({ abi: z.string() });

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
  switch (intent) {
    case Intent.CONTRACT: {
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
    case Intent.ABI: {
      const abi = (data as { abi: string }).abi;
      if (!abi) {
        logger.warn('⚠ Invalid abi input', { data });
        return null;
      }
      try {
        JSON.parse(abi);
      } catch (error) {
        logger.error(printError(error), error);
        console.error(error);
        return null;
      }
      await setAbi(feedId, chainId, abi);
      logger.info(
        `📢 New abi has been set on chain ${chainName} (${chainId})`,
        {
          abi,
        }
      );
      return null;
    }
    case Intent.FUNCTION: {
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
    case Intent.ARGS: {
      const argsStr = (data as { args: string }).args;
      const args: { name: string }[] = JSON.parse(argsStr);
      if (!args || args.length === 0) {
        logger.warn('⚠ Invalid args input', { data });
        return null;
      }
      const newArgs = args.map(({ name }) => name);
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
    default: {
      return null;
    }
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const vm = await getVm();
  if (vm === 'svm') {
    return redirect(`/contract/${params.feedId}/svm`);
  }
  const chain = await getCurrentChain();
  if (!chain || !chain.chainId) {
    throw new Response(null, {
      status: 400,
      statusText: 'Not connected to a chain',
    });
  }
  const chainId = `${chain.chainId}`;
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

  const [contract, abi, functionName, args] = await Promise.all([
    getContractAddress(feedId, chainId),
    getAbi(feedId, chainId),
    getFunctionName(feedId, chainId),
    getFunctionArgs(feedId, chainId),
  ]);
  return { contract, abi, functionName, args };
}

export default function ContractEVM() {
  const { contract, abi, functionName, args } = useLoaderData<typeof loader>();

  const submit = useSubmit();

  const contractAddressForm = useForm<z.infer<typeof contractAddressSchema>>({
    resolver: zodResolver(contractAddressSchema),
    defaultValues: {
      contract: '',
    },
  });
  function contractAddressOnSubmit(
    values: z.infer<typeof contractAddressSchema>
  ) {
    submit(
      { intent: Intent.CONTRACT, contract: values.contract },
      { method: 'post' }
    );
  }

  const functionNameForm = useForm<z.infer<typeof functionNameSchema>>({
    resolver: zodResolver(functionNameSchema),
    defaultValues: {
      functionName: '',
    },
  });
  function functionNameOnSubmit(values: z.infer<typeof functionNameSchema>) {
    submit(
      { intent: Intent.FUNCTION, functionName: values.functionName },
      { method: 'post' }
    );
  }

  const functionArgsForm = useForm<z.infer<typeof functionArgsSchema>>({
    resolver: zodResolver(functionArgsSchema),
    defaultValues: {
      args: [{ name: '' }],
    },
  });
  const {
    fields: argsFields,
    append: argsFieldAppend,
    remove: argsFieldRemove,
  } = useFieldArray({
    control: functionArgsForm.control,
    name: 'args',
  });
  function functionArgsOnSubmit(values: z.infer<typeof functionArgsSchema>) {
    submit(
      { intent: Intent.ARGS, args: JSON.stringify(values.args) },
      { method: 'post' }
    );
  }

  const contractABIForm = useForm<z.infer<typeof contractABISchema>>({
    resolver: zodResolver(contractABISchema),
    defaultValues: {
      abi: '',
    },
  });
  function contractABIOnSubmit(values: z.infer<typeof contractABISchema>) {
    submit({ intent: Intent.ABI, abi: values.abi }, { method: 'post' });
  }

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
          <Form {...contractAddressForm}>
            <form
              onSubmit={contractAddressForm.handleSubmit(
                contractAddressOnSubmit
              )}
              className="space-y-4"
            >
              <FormField
                control={contractAddressForm.control}
                name="contract"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
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
          <Form {...functionNameForm}>
            <form
              onSubmit={functionNameForm.handleSubmit(functionNameOnSubmit)}
              className="space-y-4"
            >
              <FormField
                control={functionNameForm.control}
                name="functionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Function name</FormLabel>
                    <FormControl>
                      <Input placeholder="functionName" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
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
          <Form {...functionArgsForm}>
            <form
              onSubmit={functionArgsForm.handleSubmit(functionArgsOnSubmit)}
              className="space-y-4"
            >
              {argsFields.map((field, index) => (
                <div
                  className="md:flex md:items-end md:space-x-2"
                  key={field.id}
                >
                  <FormField
                    control={functionArgsForm.control}
                    name={`args.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Argument</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter argument" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => argsFieldRemove(index)}
                  >
                    <Trash2Icon className="size-6" />
                  </Button>
                </div>
              ))}
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => argsFieldAppend({ name: '', type: 'string' })}
                >
                  Add <Plus className="size-6" />
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </form>
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
          <Form {...contractABIForm}>
            <form
              onSubmit={contractABIForm.handleSubmit(contractABIOnSubmit)}
              className="space-y-4 w-full"
            >
              <FormField
                control={contractABIForm.control}
                name="abi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New ABI</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste contract's ABI here"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
          {/* <Form method="post" className="space-y-2 w-full" id="abi-form">
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
          </Form> */}
        </CardContent>
      </Card>
    </>
  );
}

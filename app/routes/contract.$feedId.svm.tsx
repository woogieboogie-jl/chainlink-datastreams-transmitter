import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Plus, Trash2Icon } from 'lucide-react';

enum Intent {
  INSTRUCTION = 'INSTRUCTION',
  IDL = 'IDL',
  PDA = 'PDA',
  ARGS = 'ARGS',
}

const instructionNameSchema = z.object({
  instructionName: z.string(),
});
const instructionArgsSchema = z.object({
  args: z.array(
    z.object({ name: z.string(), type: z.enum(['number', 'string']) })
  ),
});
const instructionPDASchema = z.object({ instructionPDA: z.string() });
const instructionIDLSchema = z.object({ idl: z.string() });

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
      try {
        const argsStr = (data as { args: string }).args;
        const args: { name: string; type: string }[] = JSON.parse(argsStr);
        if (!args || args.length === 0) {
          logger.warn('⚠ Invalid args input', { data });
          return null;
        }
        await setInstructionArgs(
          feedId,
          cluster,
          args.map((arg) => JSON.stringify(arg))
        );
        logger.info(
          `📢 New set of arguments has been set ${args
            .map((a) => a.name)
            .join(', ')} on chain ${chainName} (${cluster})`,
          {
            functionArgs: args,
          }
        );

        return null;
      } catch (error) {
        logger.error(printError(error), error);
        console.error(error);
        return null;
      }
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
  const submit = useSubmit();

  const instructionNameForm = useForm<z.infer<typeof instructionNameSchema>>({
    resolver: zodResolver(instructionNameSchema),
    defaultValues: {
      instructionName: '',
    },
  });
  function instructionNameOnSubmit(
    values: z.infer<typeof instructionNameSchema>
  ) {
    submit(
      { intent: Intent.INSTRUCTION, instructionName: values.instructionName },
      { method: 'post' }
    );
  }

  const instructionArgsForm = useForm<z.infer<typeof instructionArgsSchema>>({
    resolver: zodResolver(instructionArgsSchema),
    defaultValues: {
      args: [{ name: '', type: 'string' }],
    },
  });
  const {
    fields: argsFields,
    append: argsFieldAppend,
    remove: argsFieldRemove,
  } = useFieldArray({
    control: instructionArgsForm.control,
    name: 'args',
  });
  function instructionArgsOnSubmit(
    values: z.infer<typeof instructionArgsSchema>
  ) {
    submit(
      { intent: Intent.ARGS, args: JSON.stringify(values.args) },
      { method: 'post' }
    );
  }

  const instructionPDAForm = useForm<z.infer<typeof instructionPDASchema>>({
    resolver: zodResolver(instructionPDASchema),
    defaultValues: {
      instructionPDA: '',
    },
  });
  function instructionPDAOnSubmit(
    values: z.infer<typeof instructionPDASchema>
  ) {
    submit(
      { intent: Intent.PDA, instructionPDA: values.instructionPDA },
      { method: 'post' }
    );
  }

  const instructionIDLForm = useForm<z.infer<typeof instructionIDLSchema>>({
    resolver: zodResolver(instructionIDLSchema),
    defaultValues: {
      idl: '',
    },
  });
  function instructionIDLOnSubmit(
    values: z.infer<typeof instructionIDLSchema>
  ) {
    submit({ intent: Intent.IDL, idl: values.idl }, { method: 'post' });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Instruction</CardTitle>
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
          <Form {...instructionNameForm}>
            <form
              onSubmit={instructionNameForm.handleSubmit(
                instructionNameOnSubmit
              )}
              className="space-y-4"
            >
              <FormField
                control={instructionNameForm.control}
                name="instructionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruction name</FormLabel>
                    <FormControl>
                      <Input placeholder="instructionName" {...field} />
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
          <CardTitle>Instruction arguments</CardTitle>
          <div className="text-sm text-muted-foreground pt-2">
            Enter report arguments field names and their type (number or string)
            in the sequense the program instruction expects them to be passed.
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
          <Form {...instructionArgsForm}>
            <form
              onSubmit={instructionArgsForm.handleSubmit(
                instructionArgsOnSubmit
              )}
              className="space-y-4"
            >
              {argsFields.map((field, index) => (
                <div
                  className="md:flex md:items-end md:space-x-2"
                  key={field.id}
                >
                  <FormField
                    control={instructionArgsForm.control}
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
                  <FormField
                    control={instructionArgsForm.control}
                    name={`args.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Input placeholder="string | number" {...field} />
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
          <Form {...instructionPDAForm}>
            <form
              onSubmit={instructionPDAForm.handleSubmit(instructionPDAOnSubmit)}
              className="space-y-4"
            >
              <FormField
                control={instructionPDAForm.control}
                name="instructionPDA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PDA</FormLabel>
                    <FormControl>
                      <Input placeholder="instructionPDA" {...field} />
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
          <CardTitle>IDL</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 font-mono">
            <code>
              <pre>{idl && JSON.stringify(JSON.parse(idl), null, 2)}</pre>
            </code>
          </ScrollArea>
          <Form {...instructionIDLForm}>
            <form
              onSubmit={instructionIDLForm.handleSubmit(instructionIDLOnSubmit)}
              className="space-y-4 w-full"
            >
              <FormField
                control={instructionIDLForm.control}
                name="idl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New IDL</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste program's IDL here"
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
        </CardContent>
      </Card>
    </>
  );
}

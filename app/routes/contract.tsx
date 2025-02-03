import { ActionFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import {
  fetchAbi,
  fetchFunctionArgs,
  fetchFunctionName,
  setAbi,
  setFunctionArgs,
  setFunctionName,
} from '~/api';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Textarea } from '~/components/ui/textarea';

enum Intent {
  ABI = 'ABI',
  FUNCTION = 'FUNCTION',
  ARGS = 'ARGS',
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { intent, ...data } = Object.fromEntries(formData);
  if (intent === Intent.ABI) return await setAbi(data as { abi: string });
  if (intent === Intent.FUNCTION)
    return await setFunctionName(data as { functionName: string });
  if (intent === Intent.ARGS)
    return await setFunctionArgs(data as { args: string });
  return null;
}

export async function loader() {
  const [abi, functionName, args] = await Promise.all([
    fetchAbi(),
    fetchFunctionName(),
    fetchFunctionArgs(),
  ]);
  return { abi, functionName, args };
}

export default function Contract() {
  const { abi, functionName, args } = useLoaderData<typeof loader>();

  return (
    <>
      <Form method="post" className="space-y-2 w-full" id="abi-form">
        <Input type="hidden" name="intent" value={Intent.ABI} />
        <div className="space-y-4">
          <Label htmlFor="abi">ABI</Label>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 font-mono">
            <code>
              <pre>{JSON.stringify(JSON.parse(abi.abi), null, 2)}</pre>
            </code>
          </ScrollArea>
          <Textarea
            placeholder="Paste contract's ABI here"
            className="font-mono"
            name="abi"
          />
        </div>
        <Button type="submit">Submit</Button>
      </Form>
      <Form method="post" className="space-y-2 w-full" id="function-form">
        <Input type="hidden" name="intent" value={Intent.FUNCTION} />
        <div className="space-y-4">
          <Label htmlFor="function">Function name</Label>
          <code>
            <pre>{functionName.functionName}</pre>
          </code>
          <Input name="functionName" placeholder="functionName" />
        </div>
        <Button type="submit">Submit</Button>
      </Form>
      <Form method="post" className="space-y-2 w-full" id="args-form">
        <Input type="hidden" name="intent" value={Intent.ARGS} />
        <div className="space-y-4">
          <Label htmlFor="args">Args</Label>
          <code>
            <pre>{args.functionArgs.join(', ')}</pre>
          </code>
          <Input name="args" placeholder="Enter arguments " />
          <div className="text-sm text-muted-foreground">
            Enter arguments names in the sequense the contract expects,
            separated by comma &#40;, &#41;
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
          </div>
        </div>
        <Button type="submit">Submit</Button>
      </Form>
    </>
  );
}

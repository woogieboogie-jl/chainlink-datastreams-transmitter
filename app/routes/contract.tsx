import { ActionFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData, useNavigate } from '@remix-run/react';
import {
  fetchAbi,
  fetchContractAddress,
  fetchFunctionArgs,
  fetchFunctionName,
  setAbi,
  setContractAddress,
  setFunctionArgs,
  setFunctionName,
} from '~/api';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Textarea } from '~/components/ui/textarea';

enum Intent {
  CONTRACT = 'CONTRACT',
  ABI = 'ABI',
  FUNCTION = 'FUNCTION',
  ARGS = 'ARGS',
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { intent, ...data } = Object.fromEntries(formData);
  if (intent === Intent.CONTRACT)
    return await setContractAddress(data as { contract: string });
  if (intent === Intent.ABI) return await setAbi(data as { abi: string });
  if (intent === Intent.FUNCTION)
    return await setFunctionName(data as { functionName: string });
  if (intent === Intent.ARGS)
    return await setFunctionArgs(data as { args: string });
  return null;
}

export async function loader() {
  const [contract, abi, functionName, args] = await Promise.all([
    fetchContractAddress(),
    fetchAbi(),
    fetchFunctionName(),
    fetchFunctionArgs(),
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
            <span className="truncate font-mono">{contract.contract}</span>
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
        </CardHeader>
        <CardContent>
          <div className="w-full flex gap-2 items-center pt-2 truncate">
            <span className="w-24">Method:</span>
            <span className="truncate font-mono">
              {functionName.functionName}
            </span>
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
        </CardHeader>
        <CardContent>
          <div>
            Arguments:
            <br />
            <ul className="list-disc list-inside font-mono">
              {args.functionArgs.map((arg, i) => (
                <li key={i}>{arg}</li>
              ))}
            </ul>
          </div>
          <Form method="post" className="space-y-2 w-full" id="args-form">
            <Input type="hidden" name="intent" value={Intent.ARGS} />
            <div>
              <Label htmlFor="args">Args</Label>
              <Input name="args" placeholder="Enter arguments " />
              <div className="text-sm text-muted-foreground pt-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ABI</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 font-mono">
            <code>
              <pre>{JSON.stringify(JSON.parse(abi.abi), null, 2)}</pre>
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

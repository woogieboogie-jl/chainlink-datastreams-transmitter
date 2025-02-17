import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { Form, useNavigate } from '@remix-run/react';
import { addChain } from '~/api';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const chain = {
    id: Number(data.id),
    name: data.name,
    nativeCurrency: {
      decimals: Number(data.currencyDecimals),
      name: data.currencyName,
      symbol: data.currencySymbol,
    },
    rpcUrls: {
      default: { http: [data.rpc] },
    },
    testnet: data.testnet,
  };
  await addChain(chain);
  return redirect('/chain');
}

export default function NewChain() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add new chain</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" className="space-y-4" id="add-chain-form">
          <div>
            <Label htmlFor="id">Chain ID</Label>
            <Input name="id" />
          </div>
          <div>
            <Label htmlFor="name">Chain name</Label>
            <Input name="name" />
          </div>
          <p>Native currency</p>
          <div>
            <Label htmlFor="currencyName">Native currency name</Label>
            <Input name="currencyName" />
          </div>
          <div>
            <Label htmlFor="currencySymbol">Native currency symbol</Label>
            <Input name="currencySymbol" />
          </div>
          <div>
            <Label htmlFor="currencyDecimals">Native currency decimals</Label>
            <Input name="currencyDecimals" />
          </div>
          <div>
            <Label htmlFor="rpc">RPC URL</Label>
            <Input name="rpc" />
          </div>
          <div>
            <Label htmlFor="testnet">Testnet</Label>
            <Input name="testnet" />
          </div>
          <div className="space-x-4">
            <Button type="submit">Submit</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

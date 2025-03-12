import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { Form, useNavigate } from '@remix-run/react';
import { logger } from 'server/services/logger';
import { addSolanaChain } from 'server/store';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const chain = Object.fromEntries(formData) as unknown as {
    cluster: string;
    name: string;
    rpcUrl: string;
    testnet: boolean;
  };

  try {
    if (!chain) {
      logger.warn('⚠ Invalid chain input', { chain });
      return null;
    }
    if (!chain.cluster) {
      logger.warn('⚠ Invalid chain cluster', { chain });
      return null;
    }
    if (!chain.name) {
      logger.warn('⚠ Chain name is missing', { chain });
      return null;
    }
    if (!chain.rpcUrl) {
      logger.warn('⚠ RPC URL is missing', { chain });
      return null;
    }

    await addSolanaChain(chain.cluster, JSON.stringify(chain));
    logger.info(`📢 New chain has been added`, { chain });
    return redirect('/chain/switch');
  } catch (error) {
    logger.error('ERROR', error);
    return null;
  }
}

export default function NewSVMChain() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add new SVM chain</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" className="space-y-4" id="add-chain-form">
          <div>
            <Label htmlFor="cluster">Cluster</Label>
            <Input name="cluster" />
          </div>
          <div>
            <Label htmlFor="name">Chain name</Label>
            <Input name="name" />
          </div>
          <div>
            <Label htmlFor="rpcUrl">RPC URL</Label>
            <Input name="rpcUrl" />
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

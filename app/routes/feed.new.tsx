import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { Form, useNavigate } from '@remix-run/react';
import { Feed } from 'server/types';
import { addFeed } from '~/api';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const feed = Object.fromEntries(formData) as Feed;
  await addFeed(feed);
  return redirect('/');
}

export default function NewFeed() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add new data stream</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" className="space-y-4" id="add-feed-form">
          <div>
            <Label htmlFor="name">Stream name</Label>
            <Input name="name" placeholder="ETH/USD" />
          </div>
          <div>
            <Label htmlFor="feedId">Feed ID</Label>
            <Input name="feedId" placeholder="0x000..." />
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

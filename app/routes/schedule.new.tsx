import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { Form, useLoaderData, useNavigate } from '@remix-run/react';
import { getInterval } from 'server/store';
import { Interval } from 'server/types';
import { setInterval } from '~/api';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData) as Interval;
  await setInterval(data);
  return redirect('/');
}

export async function loader() {
  return await getInterval();
}

export default function Schedule() {
  const navigate = useNavigate();
  const interval = useLoaderData<typeof loader>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>New schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Pattern: <strong>{interval}</strong>
        </p>
        <Form method="post" className="space-y-4" id="interval-form">
          <div>
            <Label htmlFor="name">Cron pattern</Label>
            <Input name="interval" placeholder="* * * * * *" />
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

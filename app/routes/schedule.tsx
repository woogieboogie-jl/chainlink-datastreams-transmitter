import { ActionFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { Interval } from 'server/types';
import { fetchInterval, setInterval } from '~/api';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const interval = Object.fromEntries(formData) as Interval;
  return await setInterval(interval);
}

export async function loader() {
  return await fetchInterval();
}

export default function Schedule() {
  const interval = useLoaderData<typeof loader>();
  return (
    <>
      <p>
        Schedule pattern: <span className="font-bold">{interval.interval}</span>
      </p>
      <Form method="post" className="space-y-2" id="interval-form">
        <div>
          <Label htmlFor="name">New schedule cron pattern</Label>
          <Input name="interval" placeholder="* * * * * *" />
        </div>
        <Button type="submit">Submit</Button>
      </Form>
    </>
  );
}

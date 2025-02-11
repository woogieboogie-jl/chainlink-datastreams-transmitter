import { ActionFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData, useSubmit } from '@remix-run/react';
import { Interval } from 'server/types';
import { formatEther } from 'viem';
import {
  fetchInterval,
  fetchPriceDelta,
  setInterval,
  setPriceDelta,
  startStreams,
  stopStreams,
} from '~/api';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

enum Intent {
  START = 'START',
  STOP = 'STOP',
  SET = 'SET',
  DELTA = 'DELTA',
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { intent, ...data } = Object.fromEntries(formData);
  if (intent === Intent.SET) return await setInterval(data as Interval);
  if (intent === Intent.START) return await startStreams();
  if (intent === Intent.STOP) return await stopStreams();
  if (intent === Intent.DELTA)
    return await setPriceDelta(data as { priceDelta: string });
  return null;
}

export async function loader() {
  const [interval, priceDelta] = await Promise.all([
    fetchInterval(),
    fetchPriceDelta(),
  ]);
  return { interval, priceDelta };
}

export default function Schedule() {
  const { interval, priceDelta } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  return (
    <>
      <p>
        Schedule pattern: <span className="font-bold">{interval.interval}</span>
      </p>
      <Form method="post" className="space-y-2" id="interval-form">
        <div>
          <Input type="hidden" name="intent" value={Intent.SET} />
          <Label htmlFor="name">New schedule cron pattern</Label>
          <Input name="interval" placeholder="* * * * * *" />
        </div>
        <Button type="submit">Submit</Button>
      </Form>
      <div className="flex space-x-4">
        <Button
          onClick={() => submit({ intent: Intent.START }, { method: 'post' })}
        >
          Start
        </Button>
        <Button
          onClick={() => submit({ intent: Intent.STOP }, { method: 'post' })}
        >
          Stop
        </Button>
      </div>
      <p>
        Price delta:{' '}
        <span className="font-bold">{`${priceDelta.priceDelta} (${formatEther(
          BigInt(priceDelta.priceDelta)
        )})`}</span>
      </p>
      <Form method="post" className="space-y-2" id="delta-form">
        <div>
          <Input type="hidden" name="intent" value={Intent.DELTA} />
          <Label htmlFor="priceDelta">New price delta</Label>
          <Input name="priceDelta" />
        </div>
        <Button type="submit">Submit</Button>
      </Form>
    </>
  );
}

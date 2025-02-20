import { ActionFunctionArgs, redirect } from '@remix-run/node';
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useSubmit,
} from '@remix-run/react';
import { CronExpressionParser } from 'cron-parser';
import { useEffect, useState } from 'react';
import { getInterval } from 'server/store';
import { Interval } from 'server/types';
import { setInterval } from '~/api';
import { Button, buttonVariants } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData) as Interval;
  const result = await setInterval(data);
  if (result.ok) return redirect('/');
  return (await result.json()) as { warning: string };
}

export async function loader() {
  return await getInterval();
}

export default function Schedule() {
  const navigate = useNavigate();
  const interval = useLoaderData<typeof loader>();
  const warning = useActionData<typeof action>();

  const submit = useSubmit();

  const [intervalInput, setIntervalInput] = useState('');
  const [nextThree, setNextThree] = useState<string[]>([]);

  useEffect(() => {
    if (!intervalInput) {
      setNextThree([]);
      return;
    }
    try {
      const interval = CronExpressionParser.parse(intervalInput);

      setNextThree(interval.take(3).map((date) => date.toString()));
    } catch (err) {
      setNextThree([]);
    }
  }, [intervalInput]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>New schedule</CardTitle>
        <CardDescription>
          Set the interval to check for price changes and write it on-chain. It
          is represented as a cron expression with granularity in seconds. You
          can use tools like{' '}
          <a
            href="https://crontab.guru/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'link' }), 'p-0 h-auto')}
          >
            crontab guru
          </a>{' '}
          to build the expression.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Current active pattern: <strong>{interval}</strong>
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="interval">Set new cron pattern:</Label>
            <Input
              name="interval"
              placeholder="* * * * *"
              value={intervalInput}
              onChange={(e) => setIntervalInput(e.target.value)}
            />
            {warning?.warning && (
              <p className="text-sm font-medium text-destructive">
                {warning.warning}
              </p>
            )}
          </div>
          {nextThree.length > 0 && (
            <div className="text-muted-foreground italic">
              <p className="font-semibold">Next three execution dates:</p>
              {nextThree.map((n, i) => (
                <p key={i}>{n}</p>
              ))}
            </div>
          )}
          <div className="space-x-4">
            <Button
              type="submit"
              disabled={nextThree.length < 1}
              onClick={() => {
                submit({ interval: intervalInput }, { method: 'post' });
              }}
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

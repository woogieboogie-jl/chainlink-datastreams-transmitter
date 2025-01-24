import { ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, Form, useSubmit } from '@remix-run/react';
import { Trash2Icon } from 'lucide-react';
import { addFeed, fetchFeeds, removeFeed } from '~/api';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Feed } from '~/types';

enum Intent {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { intent, ...feed } = Object.fromEntries(formData) as Feed & {
    intent: Intent;
  };
  if (intent === Intent.ADD) return await addFeed(feed);
  if (intent === Intent.REMOVE) return await removeFeed(feed);
  return null;
}

export async function loader() {
  return await fetchFeeds();
}

export default function Feeds() {
  const feeds = useLoaderData<typeof loader>();
  const submit = useSubmit();

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Stream</TableHead>
            <TableHead>Feed ID</TableHead>
            <TableHead>Remove</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeds.map((feed, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{feed.name}</TableCell>
              <TableCell>{feed.feedId}</TableCell>
              <TableCell>
                <Button
                  onClick={() =>
                    submit(
                      { intent: Intent.REMOVE, feedId: feed.feedId },
                      { method: 'post' }
                    )
                  }
                  size="icon"
                  variant="ghost"
                >
                  <Trash2Icon className="size-6" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Form method="post" className="space-y-2" id="add-form">
        <Input type="hidden" name="intent" value={Intent.ADD} />
        <div>
          <Label htmlFor="name">Stream name</Label>
          <Input name="name" placeholder="ETH/USD" />
        </div>
        <div>
          <Label htmlFor="feedId">Feed ID</Label>
          <Input name="feedId" placeholder="0x000..." />
        </div>
        <Button type="submit">Submit</Button>
      </Form>
    </>
  );
}

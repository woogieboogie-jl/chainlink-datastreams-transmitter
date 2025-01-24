import { useLoaderData } from '@remix-run/react';
import { fetchFeeds, fetchInterval } from '~/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';

export async function loader() {
  const [feeds, interval] = await Promise.all([fetchFeeds(), fetchInterval()]);
  return { feeds, interval };
}

export default function Index() {
  const { feeds, interval } = useLoaderData<typeof loader>();

  return (
    <>
      <p>
        Schedule patern: <span className="font-bold">{interval.interval}</span>
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Stream</TableHead>
            <TableHead>Feed ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeds.map((feed, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{feed.name}</TableCell>
              <TableCell>{feed.feedId}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

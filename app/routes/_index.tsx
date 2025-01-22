import { type MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

const url = process.env.API_URL || 'http://localhost:3000';

export const loader = async () => {
  const result = await fetch(`${url}/feeds`);
  const data: { name: string; feedId: string }[] = await result.json();
  return data;
};

export const meta: MetaFunction = () => {
  return [
    { title: 'Datastreams Scheduler' },
    { name: 'description', content: 'Chainlink Datastreams Scheduler' },
  ];
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex h-screen flex-col items-center p-4">
      <header>
        <h1 className="leading text-2xl font-bold">Datastreams Scheduler</h1>
      </header>
    </div>
  );
}

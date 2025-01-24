import { useLoaderData, useRevalidator } from '@remix-run/react';
import { useEffect } from 'react';
import { fetchLogs } from '~/api';
import ClientOnly from '~/components/client-only';
import { Logger } from '~/components/logger.client';

export async function loader() {
  return await fetchLogs();
}

export default function Feeds() {
  const data = useLoaderData<typeof loader>();

  const revalidator = useRevalidator();

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (revalidator.state === 'idle') {
        revalidator.revalidate();
      }
    }, 5000);
    return () => {
      clearInterval(intervalId);
    };
  }, [revalidator]);

  return (
    <div className="w-full h-[calc(100vh_-_100px)]">
      <ClientOnly>
        <Logger text={data?.log} />
      </ClientOnly>
    </div>
  );
}

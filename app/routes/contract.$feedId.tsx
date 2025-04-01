import { LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, useLoaderData, useNavigate } from '@remix-run/react';
import { getCurrentChain } from 'server/services/client';
import { getFeedExists, getFeedName } from 'server/store';
import { Button } from '~/components/ui/button';

export async function loader({ params }: LoaderFunctionArgs) {
  const chain = await getCurrentChain();
  if (!chain || !chain.chainId) {
    throw new Response(null, {
      status: 400,
      statusText: 'Not connected to a chain',
    });
  }
  const chainId = `${chain.chainId}`;
  const chainName = chain.name;
  const feedId = params.feedId;
  if (!feedId) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    });
  }
  const isValidFeedId = await getFeedExists(feedId);
  if (!isValidFeedId) {
    throw new Response(null, {
      status: 404,
      statusText: `Feed ${feedId} not found`,
    });
  }

  const feedName = await getFeedName(feedId);
  return { feedName, chainName, chainId };
}

export default function Contract() {
  const navigate = useNavigate();
  const { feedName, chainName, chainId } = useLoaderData<typeof loader>();

  return (
    <>
      <h1 className="leading text-2xl font-semibold">
        {`Feed ${feedName} settings on chain ${chainName} (${chainId})`}
      </h1>
      <Outlet />

      <Button
        type="button"
        variant="secondary"
        onClick={() => navigate(-1)}
        className="w-fit"
      >
        Back
      </Button>
    </>
  );
}

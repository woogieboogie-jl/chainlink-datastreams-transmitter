import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { Feed } from 'server/types';
import { removeFeed } from '~/api';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const feed = Object.fromEntries(formData) as Feed;
  await removeFeed(feed);
  return redirect('/');
}

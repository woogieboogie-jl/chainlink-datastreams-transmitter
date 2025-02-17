import { redirect } from '@remix-run/node';
import { stopStreams } from '~/api';

export async function action() {
  await stopStreams();
  return redirect('/');
}

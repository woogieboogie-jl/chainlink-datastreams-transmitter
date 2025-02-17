import { redirect } from '@remix-run/node';
import { startStreams } from '~/api';

export async function action() {
  await startStreams();
  return redirect('/');
}

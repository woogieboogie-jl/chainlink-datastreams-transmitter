import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { setGasCap } from '~/api';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData) as { gasCap: string };
  await setGasCap(data);
  return redirect('/');
}

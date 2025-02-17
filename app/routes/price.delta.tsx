import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { parseEther } from 'viem';
import { setPriceDelta } from '~/api';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData) as { priceDelta: string };
  await setPriceDelta({
    priceDelta: parseEther(data.priceDelta).toString(),
  });
  return redirect('/');
}

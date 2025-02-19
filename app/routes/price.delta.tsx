import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { logger } from 'server/services/logger';
import { setPriceDelta } from 'server/store';
import { parseEther } from 'viem';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData) as { priceDelta: string };
  const priceDelta = data.priceDelta;
  if (!priceDelta || isNaN(Number(priceDelta))) {
    logger.warn('⚠ Invalid price delta input', { data });
    return redirect('/');
  }
  await setPriceDelta(parseEther(data.priceDelta).toString());
  logger.info(`📢 New price delta has been set ${priceDelta}`, {
    priceDelta,
  });

  return redirect('/');
}

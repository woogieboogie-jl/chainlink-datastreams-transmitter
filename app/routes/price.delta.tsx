import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { logger } from 'server/services/logger';
import { setPriceDelta } from 'server/store';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData) as { priceDelta: string };
  const priceDelta = data.priceDelta;
  if (
    !priceDelta ||
    isNaN(Number(priceDelta)) ||
    Number(priceDelta) < 0 ||
    Number(priceDelta) === Number.POSITIVE_INFINITY
  ) {
    logger.warn('⚠ Invalid price delta input', { data });
    return redirect('/');
  }
  await setPriceDelta(data.priceDelta);
  logger.info(`📢 New price delta has been set ${priceDelta}%`, {
    priceDelta,
  });

  return redirect('/');
}

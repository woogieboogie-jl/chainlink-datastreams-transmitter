import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { logger } from 'server/services/logger';
import { setGasCap } from 'server/store';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData) as { gasCap: string };
  const gasCap = data.gasCap;
  if (
    isNaN(Number(gasCap)) ||
    Number(gasCap) < 0 ||
    Number(gasCap) === Number.POSITIVE_INFINITY
  ) {
    logger.warn('⚠ Invalid gas cap', { data });
    return redirect('/');
  }
  await setGasCap(gasCap);
  logger.info(`📢 New gas cap has been set ${gasCap}`, { gasCap });
  return redirect('/');
}

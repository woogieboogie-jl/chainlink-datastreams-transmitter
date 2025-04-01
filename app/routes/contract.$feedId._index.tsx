import { redirect } from '@remix-run/node';
import { getVm } from 'server/store';

export async function loader() {
  const vm = await getVm();
  return redirect(vm);
}

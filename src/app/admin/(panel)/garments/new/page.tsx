import { listGarmentLocations } from '@/lib/actions/admin';
import NewGarmentForm from './NewGarmentForm';
import { requireAdminPagePermission } from '@/lib/admin-auth-server';

export default async function NewGarmentPage() {
  await requireAdminPagePermission('garments:write');
  const locations = await listGarmentLocations();
  return <NewGarmentForm locations={locations} />;
}

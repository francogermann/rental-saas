import { listGarmentLocations } from '@/lib/actions/admin';
import NewGarmentForm from './NewGarmentForm';

export default async function NewGarmentPage() {
  const locations = await listGarmentLocations();
  return <NewGarmentForm locations={locations} />;
}

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { searchAvailableGarments } from '@/lib/actions/availability';
import CatalogClient from './CatalogClient';
import { createAdminClient } from '@/lib/supabase/server';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin.from('organizations').select('id').eq('slug', 'maison-demo').single();

  if (orgErr || !org) {
    return <div className="p-8 text-center text-muted-foreground">Tienda no disponible.</div>;
  }

  const { data: locRows } = await admin
    .from('locations')
    .select('id, name, address_line')
    .eq('organization_id', org.id)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const locations = locRows ?? [];
  if (locations.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No hay sedes configuradas.</div>;
  }

  const pickupDate =
    typeof searchParams.pickupDate === 'string' ? searchParams.pickupDate : new Date().toISOString().split('T')[0];
  const returnDate =
    typeof searchParams.returnDate === 'string'
      ? searchParams.returnDate
      : new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const rawLoc = typeof searchParams.pickupLocationId === 'string' ? searchParams.pickupLocationId.trim() : '';
  const defaultLocId = locations[0].id;

  if (!z.string().uuid().safeParse(rawLoc).success || !locations.some((l) => l.id === rawLoc)) {
    redirect(`/catalog?pickupLocationId=${defaultLocId}&pickupDate=${pickupDate}&returnDate=${returnDate}`);
  }

  const pickupLocationId = rawLoc;

  const { data: garments, error } = await searchAvailableGarments({
    pickupDate,
    returnDate,
    pickupLocationId,
    limit: 50,
  });

  return (
    <div className="min-h-screen">
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(315_100%_60%/.12),transparent_50%)]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-fuchsia-400 via-pink-300 to-purple-400 bg-clip-text text-transparent">
            Nuestra Colección
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Vestidos de fiesta, graduación, casamiento y gala. Encontrá el tuyo y reservalo sin agenda previa.
          </p>
        </div>
      </section>

      <CatalogClient
        garments={garments ?? []}
        error={error}
        initialPickupDate={pickupDate}
        initialReturnDate={returnDate}
        locations={locations}
        pickupLocationId={pickupLocationId}
      />
    </div>
  );
}

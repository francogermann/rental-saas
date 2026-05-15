import Link from 'next/link';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { GarmentInventoryFilter } from './GarmentInventoryFilter';
import { ManualReservationForm } from './ManualReservationForm';
import { requireAdminPagePermission } from '@/lib/admin-auth-server';

export const dynamic = 'force-dynamic';

function addDaysIso(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default async function AdminNewReservationPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAdminPagePermission('reservations:write');
  const supabase = createAdminClient();
  const { data: org, error: orgErr } = await supabase.from('organizations').select('id').eq('slug', 'maison-demo').single();

  if (orgErr || !org) {
    return <div className="p-4 sm:p-6 lg:p-8 text-red-400">No se encontró la organización demo.</div>;
  }

  const { data: locRows } = await supabase
    .from('locations')
    .select('id, name, address_line')
    .eq('organization_id', org.id)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const locations = locRows ?? [];
  const defaultLocId = locations[0]?.id ?? '';

  if (locations.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto text-center text-muted-foreground">
        No hay sedes configuradas en la organización. Configurá sedes antes de crear reservas manuales.
      </div>
    );
  }

  const scopeAll = typeof searchParams.garment_scope === 'string' && searchParams.garment_scope === 'all';
  const rawGl = typeof searchParams.garment_location_id === 'string' ? searchParams.garment_location_id.trim() : '';
  const garmentLocId =
    !scopeAll && z.string().uuid().safeParse(rawGl).success && locations.some((l) => l.id === rawGl)
      ? rawGl
      : defaultLocId;

  const customersQuery = supabase
    .from('customers')
    .select('id, first_name, last_name, email')
    .eq('organization_id', org.id)
    .is('deleted_at', null)
    .order('last_name', { ascending: true })
    .limit(200);

  let garmentsQuery = supabase
    .from('garments')
    .select(
      `
      id,
      name,
      sku,
      rental_price,
      deposit_amount,
      photos_urls,
      location_id,
      locations!garments_location_id_fkey ( name )
    `,
    )
    .eq('organization_id', org.id)
    .is('deleted_at', null)
    .eq('operative_status', 'available')
    .order('name', { ascending: true })
    .limit(500);

  if (!scopeAll && garmentLocId) {
    garmentsQuery = garmentsQuery.eq('location_id', garmentLocId);
  }

  const [{ data: customers, error: cErr }, { data: garments, error: gErr }] = await Promise.all([
    customersQuery,
    garmentsQuery,
  ]);

  if (cErr || gErr) {
    return <div className="p-4 sm:p-6 lg:p-8 text-red-400">Error cargando datos: {cErr?.message || gErr?.message}</div>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const defaultPickup = today;
  const defaultReturn = addDaysIso(today, 3);
  const defaultEvent = defaultPickup;

  const garmentOptions = (garments ?? []).map((g) => {
    const row = g as {
      id: string;
      name: string;
      sku: string;
      rental_price: number | null;
      deposit_amount: number;
      photos_urls: string[] | null;
      location_id: string | null;
      locations: { name: string } | null;
    };
    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      rental_price: row.rental_price ?? 0,
      deposit_amount: row.deposit_amount ?? 0,
      photos_urls: (row.photos_urls ?? []) as string[],
      location_id: row.location_id,
      location_name: row.locations?.name ?? null,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-admin-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Nueva reserva manual</h1>
          <p className="text-muted-foreground mt-1">Alta operativa sin cobro online (Mercado Pago).</p>
        </div>
        <Link
          href="/admin/reservations"
          className="text-sm text-fuchsia-400 hover:text-fuchsia-300 font-semibold whitespace-nowrap"
        >
          ← Volver a reservas
        </Link>
      </div>

      <GarmentInventoryFilter scopeAll={scopeAll} garmentLocId={garmentLocId} locations={locations} />

      {scopeAll ? (
        <p className="text-xs text-amber-200/90 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          Estás viendo prendas de <span className="font-semibold">todas las sedes</span>. En checkout público solo se
          listan prendas de la sede elegida; acá podés pactar retiro en otra sede usando los campos de abajo.
        </p>
      ) : null}

      <ManualReservationForm
        garments={garmentOptions}
        customers={customers ?? []}
        locations={locations}
        defaultPickup={defaultPickup}
        defaultReturn={defaultReturn}
        defaultEvent={defaultEvent}
      />

      <p className="text-xs text-muted-foreground">
        Arriba elegís sede e inventario del listado (se actualiza al cambiar). En Clienta y Prenda usá Buscar para
        filtrar por nombre, email o SKU (hasta 200 clientas y 500 prendas cargadas).
      </p>
    </div>
  );
}

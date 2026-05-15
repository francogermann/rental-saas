import Link from 'next/link';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { ManualReservationForm } from './ManualReservationForm';
import { requireAdminPagePermission } from '@/lib/admin-auth-server';

export const dynamic = 'force-dynamic';

function addDaysIso(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
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

  const customerQ = typeof searchParams.customer_q === 'string' ? searchParams.customer_q.trim() : '';
  const garmentQ = typeof searchParams.garment_q === 'string' ? searchParams.garment_q.trim() : '';

  let customersQuery = supabase
    .from('customers')
    .select('id, first_name, last_name, email')
    .eq('organization_id', org.id)
    .is('deleted_at', null)
    .order('last_name', { ascending: true })
    .limit(200);

  if (customerQ.length > 0) {
    const pat = `%${escapeIlikePattern(customerQ)}%`;
    customersQuery = customersQuery.or(`first_name.ilike.${pat},last_name.ilike.${pat},email.ilike.${pat}`);
  }

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

  if (garmentQ.length > 0) {
    const pat = `%${escapeIlikePattern(garmentQ)}%`;
    garmentsQuery = garmentsQuery.or(`name.ilike.${pat},sku.ilike.${pat}`);
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

  const clearSearchHref = (() => {
    const p = new URLSearchParams();
    if (scopeAll) p.set('garment_scope', 'all');
    else if (garmentLocId) p.set('garment_location_id', garmentLocId);
    const qs = p.toString();
    return qs ? `/admin/reservations/new?${qs}` : '/admin/reservations/new';
  })();

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

      <form method="GET" className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full min-w-[200px] space-y-1 sm:max-w-xs">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Inventario listado</label>
          <select
            name="garment_scope"
            defaultValue={scopeAll ? 'all' : ''}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          >
            <option value="">Solo sede seleccionada</option>
            <option value="all">Todas las sedes</option>
          </select>
        </div>

        {!scopeAll ? (
          <div className="w-full min-w-[200px] space-y-1 sm:max-w-xs">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Sede (prendas)</label>
            <select
              name="garment_location_id"
              defaultValue={garmentLocId}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="flex-1 min-w-[160px] space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Buscar clienta</label>
          <input
            type="search"
            name="customer_q"
            defaultValue={customerQ}
            placeholder="Nombre o email"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[160px] space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Buscar prenda</label>
          <input
            type="search"
            name="garment_q"
            defaultValue={garmentQ}
            placeholder="Nombre o SKU"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium hover:bg-white/[0.1]"
        >
          Aplicar filtros
        </button>
        {customerQ || garmentQ ? (
          <Link
            href={clearSearchHref}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Limpiar búsqueda
          </Link>
        ) : null}
      </form>

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
        Listas cargadas con hasta 500 prendas disponibles y 200 clientas; podés filtrar arriba o buscar en vivo en el
        formulario.
      </p>
    </div>
  );
}

import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { ManualReservationForm } from './ManualReservationForm';

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
  const supabase = createAdminClient();
  const { data: org, error: orgErr } = await supabase.from('organizations').select('id').eq('slug', 'maison-demo').single();

  if (orgErr || !org) {
    return <div className="p-8 text-red-400">No se encontró la organización demo.</div>;
  }

  const customerQ = typeof searchParams.customer_q === 'string' ? searchParams.customer_q.trim() : '';
  const garmentQ = typeof searchParams.garment_q === 'string' ? searchParams.garment_q.trim() : '';

  let customersQuery = supabase
    .from('customers')
    .select('id, first_name, last_name, email')
    .eq('organization_id', org.id)
    .order('last_name', { ascending: true })
    .limit(200);

  if (customerQ.length > 0) {
    const pat = `%${escapeIlikePattern(customerQ)}%`;
    customersQuery = customersQuery.or(
      `first_name.ilike.${pat},last_name.ilike.${pat},email.ilike.${pat}`,
    );
  }

  let garmentsQuery = supabase
    .from('garments')
    .select('id, name, sku, rental_price, deposit_amount')
    .eq('organization_id', org.id)
    .eq('operative_status', 'available')
    .order('name', { ascending: true })
    .limit(200);

  if (garmentQ.length > 0) {
    const pat = `%${escapeIlikePattern(garmentQ)}%`;
    garmentsQuery = garmentsQuery.or(`name.ilike.${pat},sku.ilike.${pat}`);
  }

  const [{ data: customers, error: cErr }, { data: garments, error: gErr }] = await Promise.all([
    customersQuery,
    garmentsQuery,
  ]);

  if (cErr || gErr) {
    return (
      <div className="p-8 text-red-400">
        Error cargando datos: {cErr?.message || gErr?.message}
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const defaultPickup = today;
  const defaultReturn = addDaysIso(today, 3);
  const defaultEvent = defaultPickup;

  const garmentOptions = (garments ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    sku: g.sku,
    rental_price: g.rental_price ?? 0,
    deposit_amount: g.deposit_amount ?? 0,
  }));

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-admin-display text-4xl font-bold tracking-tight">Nueva reserva manual</h1>
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
          Filtrar listas
        </button>
        {(customerQ || garmentQ) ? (
          <Link
            href="/admin/reservations/new"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Limpiar búsqueda
          </Link>
        ) : null}
      </form>

      <ManualReservationForm
        garments={garmentOptions}
        customers={customers ?? []}
        defaultPickup={defaultPickup}
        defaultReturn={defaultReturn}
        defaultEvent={defaultEvent}
      />

      <p className="text-xs text-muted-foreground">
        Si no ves a la clienta o la prenda, usá la búsqueda arriba (hasta 200 resultados por lista).
      </p>
    </div>
  );
}

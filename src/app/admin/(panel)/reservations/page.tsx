import type { ReactNode } from 'react';
import Link from 'next/link';
import { AdminTableScroll } from '@/components/admin/AdminTableScroll';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { anonymizeCustomer, softDeleteCustomer, updateReservationStatus } from '@/lib/actions/admin';
import { requireAdminPagePermission } from '@/lib/admin-auth-server';
import { adminHasPermission } from '@/lib/admin-permissions';

const PAGE_SIZE = 12;

const RESERVATION_SELECT = `
  id, pickup_date, return_date, status, mp_preference_id, customer_id,
  customers(id, first_name, last_name, email, phone, pii_anonymized_at),
  garments(name, sku, photos_urls)
`;

const VIEW_TABS: { id: string; label: string; hint: string }[] = [
  { id: 'active', label: 'Activas / próximas', hint: 'Pendientes, confirmadas, en curso o entregadas dentro del plazo' },
  { id: 'last30', label: 'Últimos 30 días', hint: 'Por fecha de retiro' },
  { id: 'past', label: 'Pasadas', hint: 'Devueltas o entregas con devolución vencida' },
  { id: 'cancelled', label: 'Canceladas', hint: '' },
  { id: 'all', label: 'Todas', hint: 'Historial completo (paginado)' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function normalizeView(raw: string | undefined): string {
  const allowed = new Set(VIEW_TABS.map((t) => t.id));
  if (raw && allowed.has(raw)) return raw;
  return 'active';
}

function listPath(view: string, page: number): string {
  const p = new URLSearchParams();
  p.set('view', view);
  if (page > 1) p.set('page', String(page));
  const q = p.toString();
  return q ? `/admin/reservations?${q}` : '/admin/reservations';
}

type CustomerEmbed = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  pii_anonymized_at: string | null;
} | null;

type GarmentEmbed = {
  name: string;
  sku: string;
  photos_urls: string[] | null;
} | null;

type ReservationRow = {
  id: string;
  pickup_date: string;
  return_date: string;
  status: string;
  mp_preference_id: string | null;
  customer_id: string;
  customers: CustomerEmbed;
  garments: GarmentEmbed;
};

function applyViewFilter<T extends { or: (s: string) => T; eq: (c: string, v: string) => T; gte: (c: string, v: string) => T }>(
  query: T,
  view: string,
  today: string,
  last30Start: string,
): T {
  switch (view) {
    case 'last30':
      return query.gte('pickup_date', last30Start);
    case 'past':
      return query.or(`status.eq.returned,and(status.eq.delivered,return_date.lt.${today})`);
    case 'cancelled':
      return query.eq('status', 'cancelled');
    case 'all':
      return query;
    case 'active':
    default:
      return query.or(
        `status.in.(pending,confirmed,paid,disputed),and(status.eq.delivered,return_date.gte.${today})`,
      );
  }
}

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const view = normalizeView(typeof searchParams.view === 'string' ? searchParams.view : undefined);
  const pageRaw = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const session = await requireAdminPagePermission('reservations:read');
  const canResWrite = adminHasPermission(session.role, 'reservations:write');
  const canAnon = adminHasPermission(session.role, 'customers:anonymize');
  const canTrashCust = adminHasPermission(session.role, 'trash:manage');

  const supabase = createAdminClient();
  const today = todayIso();
  const last30Start = addDaysIso(today, -30);

  let countQ = supabase.from('reservations').select('id', { count: 'exact', head: true });
  countQ = applyViewFilter(countQ, view, today, last30Start);
  const { count: ct } = await countQ;
  const total = ct ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let dataQuery = supabase.from('reservations').select(RESERVATION_SELECT).order('pickup_date', { ascending: false });
  dataQuery = applyViewFilter(dataQuery, view, today, last30Start);
  const { data: reservations, error } = await dataQuery.range(from, to);

  if (error) {
    return <div className="p-4 sm:p-6 lg:p-8 text-red-500">Error cargando reservas: {error.message}</div>;
  }

  const rows = (reservations ?? []) as ReservationRow[];
  const currentListPath = listPath(view, safePage);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-admin-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Operaciones y Reservas</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Historial completo en base. Usá filtros para ver activas, últimos 30 días, pasadas o canceladas. Podés anonimizar datos
            personales de una clienta sin borrar la reserva.
          </p>
        </div>
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {total === 0 ? 'Sin resultados' : `${from + 1}–${Math.min(from + rows.length, total)} de ${total}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {VIEW_TABS.map((t) => {
          const active = t.id === view;
          return (
            <Link
              key={t.id}
              href={listPath(t.id, 1)}
              title={t.hint || undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                active
                  ? 'bg-fuchsia-600/30 border-fuchsia-500/50 text-white'
                  : 'bg-white/[0.03] border-white/10 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <AdminTableScroll>
          <table className="w-full min-w-[640px] text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.03] border-b border-white/5 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Prenda</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold text-center">Entrega / Devolución</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No hay reservas en esta vista.
                  </td>
                </tr>
              ) : (
                rows.map((res) => {
                  const cust = res.customers;
                  const anon = Boolean(cust?.pii_anonymized_at);
                  return (
                    <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-muted rounded overflow-hidden shrink-0">
                            {res.garments?.photos_urls?.[0] && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={res.garments.photos_urls[0]} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{res.garments?.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{res.garments?.sku}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {cust?.first_name} {cust?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{cust?.phone || cust?.email}</div>
                        {anon && (
                          <Badge variant="outline" className="mt-2 border-zinc-600 text-zinc-300 text-[10px] uppercase">
                            Datos anonimizados
                          </Badge>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-2 items-center justify-center">
                          <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 flex flex-col items-center">
                            <span className="text-[9px] uppercase text-muted-foreground">Retiro</span>
                            <span className="font-semibold text-fuchsia-300">
                              {res.pickup_date.split('-').reverse().join('/')}
                            </span>
                          </div>
                          <span className="text-muted-foreground">→</span>
                          <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 flex flex-col items-center">
                            <span className="text-[9px] uppercase text-muted-foreground">Devolución</span>
                            <span className="font-semibold text-fuchsia-300">
                              {res.return_date.split('-').reverse().join('/')}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          className={
                            res.status === 'confirmed' || res.status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : res.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : res.status === 'delivered'
                                  ? 'bg-indigo-500/20 text-indigo-300'
                                  : res.status === 'returned'
                                    ? 'bg-zinc-500/20 text-zinc-300'
                                    : 'bg-red-500/20 text-red-300'
                          }
                        >
                          {res.status.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex flex-col items-end gap-2">
                          {canResWrite ? (
                            <form action={updateReservationStatus} className="inline-flex gap-2">
                              <input type="hidden" name="id" value={res.id} />
                              <input type="hidden" name="next" value={currentListPath} />
                              {res.status === 'confirmed' || res.status === 'paid' ? (
                                <button
                                  type="submit"
                                  name="status"
                                  value="delivered"
                                  className="text-xs font-bold uppercase tracking-widest text-white bg-fuchsia-600 hover:bg-fuchsia-500 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Marcar entregada
                                </button>
                              ) : res.status === 'delivered' ? (
                                <button
                                  type="submit"
                                  name="status"
                                  value="returned"
                                  className="text-xs font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Registrar devolución
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground uppercase opacity-50 block w-[160px] text-center">
                                  Sin acción rápida
                                </span>
                              )}
                            </form>
                          ) : (
                            <span className="text-xs text-muted-foreground uppercase opacity-50">Solo lectura</span>
                          )}
                          {cust?.id && !anon && canAnon ? (
                            <form action={anonymizeCustomer} className="inline-block">
                              <input type="hidden" name="customer_id" value={cust.id} />
                              <input type="hidden" name="next" value={currentListPath} />
                              <button
                                type="submit"
                                className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-amber-300 underline-offset-2 hover:underline"
                              >
                                Anonimizar datos personales
                              </button>
                            </form>
                          ) : null}
                          {cust?.id && !anon && canTrashCust ? (
                            <form action={softDeleteCustomer} className="inline-block">
                              <input type="hidden" name="id" value={cust.id} />
                              <button
                                type="submit"
                                className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-red-300 underline-offset-2 hover:underline"
                              >
                                Mover clienta a papelera
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </AdminTableScroll>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="text-muted-foreground">
            Página {safePage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <PaginationLink disabled={safePage <= 1} href={listPath(view, safePage - 1)}>
              ← Anterior
            </PaginationLink>
            <PaginationLink disabled={safePage >= totalPages} href={listPath(view, safePage + 1)}>
              Siguiente →
            </PaginationLink>
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationLink({ href, disabled, children }: { href: string; disabled: boolean; children: ReactNode }) {
  if (disabled) {
    return (
      <span className="rounded-lg border border-white/5 px-4 py-2 text-muted-foreground opacity-40 cursor-not-allowed">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-foreground hover:bg-white/[0.08] transition-colors"
    >
      {children}
    </Link>
  );
}

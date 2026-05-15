import Link from 'next/link';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { formatUy } from '@/lib/utils';
import { listGarmentLocations } from '@/lib/actions/admin';
import { requireAdminPagePermission } from '@/lib/admin-auth-server';
import { adminHasPermission } from '@/lib/admin-permissions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const OPERATIVE_STATUSES = [
  'available',
  'processing',
  'in_cleaning',
  'in_repair',
  'reserved',
  'retired',
] as const;

type OperativeStatus = (typeof OPERATIVE_STATUSES)[number];

function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function pickStr(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return undefined;
}

function garmentsListPath(opts: {
  q?: string;
  status?: string;
  category?: string;
  location_id?: string;
  page?: number;
}): string {
  const p = new URLSearchParams();
  if (opts.q) p.set('q', opts.q);
  if (opts.status) p.set('status', opts.status);
  if (opts.category) p.set('category', opts.category);
  if (opts.location_id) p.set('location_id', opts.location_id);
  if (opts.page && opts.page > 1) p.set('page', String(opts.page));
  const s = p.toString();
  return s ? `/admin/garments?${s}` : '/admin/garments';
}

type GarmentListRow = {
  id: string;
  name: string;
  sku: string;
  size_label: string;
  category: string | null;
  rental_price: number;
  operative_status: string;
  photos_urls: string[] | null;
  locations: { name: string; address_line: string } | null;
};

function applyGarmentFilters<
  T extends {
    eq: (c: string, v: string) => T;
    or: (s: string) => T;
    is: (c: string, v: null) => T;
  },
>(query: T, orgId: string, filters: { q?: string; status?: string; category?: string; location_id?: string }): T {
  let q = query.eq('organization_id', orgId).is('deleted_at', null);
  if (filters.status) q = q.eq('operative_status', filters.status);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.location_id) q = q.eq('location_id', filters.location_id);
  if (filters.q) {
    const pat = `%${escapeIlikePattern(filters.q)}%`;
    q = q.or(`name.ilike.${pat},sku.ilike.${pat}`);
  }
  return q;
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

export default async function AdminGarmentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await requireAdminPagePermission('garments:read');
  const supabase = createAdminClient();

  const { data: org, error: orgErr } = await supabase.from('organizations').select('id').eq('slug', 'maison-demo').single();

  if (orgErr || !org) {
    return <div className="p-8 text-red-500">No se encontró la organización demo.</div>;
  }

  const q = pickStr(searchParams.q);
  const statusRaw = pickStr(searchParams.status);
  const status: OperativeStatus | undefined = OPERATIVE_STATUSES.includes(statusRaw as OperativeStatus)
    ? (statusRaw as OperativeStatus)
    : undefined;
  const category = pickStr(searchParams.category);
  const locRaw = pickStr(searchParams.location_id);
  const location_id = z.string().uuid().safeParse(locRaw).success ? locRaw : undefined;

  const pageRaw = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const filters = { q, status, category, location_id };

  const [{ data: catRows }, locations] = await Promise.all([
    supabase
      .from('garments')
      .select('category')
      .eq('organization_id', org.id)
      .is('deleted_at', null)
      .not('category', 'is', null)
      .limit(2000),
    listGarmentLocations(),
  ]);

  const categoryOptions = Array.from(
    new Set((catRows ?? []).map((r) => r.category).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b));

  let countQ = supabase.from('garments').select('id', { count: 'exact', head: true });
  countQ = applyGarmentFilters(countQ, org.id, filters);
  const { count: ct } = await countQ;
  const total = ct ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let dataQuery = supabase
    .from('garments')
    .select('id, name, sku, size_label, category, rental_price, operative_status, photos_urls, locations!garments_location_id_fkey(name, address_line)')
    .order('created_at', { ascending: false });
  dataQuery = applyGarmentFilters(dataQuery, org.id, filters);
  const { data: garments, error } = await dataQuery.range(from, to);

  if (error) {
    return <div className="p-8 text-red-500">Error cargando las prendas: {error.message}</div>;
  }

  const rows = (garments ?? []) as GarmentListRow[];

  const chipBase = (patch: Partial<{ q: string; status: string; category: string; location_id: string }>) =>
    garmentsListPath({
      q: patch.q !== undefined ? patch.q : q,
      status: patch.status !== undefined ? patch.status : status,
      category: patch.category !== undefined ? patch.category : category,
      location_id: patch.location_id !== undefined ? patch.location_id : location_id,
      page: 1,
    });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-admin-display text-4xl font-bold tracking-tight">Catálogo de Prendas</h1>
          <p className="text-muted-foreground mt-1">Gestiona el inventario, precios y estados.</p>
        </div>
        {adminHasPermission(session.role, 'garments:write') ? (
          <a
            href="/admin/garments/new"
            className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-lg px-6 py-2 text-sm font-semibold transition-all shadow-glow flex items-center justify-center"
          >
            + Agregar Prenda
          </a>
        ) : null}
      </div>

      <form method="GET" className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Buscar nombre o SKU</label>
            <input
              type="search"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Ej. vestido, SKU-40"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            />
          </div>
          <div className="min-w-[160px] space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Estado operativo</label>
            <select
              name="status"
              defaultValue={status ?? ''}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {OPERATIVE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px] space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Categoría</label>
            <select
              name="category"
              defaultValue={category ?? ''}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Sede</label>
            <select
              name="location_id"
              defaultValue={location_id ?? ''}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-white/10 bg-white/[0.06] px-5 py-2 text-sm font-medium hover:bg-white/[0.1] h-[42px]"
          >
            Buscar
          </button>
        </div>
        {(q || status || category || location_id) && (
          <div className="flex flex-wrap gap-2 items-center text-xs">
            <span className="text-muted-foreground uppercase tracking-widest">Filtros activos:</span>
            <Link href="/admin/garments" className="rounded-full border border-white/15 px-3 py-1 text-muted-foreground hover:text-foreground hover:bg-white/[0.06]">
              Limpiar todo
            </Link>
            {status ? (
              <Link
                href={chipBase({ status: '' })}
                className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-fuchsia-200 hover:bg-fuchsia-500/20"
              >
                Estado: {status} ×
              </Link>
            ) : null}
            {q ? (
              <Link href={chipBase({ q: '' })} className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/[0.06]">
                Búsqueda: “{q}” ×
              </Link>
            ) : null}
            {category ? (
              <Link href={chipBase({ category: '' })} className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/[0.06]">
                Categoría: {category} ×
              </Link>
            ) : null}
            {location_id ? (
              <Link href={chipBase({ location_id: '' })} className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/[0.06]">
                Sede ×
              </Link>
            ) : null}
          </div>
        )}
      </form>

      <p className="text-sm text-muted-foreground">
        {total === 0 ? 'Sin resultados' : `${from + 1}–${Math.min(from + rows.length, total)} de ${total}`}
      </p>

      <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.03] border-b border-white/5 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Prenda / SKU</th>
                <th className="px-6 py-4 font-semibold">Talle</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold">Sede</th>
                <th className="px-6 py-4 font-semibold">Precio Alquiler</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No hay prendas que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                rows.map((g) => {
                  const loc = g.locations;
                  const thumb = g.photos_urls?.[0];
                  return (
                    <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-16 bg-white/5 border border-white/10 rounded-md overflow-hidden shrink-0">
                            {thumb ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground px-1 text-center">
                                Sin foto
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate max-w-[220px]">{g.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{g.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="border-white/10">
                          {g.size_label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{g.category || '-'}</td>
                      <td
                        className="px-6 py-4 text-muted-foreground max-w-[200px] truncate"
                        title={loc ? `${loc.name} — ${loc.address_line}` : ''}
                      >
                        {loc?.name || '—'}
                      </td>
                      <td className="px-6 py-4 font-medium">{formatUy(g.rental_price)}</td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            g.operative_status === 'available'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : g.operative_status === 'processing' ||
                                  g.operative_status === 'in_cleaning' ||
                                  g.operative_status === 'in_repair'
                                ? 'bg-amber-500/20 text-amber-300'
                                : g.operative_status === 'retired'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-zinc-500/20 text-zinc-300'
                          }
                        >
                          {g.operative_status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {adminHasPermission(session.role, 'garments:write') ? (
                          <a
                            href={`/admin/garments/${g.id}`}
                            className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold text-xs uppercase tracking-widest"
                          >
                            Editar
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="text-muted-foreground">
            Página {safePage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <PaginationLink
              disabled={safePage <= 1}
              href={garmentsListPath({ ...filters, page: safePage - 1 })}
            >
              ← Anterior
            </PaginationLink>
            <PaginationLink
              disabled={safePage >= totalPages}
              href={garmentsListPath({ ...filters, page: safePage + 1 })}
            >
              Siguiente →
            </PaginationLink>
          </div>
        </div>
      )}
    </div>
  );
}

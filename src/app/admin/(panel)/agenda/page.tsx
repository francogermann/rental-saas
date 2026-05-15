import Link from 'next/link';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminPagePermission } from '@/lib/admin-auth-server';
import { labelReservationStatus } from '@/lib/admin-labels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AGENDA_SELECT = `
  id, pickup_date, return_date, event_date, status, customer_id,
  customers(id, first_name, last_name, email, phone, pii_anonymized_at),
  garments(name, sku, photos_urls)
`;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function parseDateParam(raw: string | string[] | undefined): string {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (s && z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(s).success) return s;
  return todayIso();
}

function agendaPath(date: string): string {
  return `/admin/agenda?date=${encodeURIComponent(date)}`;
}

function formatDayHeading(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
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

type AgendaRow = {
  id: string;
  pickup_date: string;
  return_date: string;
  event_date: string | null;
  status: string;
  customer_id: string;
  customers: CustomerEmbed;
  garments: GarmentEmbed;
};

function statusBadgeClass(status: string): string {
  if (status === 'confirmed' || status === 'paid') return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30';
  if (status === 'pending') return 'bg-amber-500/20 text-amber-200 border-amber-500/30';
  if (status === 'delivered') return 'bg-sky-500/20 text-sky-200 border-sky-500/30';
  return 'bg-white/10 text-muted-foreground border-white/15';
}

function AgendaRowCard({ row, subtitle }: { row: AgendaRow; subtitle?: string }) {
  const cust = row.customers;
  const anon = Boolean(cust?.pii_anonymized_at);
  const name = cust ? `${cust.first_name} ${cust.last_name}`.trim() : '—';
  const phone = cust?.phone ?? null;

  return (
    <div className="flex flex-col gap-3 border-b border-white/5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 gap-3">
        <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-muted">
          {row.garments?.photos_urls?.[0] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={row.garments.photos_urls[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">—</div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground">{row.garments?.name ?? 'Prenda'}</p>
          <p className="text-xs text-muted-foreground">SKU {row.garments?.sku ?? '—'}</p>
          {subtitle ? <p className="mt-1 text-xs text-fuchsia-300/80">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1 sm:items-end sm:text-right">
        <p className="text-sm font-medium">{anon ? 'Clienta (datos anonimizados)' : name}</p>
        {!anon && phone ? <p className="text-xs text-muted-foreground">{phone}</p> : null}
        <Badge variant="outline" className={`w-fit border text-[10px] uppercase ${statusBadgeClass(row.status)}`}>
          {labelReservationStatus(row.status)}
        </Badge>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  rows,
  emptyMessage,
  rowSubtitle,
}: {
  title: string;
  description: string;
  rows: AgendaRow[];
  emptyMessage: string;
  rowSubtitle?: (row: AgendaRow) => string | undefined;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.02] shadow-xl">
      <CardHeader className="border-b border-white/5 pb-3">
        <CardTitle className="font-admin-display text-lg">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div>{rows.map((row) => (
            <AgendaRowCard key={row.id} row={row} subtitle={rowSubtitle?.(row)} />
          ))}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAdminPagePermission('reservations:read');

  const date = parseDateParam(searchParams.date);
  const prev = addDaysIso(date, -1);
  const next = addDaysIso(date, 1);
  const today = todayIso();

  const supabase = createAdminClient();

  const [pickupsRes, returnsRes, eventsRes] = await Promise.all([
    supabase
      .from('reservations')
      .select(AGENDA_SELECT)
      .eq('pickup_date', date)
      .in('status', ['pending', 'confirmed', 'paid'])
      .order('created_at', { ascending: true }),
    supabase
      .from('reservations')
      .select(AGENDA_SELECT)
      .eq('return_date', date)
      .eq('status', 'delivered')
      .order('pickup_date', { ascending: true }),
    supabase
      .from('reservations')
      .select(AGENDA_SELECT)
      .eq('event_date', date)
      .neq('status', 'cancelled')
      .order('pickup_date', { ascending: true }),
  ]);

  const err = pickupsRes.error ?? returnsRes.error ?? eventsRes.error;
  if (err) {
    return <div className="p-4 sm:p-6 lg:p-8 text-red-500">Error cargando agenda: {err.message}</div>;
  }

  const pickups = (pickupsRes.data ?? []) as AgendaRow[];
  const returns = (returnsRes.data ?? []) as AgendaRow[];
  const events = (eventsRes.data ?? []) as AgendaRow[];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-admin-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Agenda del día</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Retiros a preparar, devoluciones previstas y eventos cargados para la fecha elegida. Misma base que{' '}
            <Link href="/admin/reservations" className="text-fuchsia-400 hover:text-fuchsia-300">
              Citas y Reservas
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={agendaPath(prev)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            ← Día anterior
          </Link>
          <Link
            href={agendaPath(next)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            Día siguiente →
          </Link>
          {date !== today ? (
            <Link
              href={agendaPath(today)}
              className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-2 text-sm font-medium text-fuchsia-200 transition hover:bg-fuchsia-500/20"
            >
              Hoy
            </Link>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{date}</p>
          <p className="font-admin-display text-lg font-semibold capitalize text-foreground">{formatDayHeading(date)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <SectionCard
          title="Retiros a entregar"
          description="Reservas con retiro hoy que aún no están marcadas como entregadas al cliente (pendiente, confirmada o paga)."
          rows={pickups}
          emptyMessage="No hay retiros programados para este día con esos estados."
          rowSubtitle={() => `Retiro: ${date.split('-').reverse().join('/')}`}
        />

        <SectionCard
          title="Devoluciones previstas"
          description="Prendas en calle (entregadas) con fecha de devolución pactada para este día."
          rows={returns}
          emptyMessage="No hay devoluciones esperadas para este día."
          rowSubtitle={(row) => `Retirada el ${row.pickup_date.split('-').reverse().join('/')}`}
        />

        <SectionCard
          title="Eventos del día"
          description="Reservas con fecha de evento cargada para hoy (excluye canceladas)."
          rows={events}
          emptyMessage="No hay eventos registrados para esta fecha."
          rowSubtitle={(row) =>
            row.event_date ? `Evento: ${row.event_date.split('-').reverse().join('/')}` : undefined
          }
        />
      </div>
    </div>
  );
}

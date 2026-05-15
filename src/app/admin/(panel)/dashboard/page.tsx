import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminPagePermission } from '@/lib/admin-auth-server';
import { adminHasPermission } from '@/lib/admin-permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProcessWaitlistButton } from '@/components/admin/ProcessWaitlistButton';

type UpcomingReservationRow = {
  id: string;
  pickup_date: string;
  status: string;
  customers: { first_name: string; last_name: string; phone: string | null } | null;
  garments: { name: string; sku: string } | null;
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await requireAdminPagePermission('dashboard:view');
  const canWriteGarments = adminHasPermission(session.role, 'garments:write');
  const canWriteRes = adminHasPermission(session.role, 'reservations:write');

  const forbidden = typeof searchParams.error === 'string' && searchParams.error === 'forbidden';

  const supabase = createAdminClient();

  // Basic stats for MVP (Current month)
  const [
    { count: totalGarments },
    { count: totalReservations },
    { count: pendingDeliveries },
  ] = await Promise.all([
    supabase.from('garments').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('reservations').select('*', { count: 'exact', head: true }),
    supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'paid']),
  ]);

  // Active reservations for today/this week to show as immediate action items
  const today = new Date().toISOString().split('T')[0];
  const { data: upcomingReservations } = await supabase
    .from('reservations')
    .select(`
      id, pickup_date, return_date, status, 
      customers(first_name, last_name, phone),
      garments(name, sku)
    `)
    .in('status', ['confirmed', 'paid', 'pending'])
    .gte('pickup_date', today)
    .order('pickup_date', { ascending: true })
    .limit(5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {forbidden ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No tenés permiso para acceder a esa sección. Si necesitás otro rol, contactá al administrador.
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-admin-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Tablero General</h1>
          <p className="text-muted-foreground mt-1">Resumen de operaciones de Carpe Diem.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/garments"
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            Gestionar Prendas
          </Link>
          {canWriteRes ? (
            <Link
              href="/admin/reservations/new"
              className="bg-white/5 border border-fuchsia-500/30 hover:bg-fuchsia-500/10 text-fuchsia-200 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            >
              + Reserva manual
            </Link>
          ) : null}
          {canWriteGarments ? (
            <Link
              href="/admin/garments/new"
              className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-glow"
            >
              + Nueva Prenda
            </Link>
          ) : null}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/[0.02] border-white/5 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Total Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-admin-display">{totalGarments ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">prendas registradas</p>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/5 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Reservas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-admin-display">{totalReservations ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">históricas</p>
          </CardContent>
        </Card>

        <Card className="bg-fuchsia-500/10 border-fuchsia-500/30 shadow-[0_0_30px_-10px_rgba(217,70,239,0.3)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-fuchsia-300 uppercase tracking-widest">
              A Entregar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-fuchsia-100 font-admin-display">{pendingDeliveries ?? 0}</div>
            <p className="text-xs text-fuchsia-300/70 mt-1">reservas confirmadas</p>
          </CardContent>
        </Card>
      </div>

      {canWriteRes ? (
        <Card className="border-white/10 bg-white/[0.02] shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Lista de espera (catálogo)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Enviá avisos por email cuando una prenda vuelva a estar libre para el rango elegido (no implementado aún).
            </p>
            <ProcessWaitlistButton />
          </CardContent>
        </Card>
      ) : null}

      {/* Action Items List */}
      <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.01]">
          <h2 className="text-lg font-semibold font-admin-display">Próximos Retiros (Próximos 7 días)</h2>
        </div>
        
        {(!upcomingReservations || upcomingReservations.length === 0) ? (
          <div className="p-12 text-center text-muted-foreground">
            No hay retiros agendados próximamente.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {(upcomingReservations as UpcomingReservationRow[]).map((res) => (
              <div key={res.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center min-w-24">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Fecha</p>
                    <p className="font-bold text-fuchsia-300">{res.pickup_date.split('-').reverse().join('/')}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {res.customers?.first_name} {res.customers?.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      📱 {res.customers?.phone || 'Sin número'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{res.garments?.name}</span>
                    <Badge variant="outline" className="border-white/20 text-xs">SKU: {res.garments?.sku}</Badge>
                  </div>
                  <Badge className="bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30">
                    {res.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

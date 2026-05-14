/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { updateReservationStatus } from '@/lib/actions/admin';

export default async function AdminReservationsPage() {
  const supabase = createAdminClient();

  // Fetch all reservations, latest first
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(`
      id, pickup_date, return_date, status, mp_preference_id,
      customers(first_name, last_name, email, phone),
      garments(name, sku, photos_urls)
    `)
    .order('pickup_date', { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Error cargando reservas: {error.message}</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Operaciones y Reservas</h1>
          <p className="text-muted-foreground mt-1">Gestiona los retiros y devoluciones de prendas.</p>
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.03] border-b border-white/5 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Prenda</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold text-center">Entrega / Devolución</th>
                <th className="px-6 py-4 font-semibold">Estado Actual</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!reservations || reservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No hay reservas registradas.
                  </td>
                </tr>
              ) : (
                reservations.map((res: any) => (
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
                      <div className="font-medium">{res.customers?.first_name} {res.customers?.last_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{res.customers?.phone || res.customers?.email}</div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 items-center justify-center">
                        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 flex flex-col items-center">
                           <span className="text-[9px] uppercase text-muted-foreground">Retiro</span>
                           <span className="font-semibold text-fuchsia-300">{res.pickup_date.split('-').reverse().join('/')}</span>
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 flex flex-col items-center">
                           <span className="text-[9px] uppercase text-muted-foreground">Devolución</span>
                           <span className="font-semibold text-fuchsia-300">{res.return_date.split('-').reverse().join('/')}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge className={
                        res.status === 'confirmed' || res.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' :
                        res.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        res.status === 'entregada' ? 'bg-indigo-500/20 text-indigo-300' :
                        res.status === 'devuelta' ? 'bg-zinc-500/20 text-zinc-300' :
                        'bg-red-500/20 text-red-300'
                      }>
                        {res.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                       <form action={updateReservationStatus} className="inline-flex gap-2">
                          <input type="hidden" name="id" value={res.id} />
                          {res.status === 'confirmed' || res.status === 'paid' ? (
                            <button type="submit" name="status" value="entregada" className="text-xs font-bold uppercase tracking-widest text-white bg-fuchsia-600 hover:bg-fuchsia-500 px-3 py-1.5 rounded-lg transition-colors">
                              Marcar Entregada
                            </button>
                          ) : res.status === 'entregada' ? (
                            <button type="submit" name="status" value="devuelta" className="text-xs font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors">
                              Registrar Devolución
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground uppercase opacity-50 block w-[160px] text-center">Sin acción</span>
                          )}
                       </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

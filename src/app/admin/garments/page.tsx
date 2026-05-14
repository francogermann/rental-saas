import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';

export default async function AdminGarmentsPage() {
  const supabase = createAdminClient();

  const { data: garments, error } = await supabase
    .from('garments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Error cargando las prendas: {error.message}</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Catálogo de Prendas</h1>
          <p className="text-muted-foreground mt-1">Gestiona el inventario, precios y estados.</p>
        </div>
        <a href="/admin/garments/new" className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-lg px-6 py-2 text-sm font-semibold transition-all shadow-glow flex items-center justify-center">
          + Agregar Prenda
        </a>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.03] border-b border-white/5 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Prenda / SKU</th>
                <th className="px-6 py-4 font-semibold">Talle</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold">Precio Alquiler</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!garments || garments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No hay prendas registradas aún.
                  </td>
                </tr>
              ) : (
                garments.map((g) => (
                  <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{g.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{g.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-white/10">{g.size_label}</Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {g.category || '-'}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      ${g.rental_price?.toLocaleString('es-AR')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        g.operative_status === 'disponible' 
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : g.operative_status === 'mantenimiento'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                      }>
                        {g.operative_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={`/admin/garments/${g.id}`} 
                        className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold text-xs uppercase tracking-widest"
                      >
                        Editar
                      </a>
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

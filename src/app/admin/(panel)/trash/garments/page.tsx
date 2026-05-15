import Link from 'next/link';
import { AdminTableScroll } from '@/components/admin/AdminTableScroll';
import { createAdminClient } from '@/lib/supabase/server';
import { restoreGarment } from '@/lib/actions/admin';
import { requireAdminPagePermission } from '@/lib/admin-auth-server';

export const dynamic = 'force-dynamic';

export default async function TrashGarmentsPage() {
  await requireAdminPagePermission('trash:manage');

  const supabase = createAdminClient();
  const { data: org, error: orgErr } = await supabase.from('organizations').select('id').eq('slug', 'maison-demo').single();
  if (orgErr || !org) {
    return <div className="p-4 sm:p-6 lg:p-8 text-red-400">Organización no encontrada.</div>;
  }

  const { data: rows, error } = await supabase
    .from('garments')
    .select('id, name, sku, deleted_at, operative_status')
    .eq('organization_id', org.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    return <div className="p-4 sm:p-6 lg:p-8 text-red-400">{error.message}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-admin-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Papelera — prendas</h1>
          <p className="text-muted-foreground mt-1">Restaurá prendas eliminadas por error.</p>
        </div>
        <Link href="/admin/garments" className="text-sm text-fuchsia-400 hover:text-fuchsia-300 font-semibold">
          ← Catálogo activo
        </Link>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <AdminTableScroll>
        <table className="w-full min-w-[640px] text-left text-sm whitespace-nowrap">
          <thead className="bg-white/[0.03] border-b border-white/5 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Prenda</th>
              <th className="px-4 py-3">Eliminada</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                  La papelera está vacía.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((g) => (
                <tr key={g.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{g.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {g.deleted_at ? new Date(g.deleted_at).toLocaleString('es-UY') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex flex-col items-end gap-2">
                      <form action={restoreGarment}>
                        <input type="hidden" name="id" value={g.id} />
                        <button
                          type="submit"
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-lg px-3 py-1.5"
                        >
                          Restaurar
                        </button>
                      </form>
                      <Link href={`/admin/garments/${g.id}`} className="text-[10px] text-muted-foreground hover:text-foreground">
                        Ver ficha
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </AdminTableScroll>
      </div>
    </div>
  );
}

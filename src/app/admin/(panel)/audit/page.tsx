import Link from 'next/link';
import { AdminTableScroll } from '@/components/admin/AdminTableScroll';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminPagePermission } from '@/lib/admin-auth-server';
import { adminRoleLabelEs, parseAdminRole } from '@/lib/admin-role';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 40;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAdminPagePermission('audit:read');

  const pageRaw = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const supabase = createAdminClient();
  const { count: totalCt } = await supabase.from('audit_logs').select('id', { count: 'exact', head: true });
  const total = totalCt ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: rows, error } = await supabase
    .from('audit_logs')
    .select('id, actor_username, actor_role, action, entity_type, entity_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return <div className="p-4 sm:p-6 lg:p-8 text-red-400">Error: {error.message}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-admin-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Auditoría</h1>
          <p className="text-muted-foreground mt-1">Registro de acciones importantes del panel.</p>
        </div>
        <Link href="/admin/dashboard" className="text-sm text-fuchsia-400 hover:text-fuchsia-300 font-semibold">
          ← Tablero
        </Link>
      </div>

      <div className="text-sm text-muted-foreground">
        {total === 0 ? 'Sin registros aún.' : `Mostrando ${from + 1}–${from + (rows?.length ?? 0)} de ${total}`}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <AdminTableScroll>
          <table className="w-full min-w-[640px] text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.03] border-b border-white/5 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Entidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(rows ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No hay eventos de auditoría.
                  </td>
                </tr>
              ) : (
                (rows ?? []).map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-mono text-xs">
                      {new Date(r.created_at).toLocaleString('es-UY')}
                    </td>
                    <td className="px-4 py-3">{r.actor_username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{adminRoleLabelEs(parseAdminRole(r.actor_role))}</td>
                    <td className="px-4 py-3 font-medium">{r.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.entity_type}
                      {r.entity_id ? <span className="block font-mono text-[10px] mt-0.5">{r.entity_id}</span> : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminTableScroll>
      </div>

      {totalPages > 1 ? (
        <div className="flex gap-2 text-sm">
          {safePage > 1 ? (
            <Link
              href={`/admin/audit?page=${safePage - 1}`}
              className="rounded-lg border border-white/10 px-4 py-2 hover:bg-white/[0.06]"
            >
              Anterior
            </Link>
          ) : null}
          {safePage < totalPages ? (
            <Link
              href={`/admin/audit?page=${safePage + 1}`}
              className="rounded-lg border border-white/10 px-4 py-2 hover:bg-white/[0.06]"
            >
              Siguiente
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

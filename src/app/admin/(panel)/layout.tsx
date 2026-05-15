import Link from 'next/link';
import { redirect } from 'next/navigation';
import { logoutAdmin } from '@/lib/actions/admin-login';
import { getAdminSession } from '@/lib/admin-auth-server';
import { adminHasPermission } from '@/lib/admin-permissions';
import { adminRoleLabelEs } from '@/lib/admin-role';

export const dynamic = 'force-dynamic';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const role = session.role;
  const dash = adminHasPermission(role, 'dashboard:view');
  const garments = adminHasPermission(role, 'garments:read');
  const resv = adminHasPermission(role, 'reservations:read');
  const resvWrite = adminHasPermission(role, 'reservations:write');
  const audit = adminHasPermission(role, 'audit:read');
  const trash = adminHasPermission(role, 'trash:manage');

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground flex">
      <aside className="w-64 border-r border-white/10 flex flex-col pt-6 shrink-0 z-10 bg-black/50 backdrop-blur-3xl shadow-xl">
        <div className="px-6 pb-6 border-b border-white/5">
          <Link
            href="/admin/dashboard"
            className="font-admin-display text-xl font-semibold tracking-tight bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent"
          >
            CarpeDiem Admin.
          </Link>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
            {adminRoleLabelEs(role)}
          </p>
        </div>

        <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
          {dash ? (
            <Link href="/admin/dashboard" className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
              Tablero General
            </Link>
          ) : null}
          {garments ? (
            <Link href="/admin/garments" className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
              Catálogo Prendas
            </Link>
          ) : null}
          {resv ? (
            <Link href="/admin/reservations" className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
              Citas y Reservas
            </Link>
          ) : null}
          {resvWrite ? (
            <Link href="/admin/reservations/new" className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
              Nueva reserva manual
            </Link>
          ) : null}
          {audit ? (
            <Link href="/admin/audit" className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
              Auditoría
            </Link>
          ) : null}
          {trash ? (
            <>
              <Link href="/admin/trash/garments" className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
                Papelera prendas
              </Link>
              <Link href="/admin/trash/customers" className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
                Papelera clientas
              </Link>
            </>
          ) : null}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="text-xs text-zinc-400 hover:text-white transition-colors w-full px-4 py-2 rounded-lg bg-white/[0.02] border border-white/10"
            >
              Cerrar sesión
            </button>
          </form>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center justify-center w-full px-4 py-2 rounded-lg bg-white/[0.02]"
          >
            ⟵ Volver al sitio web
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,hsl(315_100%_60%/.05),transparent_50%)]">
        {children}
      </main>
    </div>
  );
}

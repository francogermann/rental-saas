import Link from 'next/link';
import { logoutAdmin } from '@/lib/actions/admin-login';

export type AdminNavPermissions = {
  dash: boolean;
  garments: boolean;
  resv: boolean;
  resvWrite: boolean;
  audit: boolean;
  trash: boolean;
};

const linkClass =
  'px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground';

type AdminNavContentProps = {
  roleLabel: string;
  permissions: AdminNavPermissions;
  onNavigate?: () => void;
  showHeader?: boolean;
};

export function AdminNavContent({
  roleLabel,
  permissions,
  onNavigate,
  showHeader = true,
}: AdminNavContentProps) {
  const { dash, garments, resv, resvWrite, audit, trash } = permissions;

  return (
    <>
      {showHeader ? (
        <div className="px-6 pb-6 border-b border-white/5">
          <Link
            href="/admin/dashboard"
            onClick={onNavigate}
            className="font-admin-display text-xl font-semibold tracking-tight bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent"
          >
            CarpeDiem Admin.
          </Link>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">{roleLabel}</p>
        </div>
      ) : null}

      <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
        {dash ? (
          <Link href="/admin/dashboard" onClick={onNavigate} className={linkClass}>
            Tablero General
          </Link>
        ) : null}
        {garments ? (
          <Link href="/admin/garments" onClick={onNavigate} className={linkClass}>
            Catálogo Prendas
          </Link>
        ) : null}
        {resv ? (
          <>
            <Link href="/admin/agenda" onClick={onNavigate} className={linkClass}>
              Agenda del día
            </Link>
            <Link href="/admin/reservations" onClick={onNavigate} className={linkClass}>
              Citas y Reservas
            </Link>
          </>
        ) : null}
        {resvWrite ? (
          <Link href="/admin/reservations/new" onClick={onNavigate} className={linkClass}>
            Nueva reserva manual
          </Link>
        ) : null}
        {audit ? (
          <Link href="/admin/audit" onClick={onNavigate} className={linkClass}>
            Auditoría
          </Link>
        ) : null}
        {trash ? (
          <>
            <Link href="/admin/trash/garments" onClick={onNavigate} className={linkClass}>
              Papelera prendas
            </Link>
            <Link href="/admin/trash/customers" onClick={onNavigate} className={linkClass}>
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
          onClick={onNavigate}
          className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center justify-center w-full px-4 py-2 rounded-lg bg-white/[0.02]"
        >
          ⟵ Volver al sitio web
        </Link>
      </div>
    </>
  );
}

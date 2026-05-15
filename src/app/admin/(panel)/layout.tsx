import { logoutAdmin } from '@/lib/actions/admin-login';

export const dynamic = 'force-dynamic';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-foreground flex">
      <aside className="w-64 border-r border-white/10 flex flex-col pt-6 shrink-0 z-10 bg-black/50 backdrop-blur-3xl shadow-xl">
        <div className="px-6 pb-6 border-b border-white/5">
          <a href="/admin/dashboard" className="font-admin-display text-xl font-semibold tracking-tight bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
            CarpeDiem Admin.
          </a>
        </div>

        <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
          <a href="/admin/dashboard" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">
            Tablero General
          </a>
          <a href="/admin/garments" className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
            Catálogo Prendas
          </a>
          <a href="/admin/reservations" className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
            Citas y Reservas
          </a>
          <a href="/admin/reservations/new" className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
            Nueva reserva manual
          </a>
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
          <a href="/" className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center justify-center w-full px-4 py-2 rounded-lg bg-white/[0.02]">
            ⟵ Volver al sitio web
          </a>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,hsl(315_100%_60%/.05),transparent_50%)]">
        {children}
      </main>
    </div>
  );
}

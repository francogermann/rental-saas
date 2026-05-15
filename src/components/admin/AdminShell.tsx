'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { AdminNavContent, type AdminNavPermissions } from './AdminNavContent';

type AdminShellProps = {
  roleLabel: string;
  permissions: AdminNavPermissions;
  children: React.ReactNode;
};

export function AdminShell({ roleLabel, permissions, children }: AdminShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground flex flex-col lg:flex-row">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-white/10 bg-black/50 backdrop-blur-3xl px-4 h-14 shrink-0">
        <Link
          href="/admin/dashboard"
          className="font-admin-display text-lg font-semibold tracking-tight bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent truncate"
        >
          CarpeDiem Admin.
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground transition-colors hover:bg-white/10"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={closeDrawer}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-white/10 bg-zinc-950 shadow-xl animate-in slide-in-from-left duration-300 lg:hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{roleLabel}</span>
              <button
                type="button"
                onClick={closeDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminNavContent
              roleLabel={roleLabel}
              permissions={permissions}
              onNavigate={closeDrawer}
              showHeader={false}
            />
          </aside>
        </>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-white/10 flex-col pt-6 shrink-0 z-10 bg-black/50 backdrop-blur-3xl shadow-xl">
        <AdminNavContent roleLabel={roleLabel} permissions={permissions} />
      </aside>

      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,hsl(315_100%_60%/.05),transparent_50%)] min-h-0">
        {children}
      </main>
    </div>
  );
}

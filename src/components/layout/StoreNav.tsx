'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { CartNavButton } from '@/components/cart/CartNavButton';
import { SocialIconLinks } from '@/components/layout/SocialIconLinks';

type StoreNavProps = {
  accountLink: React.ReactNode;
};

export function StoreNav({ accountLink }: StoreNavProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-2xl bg-background/30 border-b border-white/10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-display text-xl font-bold tracking-wide italic shrink-0">
            CarpeDiem.
          </a>

          <div className="hidden md:flex items-center gap-6">
            <a
              href="/catalog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Colección
            </a>
            {!isAdmin ? <SocialIconLinks size="sm" iconClassName="h-4 w-4" /> : null}
            {accountLink}
            <CartNavButton />
          </div>

          <div className="flex md:hidden items-center gap-3">
            <CartNavButton />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground transition-colors hover:bg-white/10"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={closeMenu}
            aria-hidden
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 md:hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-display text-lg font-bold italic">Menú</span>
              <button
                type="button"
                onClick={closeMenu}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              <Link
                href="/catalog"
                onClick={closeMenu}
                className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
              >
                Colección
              </Link>
              {!isAdmin ? (
                <div className="px-4 py-2" onClick={closeMenu}>
                  <SocialIconLinks size="sm" />
                </div>
              ) : null}
              <div onClick={closeMenu} className="px-4 py-3">
                {accountLink}
              </div>
            </nav>
          </div>
        </>
      ) : null}
    </>
  );
}

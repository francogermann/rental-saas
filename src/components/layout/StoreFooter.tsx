'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE_LINKS } from '@/lib/site-links';

const linkClass =
  'text-sm text-muted-foreground transition-colors hover:text-fuchsia-400';

export function StoreFooter() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="border-t border-white/10 px-4 py-10 sm:px-6 sm:py-12">
      <div className="container mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-xl font-bold italic">CarpeDiem.</p>
          <p className="mt-1 text-xs text-muted-foreground">Más que un alquiler, somos parte de tu historia.</p>
        </div>

        <nav className="flex flex-col gap-2" aria-label="Enlaces del sitio">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-fuchsia-400/90">Sitio</span>
          <Link href={SITE_LINKS.aboutHash} className={linkClass}>
            Sobre nosotros
          </Link>
          <Link href={SITE_LINKS.contactHash} className={linkClass}>
            Contacto
          </Link>
        </nav>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-fuchsia-400/90">Redes</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={SITE_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Instagram
            </a>
            <a href={SITE_LINKS.facebook} target="_blank" rel="noopener noreferrer" className={linkClass}>
              Facebook
            </a>
            <a href={SITE_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className={linkClass}>
              WhatsApp
            </a>
          </div>
          <a href={SITE_LINKS.whatsapp} className="text-sm text-muted-foreground hover:text-fuchsia-400">
            📞 {SITE_LINKS.phoneDisplay}
          </a>
        </div>
      </div>
    </footer>
  );
}

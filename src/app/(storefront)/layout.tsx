import Link from 'next/link';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      {/* Premium Glassmorphic Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-neutral-100 dark:to-neutral-500 bg-clip-text text-transparent">
              Maison
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground hidden md:flex">
            <Link href="/catalog" className="transition-colors hover:text-foreground">Catálogo</Link>
            <Link href="/how-it-works" className="transition-colors hover:text-foreground">Cómo Alquilar</Link>
            <Link href="/about" className="transition-colors hover:text-foreground">Nosotros</Link>
          </nav>
          <div className="flex items-center gap-4">
             <button className="h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90">
               Ingresar
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="py-10 border-t border-border/40 mt-auto">
        <div className="container max-w-screen-2xl px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Maison Rental. Diseño Premium.
        </div>
      </footer>
    </div>
  )
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { signOutAction } from '@/lib/actions/auth';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24">
      <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">Hola</h1>
      <p className="text-muted-foreground mb-10">{user.email}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/favorites"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-fuchsia-500/30 hover:bg-white/[0.05]"
        >
          <h2 className="font-semibold text-fuchsia-300">Favoritos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Prendas que guardaste</p>
        </Link>
        <Link
          href="/catalog"
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-fuchsia-500/30 hover:bg-white/[0.05]"
        >
          <h2 className="font-semibold text-fuchsia-300">Catálogo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Seguir explorando</p>
        </Link>
      </div>

      <form action={signOutAction} className="mt-12">
        <button
          type="submit"
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-muted-foreground transition hover:border-white/25 hover:text-foreground"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

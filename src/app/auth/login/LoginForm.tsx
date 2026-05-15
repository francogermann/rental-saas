'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { sanitizeAuthRedirect } from '@/lib/auth-redirect';
import type { Database } from '@/types/supabase';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeAuthRedirect(searchParams.get('redirect'));

  const supabase = useMemo(
    () =>
      createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signErr) {
      setError(signErr.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : signErr.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-95 disabled:opacity-60"
      >
        {loading ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}

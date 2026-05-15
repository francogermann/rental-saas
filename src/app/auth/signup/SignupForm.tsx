'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { registerCustomerProfile } from '@/lib/actions/customer-auth';
import { sanitizeAuthRedirect } from '@/lib/auth-redirect';
import type { Database } from '@/types/supabase';

function mapSignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('user already registered')) {
    return 'Este email ya está registrado. Iniciá sesión.';
  }
  if (lower.includes('password')) {
    return 'La contraseña no cumple los requisitos mínimos.';
  }
  return message;
}

export default function SignupForm() {
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
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const passwordConfirm = (form.elements.namedItem('passwordConfirm') as HTMLInputElement).value;

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      setLoading(false);
      return;
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    const { data: signData, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
        },
      },
    });

    if (signErr) {
      setError(mapSignUpError(signErr.message));
      setLoading(false);
      return;
    }

    if (signData.session) {
      await supabase.auth.setSession({
        access_token: signData.session.access_token,
        refresh_token: signData.session.refresh_token,
      });
    }

    const sync = await registerCustomerProfile({
      firstName,
      lastName,
      phone: phone || undefined,
    });

    setLoading(false);

    if (sync.error) {
      setError(sync.error);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-1">
          <label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">
            Nombre
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            minLength={2}
            className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">
            Apellido
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            minLength={2}
            className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
          />
        </div>
      </div>
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
        <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">
          Teléfono <span className="text-muted-foreground/70">(opcional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
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
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="passwordConfirm" className="text-sm font-medium text-muted-foreground">
          Confirmar contraseña
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-95 disabled:opacity-60"
      >
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  );
}

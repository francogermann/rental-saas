'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerCustomerProfile } from '@/lib/actions/customer-auth';

type Props = {
  defaultFirstName: string;
  defaultLastName: string;
  defaultPhone: string;
};

export function CompleteProfileBanner({ defaultFirstName, defaultLastName, defaultPhone }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value.trim();

    const res = await registerCustomerProfile({
      firstName,
      lastName,
      phone: phone || undefined,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
      <p className="text-sm font-medium text-amber-200 mb-4">
        Completá tu registro para vincular tu cuenta con tu ficha de clienta.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="firstName"
            type="text"
            required
            minLength={2}
            defaultValue={defaultFirstName}
            placeholder="Nombre"
            className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
          />
          <input
            name="lastName"
            type="text"
            required
            minLength={2}
            defaultValue={defaultLastName}
            placeholder="Apellido"
            className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
          />
        </div>
        <input
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          placeholder="Teléfono (opcional)"
          className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
        >
          {loading ? 'Guardando…' : 'Completar registro'}
        </button>
      </form>
    </div>
  );
}

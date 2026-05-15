'use client';

import { useState } from 'react';
import Link from 'next/link';
import { joinGarmentWaitlist } from '@/lib/actions/waitlist';

type Props = {
  garmentId: string;
  organizationId: string;
  pickupLocationId: string;
  pickupDate: string;
  returnDate: string;
  isLoggedIn: boolean;
  urlRangeBlocked: boolean;
};

export function WaitlistJoin({
  garmentId,
  organizationId,
  pickupLocationId,
  pickupDate,
  returnDate,
  isLoggedIn,
  urlRangeBlocked,
}: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!urlRangeBlocked) {
    return null;
  }

  if (!isLoggedIn) {
    const redirect = `/catalog/${garmentId}?pickupLocationId=${encodeURIComponent(pickupLocationId)}&pickupDate=${encodeURIComponent(pickupDate)}&returnDate=${encodeURIComponent(returnDate)}`;
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
        <p className="text-muted-foreground">
          Para esas fechas la prenda no está disponible.{' '}
          <Link href={`/auth/login?redirect=${encodeURIComponent(redirect)}`} className="text-fuchsia-400 hover:text-fuchsia-300">
            Iniciá sesión
          </Link>{' '}
          para anotarte en la lista de espera y te avisamos si se libera.
        </p>
      </div>
    );
  }

  async function submit() {
    setErr(null);
    setMsg(null);
    setLoading(true);
    const res = await joinGarmentWaitlist({ garmentId, organizationId, pickupDate, returnDate });
    setLoading(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    setMsg('Listo. Te avisamos por email cuando vuelva a estar libre para esas fechas.');
  }

  return (
    <div className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/5 p-6">
      <h3 className="font-display text-lg font-semibold text-fuchsia-200">Lista de espera</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Las fechas que elegiste en el enlace se superponen con una reserva. Podés dejarnos tus datos y te avisamos si se libera.
      </p>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      {msg && <p className="mt-3 text-sm text-emerald-400/90">{msg}</p>}
      {!msg && (
        <button
          type="button"
          disabled={loading}
          onClick={submit}
          className="mt-4 w-full rounded-2xl border border-fuchsia-500/40 bg-fuchsia-600/20 py-3 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-600/30 disabled:opacity-50"
        >
          {loading ? 'Registrando…' : 'Avisame si se libera'}
        </button>
      )}
    </div>
  );
}

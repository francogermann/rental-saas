'use client';

import { useState } from 'react';
import { processGarmentWaitlistQueueFromAdmin } from '@/lib/actions/admin-waitlist';

export function ProcessWaitlistButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    const r = await processGarmentWaitlistQueueFromAdmin();
    setLoading(false);
    if (!r.ok) {
      setMessage(r.error ?? 'Error al procesar.');
      return;
    }
    setMessage(
      `Listo. Revisadas: ${r.scanned}. Emails enviados: ${r.notified}. Aún bloqueadas: ${r.skippedStillBlocked}. Sin email de usuario: ${r.skippedNoEmail}. Resend: ${r.emailConfigured ? 'sí' : 'no (revisá .env)'}.`,
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
      >
        {loading ? 'Procesando…' : 'Procesar lista de espera (emails)'}
      </button>
      {message ? <p className="text-xs text-muted-foreground leading-relaxed">{message}</p> : null}
    </div>
  );
}

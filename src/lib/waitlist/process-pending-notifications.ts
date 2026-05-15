import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { dateRangesOverlap } from '@/lib/date-range';

export type WaitlistBatchResult = {
  ok: boolean;
  scanned: number;
  notified: number;
  skippedStillBlocked: number;
  skippedNoEmail: number;
  emailConfigured: boolean;
  error?: string;
};

/**
 * Procesa filas de garment_waitlist con notified_at null: si el rango ya no
 * choca con bloqueos activos, envía mail (Resend) y marca notified_at.
 */
export async function runWaitlistNotificationsBatch(): Promise<WaitlistBatchResult> {
  const admin = createAdminClient();
  const { data: pending, error: qErr } = await admin
    .from('garment_waitlist')
    .select('id, user_id, garment_id, pickup_date, return_date')
    .is('notified_at', null)
    .order('created_at', { ascending: true })
    .limit(80);

  if (qErr) {
    return {
      ok: false,
      scanned: 0,
      notified: 0,
      skippedStillBlocked: 0,
      skippedNoEmail: 0,
      emailConfigured: false,
      error: qErr.message,
    };
  }

  const rows = pending ?? [];
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const resend = resendKey && from ? new Resend(resendKey) : null;

  let notified = 0;
  let skippedStillBlocked = 0;
  let skippedNoEmail = 0;

  for (const row of rows) {
    const { data: blocks } = await admin
      .from('garment_blocks')
      .select('date_from, date_to')
      .eq('garment_id', row.garment_id)
      .is('released_at', null);

    const stillBlocked = blocks?.some((b) =>
      dateRangesOverlap(row.pickup_date, row.return_date, b.date_from, b.date_to),
    );
    if (stillBlocked) {
      skippedStillBlocked += 1;
      continue;
    }

    if (!resend) {
      continue;
    }

    const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(row.user_id);
    const email = userRes.user?.email;
    if (userErr || !email) {
      skippedNoEmail += 1;
      continue;
    }

    const linkBase = siteUrl || '';
    const qs = `pickupDate=${encodeURIComponent(row.pickup_date)}&returnDate=${encodeURIComponent(row.return_date)}`;
    const link = linkBase ? `${linkBase}/catalog/${row.garment_id}?${qs}` : `/catalog/${row.garment_id}?${qs}`;

    const { error: sendErr } = await resend.emails.send({
      from: from!,
      to: email,
      subject: 'Tu vestido está disponible',
      html: `<p>Hola,</p><p>La prenda que estabas esperando volvió a estar libre para el rango que elegiste.</p><p><a href="${link}">Ver en el catálogo</a></p><p>Carpe Diem — Alquiler de vestidos</p>`,
    });
    if (sendErr) {
      continue;
    }

    const { error: upErr } = await admin
      .from('garment_waitlist')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('notified_at', null);

    if (!upErr) {
      notified += 1;
    }
  }

  return {
    ok: true,
    scanned: rows.length,
    notified,
    skippedStillBlocked,
    skippedNoEmail,
    emailConfigured: Boolean(resend),
  };
}

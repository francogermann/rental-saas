import { NextResponse } from 'next/server';
import { runWaitlistNotificationsBatch } from '@/lib/waitlist/process-pending-notifications';

export const dynamic = 'force-dynamic';

/** Opcional: cron externo gratuito o curl manual con Authorization: Bearer CRON_SECRET */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runWaitlistNotificationsBatch();
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    scanned: result.scanned,
    notified: result.notified,
    skippedStillBlocked: result.skippedStillBlocked,
    skippedNoEmail: result.skippedNoEmail,
    emailConfigured: result.emailConfigured,
  });
}

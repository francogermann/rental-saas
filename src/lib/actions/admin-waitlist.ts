'use server';

import { getAdminSession } from '@/lib/admin-auth-server';
import { adminHasPermission } from '@/lib/admin-permissions';
import { runWaitlistNotificationsBatch, type WaitlistBatchResult } from '@/lib/waitlist/process-pending-notifications';

/** Panel admin: mismo trabajo que GET /api/cron/waitlist (sin CRON_SECRET). */
export async function processGarmentWaitlistQueueFromAdmin(): Promise<WaitlistBatchResult> {
  const session = await getAdminSession();
  if (!session || !adminHasPermission(session.role, 'reservations:write')) {
    return {
      ok: false,
      scanned: 0,
      notified: 0,
      skippedStillBlocked: 0,
      skippedNoEmail: 0,
      emailConfigured: false,
      error: 'No autorizado.',
    };
  }
  return runWaitlistNotificationsBatch();
}

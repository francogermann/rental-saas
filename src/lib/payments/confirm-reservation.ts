import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export type ConfirmPaymentResult =
  | { ok: true; reservationId: string; blockId: string | null; status: string; alreadyConfirmed?: boolean }
  | { ok: false; code: string; error: string };

export type CancelPendingResult =
  | { ok: true; reservationId: string; status: string; alreadyCancelled?: boolean }
  | { ok: false; code: string; error: string };

function mapRpcError(message: string): { code: string; error: string } {
  if (message.includes('CONFLICT') || message.includes('P0004')) {
    return {
      code: 'CONFLICT',
      error: 'Esas fechas ya fueron reservadas por otra clienta. Si pagaste, contactá a la tienda para el reembolso.',
    };
  }
  if (message.includes('NOT_FOUND') || message.includes('P0002')) {
    return { code: 'NOT_FOUND', error: 'Reserva no encontrada.' };
  }
  if (message.includes('INVALID_STATUS')) {
    return { code: 'INVALID_STATUS', error: 'La reserva ya no está pendiente de pago.' };
  }
  return { code: 'UNKNOWN', error: 'No se pudo procesar la reserva.' };
}

export async function confirmReservationPayment(
  admin: SupabaseClient<Database>,
  reservationId: string,
  mpMeta?: { paymentId?: string; paymentStatus?: string },
): Promise<ConfirmPaymentResult> {
  const { data, error } = await admin.rpc('confirm_reservation_payment', {
    p_reservation_id: reservationId,
    p_mp_payment_id: mpMeta?.paymentId ?? undefined,
    p_mp_payment_status: mpMeta?.paymentStatus ?? 'approved',
  });

  if (error) {
    const mapped = mapRpcError(error.message ?? '');
    return { ok: false, ...mapped };
  }

  const row = data as { reservation_id?: string; block_id?: string | null; status?: string; already_confirmed?: boolean } | null;
  if (!row?.reservation_id) {
    return { ok: false, code: 'UNKNOWN', error: 'Respuesta inválida al confirmar el pago.' };
  }

  return {
    ok: true,
    reservationId: row.reservation_id,
    blockId: row.block_id ?? null,
    status: row.status ?? 'paid',
    alreadyConfirmed: Boolean(row.already_confirmed),
  };
}

export async function cancelPendingReservation(
  admin: SupabaseClient<Database>,
  reservationId: string,
): Promise<CancelPendingResult> {
  const { data, error } = await admin.rpc('cancel_pending_reservation', {
    p_reservation_id: reservationId,
  });

  if (error) {
    const mapped = mapRpcError(error.message ?? '');
    return { ok: false, ...mapped };
  }

  const row = data as { reservation_id?: string; status?: string; already_cancelled?: boolean } | null;
  if (!row?.reservation_id) {
    return { ok: false, code: 'UNKNOWN', error: 'Respuesta inválida al cancelar.' };
  }

  return {
    ok: true,
    reservationId: row.reservation_id,
    status: row.status ?? 'cancelled',
    alreadyCancelled: Boolean(row.already_cancelled),
  };
}

export type ConfirmManyResult = {
  confirmed: string[];
  failed: { reservationId: string; error: string; code: string }[];
};

export async function confirmManyReservationPayments(
  admin: SupabaseClient<Database>,
  reservationIds: string[],
  mpMeta?: { paymentId?: string },
): Promise<ConfirmManyResult> {
  const confirmed: string[] = [];
  const failed: ConfirmManyResult['failed'] = [];

  for (const id of reservationIds) {
    const res = await confirmReservationPayment(admin, id, mpMeta);
    if (res.ok) {
      confirmed.push(id);
    } else {
      failed.push({ reservationId: id, error: res.error, code: res.code });
      if (res.code === 'CONFLICT') {
        await cancelPendingReservation(admin, id);
      }
    }
  }

  return { confirmed, failed };
}

export async function cancelManyPendingReservations(
  admin: SupabaseClient<Database>,
  reservationIds: string[],
): Promise<void> {
  for (const id of reservationIds) {
    await cancelPendingReservation(admin, id);
  }
}

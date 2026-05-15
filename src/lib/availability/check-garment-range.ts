import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { dateRangesOverlap } from '@/lib/date-range';

export type GarmentAvailabilityResult =
  | { ok: true }
  | { ok: false; reason: 'blocked' | 'not_found' | 'invalid_dates'; message: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function mapCreateReservationError(error: string | null, code?: string): string {
  const msg = error ?? '';
  if (code === 'P0004' || msg.includes('CONFLICT')) {
    return 'Esas fechas acaban de reservarse. Elegí otras fechas u otra prenda.';
  }
  if (code === 'P0003' || msg.includes('BLOCKED_CUSTOMER')) {
    return 'Tu cuenta tiene una restricción activa. Contactá a la tienda.';
  }
  if (msg.includes('PICKUP_MISMATCH') || msg.includes('sede')) {
    return msg;
  }
  if (msg.trim()) {
    return msg;
  }
  return 'No se pudo crear la reserva. Intentá de nuevo.';
}

export async function isGarmentAvailableForRange(
  admin: SupabaseClient<Database>,
  garmentId: string,
  pickupDate: string,
  returnDate: string,
): Promise<GarmentAvailabilityResult> {
  if (!DATE_RE.test(pickupDate) || !DATE_RE.test(returnDate)) {
    return { ok: false, reason: 'invalid_dates', message: 'Fechas inválidas.' };
  }
  if (pickupDate > returnDate) {
    return { ok: false, reason: 'invalid_dates', message: 'La fecha de retiro debe ser anterior a la devolución.' };
  }

  const { data: garment, error: gErr } = await admin
    .from('garments')
    .select('id')
    .eq('id', garmentId)
    .is('deleted_at', null)
    .maybeSingle();

  if (gErr || !garment) {
    return { ok: false, reason: 'not_found', message: 'La prenda no está disponible.' };
  }

  const { data: blocks, error: bErr } = await admin
    .from('garment_blocks')
    .select('date_from, date_to')
    .eq('garment_id', garmentId)
    .is('released_at', null)
    .lte('date_from', returnDate)
    .gte('date_to', pickupDate);

  if (bErr) {
    console.error('[isGarmentAvailableForRange]', bErr.message);
    return { ok: false, reason: 'blocked', message: 'No se pudo verificar disponibilidad.' };
  }

  const hasOverlap = (blocks ?? []).some((b) =>
    dateRangesOverlap(pickupDate, returnDate, b.date_from, b.date_to),
  );

  if (hasOverlap) {
    return {
      ok: false,
      reason: 'blocked',
      message: 'Esta prenda no está disponible para las fechas seleccionadas.',
    };
  }

  return { ok: true };
}

export type CartAvailabilityItem = {
  garmentId: string;
  garmentName?: string;
  pickupDate: string;
  returnDate: string;
};

export type CartAvailabilityFailure = {
  garmentId: string;
  garmentName: string;
  message: string;
};

export type CartAvailabilityResult =
  | { ok: true }
  | { ok: false; failures: CartAvailabilityFailure[] };

export async function validateCartGarmentRanges(
  admin: SupabaseClient<Database>,
  items: CartAvailabilityItem[],
): Promise<CartAvailabilityResult> {
  const failures: CartAvailabilityFailure[] = [];

  for (const item of items) {
    const check = await isGarmentAvailableForRange(
      admin,
      item.garmentId,
      item.pickupDate,
      item.returnDate,
    );
    if (!check.ok) {
      failures.push({
        garmentId: item.garmentId,
        garmentName: item.garmentName ?? 'Prenda',
        message: check.message,
      });
    }
  }

  if (failures.length > 0) {
    return { ok: false, failures };
  }
  return { ok: true };
}

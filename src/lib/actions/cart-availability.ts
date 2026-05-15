'use server';

import { createAdminClient } from '@/lib/supabase/server';
import {
  isGarmentAvailableForRange,
  validateCartGarmentRanges,
  type CartAvailabilityItem,
} from '@/lib/availability/check-garment-range';

export async function checkGarmentAvailabilityAction(
  garmentId: string,
  pickupDate: string,
  returnDate: string,
): Promise<{ available: boolean; message?: string }> {
  const admin = createAdminClient();
  const result = await isGarmentAvailableForRange(admin, garmentId, pickupDate, returnDate);
  if (result.ok) {
    return { available: true };
  }
  return { available: false, message: result.message };
}

export async function validateCartAvailabilityAction(
  items: CartAvailabilityItem[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!items.length) {
    return { ok: false, message: 'El carrito está vacío.' };
  }

  const admin = createAdminClient();
  const result = await validateCartGarmentRanges(admin, items);

  if (result.ok) {
    return { ok: true };
  }

  const first = result.failures[0];
  const message =
    result.failures.length === 1
      ? `${first.garmentName}: ${first.message}`
      : `${first.garmentName} y ${result.failures.length - 1} prenda(s) más no están disponibles para las fechas elegidas.`;

  return { ok: false, message };
}

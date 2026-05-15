'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import {
  cancelManyPendingReservations,
  cancelPendingReservation,
  confirmManyReservationPayments,
} from '@/lib/payments/confirm-reservation';
import { isMockCheckoutEnabled } from '@/lib/payments/checkout-mode';

function parseRefs(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function mockApprovePayment(formData: FormData) {
  if (!isMockCheckoutEnabled()) {
    throw new Error('Mock checkout no disponible');
  }

  const refs = parseRefs(String(formData.get('refs') ?? ''));
  if (refs.length === 0) {
    redirect('/checkout/failure?error=Reserva+invalida');
  }

  const admin = createAdminClient();
  const result = await confirmManyReservationPayments(admin, refs, { paymentId: `mock-${Date.now()}` });

  revalidatePath('/admin/reservations');
  revalidatePath('/admin/agenda');

  if (result.confirmed.length === 0) {
    const msg = encodeURIComponent(result.failed[0]?.error ?? 'No se pudo confirmar el pago');
    redirect(`/checkout/failure?ref=${refs[0]}&error=${msg}`);
  }

  if (result.failed.length > 0) {
    const partial = encodeURIComponent(
      `Se confirmaron ${result.confirmed.length} reserva(s). ${result.failed.length} no disponible(s) por conflicto de fechas.`,
    );
    redirect(`/checkout/success?ref=${result.confirmed[0]}&notice=${partial}`);
  }

  redirect(`/checkout/success?ref=${result.confirmed[0]}`);
}

export async function mockRejectPayment(formData: FormData) {
  if (!isMockCheckoutEnabled()) {
    throw new Error('Mock checkout no disponible');
  }

  const refs = parseRefs(String(formData.get('refs') ?? ''));
  const admin = createAdminClient();
  await cancelManyPendingReservations(admin, refs);

  revalidatePath('/admin/reservations');

  redirect(refs[0] ? `/checkout/failure?ref=${refs[0]}` : '/checkout/failure');
}

export async function mockAbandonPayment(formData: FormData) {
  if (!isMockCheckoutEnabled()) {
    throw new Error('Mock checkout no disponible');
  }

  const refs = parseRefs(String(formData.get('refs') ?? ''));
  const admin = createAdminClient();
  await cancelManyPendingReservations(admin, refs);

  revalidatePath('/admin/reservations');

  redirect('/catalog');
}

export async function cancelPendingReservationFromRef(ref: string | undefined) {
  if (!ref?.trim()) return;
  const admin = createAdminClient();
  await cancelPendingReservation(admin, ref.trim());
  revalidatePath('/admin/reservations');
}

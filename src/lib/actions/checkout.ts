/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { createReservation } from '@/lib/actions/availability';
import { findOrCreateCheckoutCustomer } from '@/lib/checkout-customer';
import { getStorefrontOrgId } from '@/lib/storefront-org';
import { redirectToPaymentAfterReservations } from '@/lib/payments/start-payment';
import { mapCreateReservationError } from '@/lib/availability/check-garment-range';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export async function processCheckout(formData: FormData) {
  const garmentId = formData.get('garmentId') as string;
  const pickupDate = formData.get('pickupDate') as string;
  const returnDate = formData.get('returnDate') as string;
  const pickupLocationId = String(formData.get('pickupLocationId') ?? '').trim();

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;

  if (!garmentId || !pickupDate || !returnDate || !firstName || !lastName || !email) {
    redirect(`/catalog/${garmentId}?error=Faltan+campos`);
  }

  if (!z.string().uuid().safeParse(pickupLocationId).success) {
    redirect(`/catalog/${garmentId}?error=Sede+de+retiro+invalida`);
  }

  const supabase = createAdminClient();
  const authSupabase = createServerClient();

  const orgResult = await getStorefrontOrgId(supabase);
  if ('error' in orgResult) {
    redirect(`/catalog/${garmentId}?error=Organizacion+no+encontrada`);
  }
  const orgId = orgResult.orgId;

  const { data: garment, error: garmentError } = await supabase
    .from('garments')
    .select('name, rental_price, deposit_amount, location_id')
    .eq('id', garmentId)
    .is('deleted_at', null)
    .single();

  if (garmentError || !garment) {
    redirect(`/catalog/${garmentId}?error=Prenda+invalida`);
  }

  if (garment.location_id && garment.location_id !== pickupLocationId) {
    redirect(`/catalog/${garmentId}?error=Sede+no+coincide+con+la+prenda`);
  }

  const payTodayAmount = garment.deposit_amount || 0;

  const customerResult = await findOrCreateCheckoutCustomer(supabase, authSupabase, {
    orgId,
    firstName,
    lastName,
    email,
    phone,
  });
  if ('error' in customerResult) {
    redirect(`/catalog/${garmentId}?error=Error+creando+cliente`);
  }
  const customerId = customerResult.customerId;

  const reserveResult = await createReservation({
    garmentId,
    customerId,
    pickupDate,
    returnDate,
    rentalPrice: garment.rental_price || 0,
    depositAmount: garment.deposit_amount || 0,
    pickupLocationId,
  });

  if (reserveResult.error || !reserveResult.data) {
    const msg = encodeURIComponent(
      mapCreateReservationError(reserveResult.error, reserveResult.code),
    );
    redirect(`/catalog/${garmentId}?error=${msg}`);
  }

  const reservationId = reserveResult.data.reservation_id;

  try {
    await redirectToPaymentAfterReservations({
      reservationIds: [reservationId],
      payerEmail: email,
      payerName: `${firstName} ${lastName}`,
      items: [
        {
          id: garmentId,
          title: `Alquiler: ${garment.name}`,
          unit_price: payTodayAmount,
        },
      ],
      statementDescriptor: 'MAISON RENTALS',
      failureRedirectPath: `/catalog/${garmentId}`,
    });
  } catch (err) {
    console.error('processCheckout payment redirect:', err);
    redirect(`/catalog/${garmentId}?error=Error+al+iniciar+el+pago`);
  }
}

export async function processCartCheckout(formData: FormData) {
  const cartPayload = formData.get('cartPayload') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;

  if (!cartPayload || !firstName || !lastName || !email) {
    return { error: 'Faltan campos obligatorios' };
  }

  let cartItems;
  try {
    cartItems = JSON.parse(cartPayload);
  } catch {
    return { error: 'Payload del carrito inválido' };
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { error: 'El carrito está vacío' };
  }

  const supabase = createAdminClient();
  const authSupabase = createServerClient();

  const orgResult = await getStorefrontOrgId(supabase);
  if ('error' in orgResult) {
    return { error: 'Organización no encontrada' };
  }
  const orgId = orgResult.orgId;

  const customerResult = await findOrCreateCheckoutCustomer(supabase, authSupabase, {
    orgId,
    firstName,
    lastName,
    email,
    phone,
  });
  if ('error' in customerResult) {
    return { error: customerResult.error };
  }
  const customerId = customerResult.customerId;

  const reservationIds: string[] = [];
  const preferenceItems: { id: string; title: string; unit_price: number }[] = [];

  for (const item of cartItems) {
    const pickupLoc = typeof item.pickupLocationId === 'string' ? item.pickupLocationId.trim() : '';
    if (!z.string().uuid().safeParse(pickupLoc).success) {
      return { error: 'Sede de retiro inválida en el carrito. Volvé al catálogo y elegí una sede.' };
    }

    const { data: garment, error: garmentError } = await supabase
      .from('garments')
      .select('name, rental_price, deposit_amount, location_id')
      .eq('id', item.garment.id)
      .is('deleted_at', null)
      .single();

    if (garmentError || !garment) {
      return { error: `La prenda ${item.garment?.name || 'desconocida'} ya no está disponible.` };
    }

    if (garment.location_id && garment.location_id !== pickupLoc) {
      return {
        error: `La sede de retiro no coincide con la ubicación de «${garment.name}». Actualizá el carrito desde el catálogo.`,
      };
    }

    const payTodayAmount = garment.deposit_amount || 0;

    const reserveResult = await createReservation({
      garmentId: item.garment.id,
      customerId,
      pickupDate: item.pickupDate,
      returnDate: item.returnDate,
      rentalPrice: garment.rental_price || 0,
      depositAmount: garment.deposit_amount || 0,
      pickupLocationId: pickupLoc,
    });

    if (reserveResult.error || !reserveResult.data) {
      const detail = mapCreateReservationError(reserveResult.error, reserveResult.code);
      return { error: `${garment.name}: ${detail}` };
    }

    reservationIds.push(reserveResult.data.reservation_id);
    preferenceItems.push({
      id: item.garment.id,
      title: `Alquiler: ${garment.name}`,
      unit_price: payTodayAmount,
    });
  }

  try {
    await redirectToPaymentAfterReservations({
      reservationIds,
      payerEmail: email,
      payerName: `${firstName} ${lastName}`,
      items: preferenceItems,
      statementDescriptor: 'CARPE DIEM Alquiler',
    });
  } catch (mpError) {
    console.error('processCartCheckout payment redirect:', mpError);
    return { error: 'Error al iniciar el pago. Intentá de nuevo.' };
  }
}

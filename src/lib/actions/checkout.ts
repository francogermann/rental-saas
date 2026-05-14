/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { createReservation } from '@/lib/actions/availability';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { redirect } from 'next/navigation';

// Get MP Token from Server Environment variables
const mpAccessToken = process.env.MP_ACCESS_TOKEN || '';

export async function processCheckout(formData: FormData) {
  const garmentId = formData.get('garmentId') as string;
  const pickupDate = formData.get('pickupDate') as string;
  const returnDate = formData.get('returnDate') as string;
  
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;

  if (!garmentId || !pickupDate || !returnDate || !firstName || !lastName || !email) {
    redirect(`/catalog/${garmentId}?error=Faltan+campos`);
  }

  const supabase = createAdminClient();

  // 1. Get Organization
  const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'maison-demo')
      .single();

  if (orgError) {
      redirect(`/catalog/${garmentId}?error=Organizacion+no+encontrada`);
  }
  const orgId = orgData.id;

  // 2. Get Garment to compute price securely on the backend
  const { data: garment, error: garmentError } = await supabase
      .from('garments')
      .select('name, rental_price, deposit_amount')
      .eq('id', garmentId)
      .single();

  if (garmentError || !garment) {
      redirect(`/catalog/${garmentId}?error=Prenda+invalida`);
  }

  const totalAmount = (garment.rental_price || 0) + (garment.deposit_amount || 0);

  // 3. Find or Create Customer
  let customerId: string;
  const { data: existCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .eq('organization_id', orgId)
      .single();

  if (existCustomer) {
      customerId = existCustomer.id;
  } else {
      const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
              organization_id: orgId,
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone: phone || null
          })
          .select('id')
          .single();

      if (createError) {
          console.error("Customer error:", createError);
          redirect(`/catalog/${garmentId}?error=Error+creando+cliente`);
      }
      customerId = newCustomer.id;
  }

  // 4. Create Reservation Block
  const reserveResult = await createReservation({
      garmentId,
      customerId,
      pickupDate,
      returnDate,
      rentalPrice: garment.rental_price || 0,
      depositAmount: garment.deposit_amount || 0,
  });

  if (reserveResult.error || !reserveResult.data) {
      redirect(`/catalog/${garmentId}?error=Esta+prenda+ya+fue+reservada`);
  }

  const reservationId = reserveResult.data.reservation_id;

  // 5. Connect MercadoPago
  if (!mpAccessToken) {
     redirect(`/catalog/${garmentId}?error=Credenciales+MercadoPago+faltantes`);
  }

  try {
      const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
      const preference = new Preference(client);

      const prefResult = await preference.create({
          body: {
              items: [
                  {
                      id: garmentId,
                      title: `Alquiler: ${garment.name}`,
                      quantity: 1,
                      unit_price: totalAmount,
                      currency_id: 'UYU',
                  }
              ],
              payer: {
                  email: email,
                  name: `${firstName} ${lastName}`,
              },
              external_reference: reservationId,
              back_urls: {
                  success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?ref=${reservationId}`,
                  failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/failure?ref=${reservationId}`,
                  pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/pending?ref=${reservationId}`,
              },
              auto_return: 'approved',
              statement_descriptor: 'MAISON RENTALS',
          }
      });

      if (!prefResult.init_point) {
          throw new Error('Sin init_point');
      }

      // Return MercadoPago URL redirect
      redirect(prefResult.init_point);

  } catch (mercadopagoError) {
      console.error(mercadopagoError);
      redirect(`/catalog/${garmentId}?error=Error+MercadoPago`);
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

  // 1. Get Organization
  const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'maison-demo')
      .single();

  if (orgError || !orgData) {
      return { error: 'Organización no encontrada' };
  }
  const orgId = orgData.id;

  // 2. Find or Create Customer
  let customerId: string;
  const { data: existCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .eq('organization_id', orgId)
      .single();

  if (existCustomer) {
      customerId = existCustomer.id;
  } else {
      const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
              organization_id: orgId,
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone: phone || null
          })
          .select('id')
          .single();

      if (createError || !newCustomer) {
          console.error("Customer error:", createError);
          return { error: 'Error agregando el cliente' };
      }
      customerId = newCustomer.id;
  }

  // 3. Create Reservations per garment
  const reservationIds: string[] = [];
  const preferenceItems: any[] = [];
  
  for (const item of cartItems) {
    const { data: garment, error: garmentError } = await supabase
      .from('garments')
      .select('name, rental_price, deposit_amount')
      .eq('id', item.garment.id)
      .single();
      
    if (garmentError || !garment) {
      return { error: `La prenda ${item.garment?.name || 'desconocida'} ya no está disponible.` };
    }

    const itemTotal = (garment.rental_price || 0) + (garment.deposit_amount || 0);

    const reserveResult = await createReservation({
      garmentId: item.garment.id,
      customerId,
      pickupDate: item.pickupDate,
      returnDate: item.returnDate,
      rentalPrice: garment.rental_price || 0,
      depositAmount: garment.deposit_amount || 0,
    });

    if (reserveResult.error || !reserveResult.data) {
      return { error: `La prenda ${garment.name} no está disponible para las fechas seleccionadas.` };
    }

    reservationIds.push(reserveResult.data.reservation_id);
    preferenceItems.push({
      id: item.garment.id,
      title: `Alquiler: ${garment.name}`,
      quantity: 1,
      unit_price: itemTotal,
      currency_id: 'UYU',
    });
  }

  // 4. Connect MercadoPago
  if (!mpAccessToken) {
    return { error: 'Integración de MercadoPago no configurada.' };
  }

  const externalRef = reservationIds.join(',').slice(0, 256);

  try {
      const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
      const preference = new Preference(client);

      const prefResult = await preference.create({
          body: {
              items: preferenceItems,
              payer: {
                  email: email,
                  name: `${firstName} ${lastName}`,
              },
              external_reference: externalRef,
              metadata: {
                 reservation_ids: reservationIds.join(','),
              },
              back_urls: {
                  success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?ref=${reservationIds[0]}`,
                  failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/failure?ref=${reservationIds[0]}`,
                  pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/pending?ref=${reservationIds[0]}`,
              },
              auto_return: 'approved',
              statement_descriptor: 'CARPE DIEM Alquiler',
          }
      });

      if (!prefResult.init_point) {
          throw new Error('Sin init_point devuelto por MercadoPago');
      }

      redirect(prefResult.init_point);
      
  } catch (mpError: any) {
      console.error('MercadoPago Preference Error:', mpError);
      return { error: 'Error procesando el pago en MercadoPago. Intente más tarde.' };
  }
}

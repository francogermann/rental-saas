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
                      currency_id: 'ARS',
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

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// API Route for MercadoPago Webhooks
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verify it's a payment webhook
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id;
      
      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        throw new Error('MP_ACCESS_TOKEN no configurado');
      }

      // Fetch payment details directly from MercadoPago using the SDK
      const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo && paymentInfo.status === 'approved') {
        // Extract the original external reference (our reservation IDs separated by comma)
        const rawExternalRef = paymentInfo.external_reference || '';
        // Also check metadata if externalRef was truncated
        const metadataResIds = paymentInfo.metadata?.reservation_ids;

        const idsToUpdateStr = metadataResIds || rawExternalRef;
        if (!idsToUpdateStr) {
          console.warn(`Pago ${paymentId} sin external_reference ni metadata. Ignorando.`);
          return NextResponse.json({ success: true });
        }

        const reservationIds = idsToUpdateStr.split(',').map((id: string) => id.trim()).filter(Boolean);

        if (reservationIds.length > 0) {
          const supabase = createAdminClient();

          // Update all mapped reservations to 'paid' status
          const { error } = await supabase
            .from('reservations')
            .update({ 
               status: 'paid', 
               mp_preference_id: paymentInfo.order?.id?.toString() || paymentId.toString() 
            })
            .in('id', reservationIds);

          if (error) {
            console.error('Error updating reservations to paid:', error);
            // Don't fail the webhook completely so MP doesn't retry unnecessarily if it's our internal DB issue, 
            // though returning 500 would make MP retry.
            return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
          }
          
          console.log(`Pago ${paymentId} procesado. Reservas confirmadas: ${reservationIds.length}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 400 }
    );
  }
}

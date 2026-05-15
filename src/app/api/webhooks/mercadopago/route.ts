import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { confirmManyReservationPayments } from '@/lib/payments/confirm-reservation';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === 'payment' && body.data?.id) {
      const paymentId = String(body.data.id);

      const mpAccessToken = process.env.MP_ACCESS_TOKEN;
      if (!mpAccessToken) {
        throw new Error('MP_ACCESS_TOKEN no configurado');
      }

      const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo && paymentInfo.status === 'approved') {
        const rawExternalRef = paymentInfo.external_reference || '';
        const metadataResIds = paymentInfo.metadata?.reservation_ids;
        const idsToUpdateStr = metadataResIds || rawExternalRef;

        if (!idsToUpdateStr) {
          console.warn(`Pago ${paymentId} sin external_reference ni metadata. Ignorando.`);
          return NextResponse.json({ success: true });
        }

        const reservationIds = idsToUpdateStr
          .split(',')
          .map((id: string) => id.trim())
          .filter(Boolean);

        if (reservationIds.length > 0) {
          const supabase = createAdminClient();
          const result = await confirmManyReservationPayments(supabase, reservationIds, {
            paymentId: paymentId.toString(),
          });

          if (result.confirmed.length > 0) {
            console.log(
              `Pago ${paymentId} procesado. Reservas confirmadas: ${result.confirmed.length}`,
            );
          }

          if (result.failed.length > 0) {
            for (const f of result.failed) {
              console.error(
                `Pago ${paymentId}: reserva ${f.reservationId} no confirmada (${f.code}): ${f.error}`,
              );
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Error procesando webhook' }, { status: 400 });
  }
}

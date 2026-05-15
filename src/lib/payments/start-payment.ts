import { MercadoPagoConfig, Preference } from 'mercadopago';
import { redirect } from 'next/navigation';
import { getCheckoutPaymentMode } from '@/lib/payments/checkout-mode';

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export type MpPreferenceItem = {
  id: string;
  title: string;
  unit_price: number;
};

export async function redirectToPaymentAfterReservations(opts: {
  reservationIds: string[];
  payerEmail: string;
  payerName: string;
  items: MpPreferenceItem[];
  statementDescriptor?: string;
  failureRedirectPath?: string;
}): Promise<never> {
  const { reservationIds, payerEmail, payerName, items } = opts;
  const primaryRef = reservationIds[0];
  const refsQuery = reservationIds.join(',');
  const mode = getCheckoutPaymentMode();

  if (mode === 'mock') {
    redirect(`/checkout/mock?refs=${encodeURIComponent(refsQuery)}`);
  }

  const mpAccessToken = process.env.MP_ACCESS_TOKEN?.trim();
  if (!mpAccessToken) {
    if (opts.failureRedirectPath) {
      redirect(`${opts.failureRedirectPath}?error=Credenciales+MercadoPago+faltantes`);
    }
    throw new Error('MP_ACCESS_TOKEN no configurado');
  }

  const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
  const preference = new Preference(client);
  const externalRef = reservationIds.join(',').slice(0, 256);

  const prefResult = await preference.create({
    body: {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: 1,
        unit_price: item.unit_price,
        currency_id: 'UYU',
      })),
      payer: {
        email: payerEmail,
        name: payerName,
      },
      external_reference: externalRef,
      metadata: {
        reservation_ids: reservationIds.join(','),
      },
      back_urls: {
        success: `${siteUrl()}/checkout/success?ref=${primaryRef}`,
        failure: `${siteUrl()}/checkout/failure?ref=${primaryRef}`,
        pending: `${siteUrl()}/checkout/pending?ref=${primaryRef}`,
      },
      auto_return: 'approved',
      statement_descriptor: opts.statementDescriptor ?? 'MAISON RENTALS',
    },
  });

  if (!prefResult.init_point) {
    throw new Error('Sin init_point de MercadoPago');
  }

  redirect(prefResult.init_point);
}

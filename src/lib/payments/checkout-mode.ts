export type CheckoutPaymentMode = 'mock' | 'mercadopago';

export function getCheckoutPaymentMode(): CheckoutPaymentMode {
  if (process.env.NODE_ENV === 'production') {
    return 'mercadopago';
  }

  const explicit = process.env.CHECKOUT_PAYMENT_MODE?.trim().toLowerCase();
  if (explicit === 'mock') {
    return 'mock';
  }
  if (explicit === 'mercadopago') {
    return 'mercadopago';
  }

  const mpToken = process.env.MP_ACCESS_TOKEN?.trim();
  if (!mpToken) {
    return 'mock';
  }

  return 'mercadopago';
}

export function isMockCheckoutEnabled(): boolean {
  return getCheckoutPaymentMode() === 'mock';
}

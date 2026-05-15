import { isMockCheckoutEnabled } from '@/lib/payments/checkout-mode';

export function getCheckoutSubmitLabel(isProcessing = false): string {
  if (isProcessing) {
    return isMockCheckoutEnabled() ? 'Preparando simulación…' : 'Generando pago seguro…';
  }
  return isMockCheckoutEnabled() ? 'Simular pago (desarrollo)' : 'Continuar al pago';
}

export const CHECKOUT_PAYMENT_HINT =
  'Las fechas no se reservan hasta confirmar el pago. Si otra clienta paga antes, esas fechas pueden dejar de estar disponibles.';

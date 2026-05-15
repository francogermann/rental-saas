import { CheckoutCartClient } from './CheckoutCartClient';
import { CHECKOUT_PAYMENT_HINT, getCheckoutSubmitLabel } from '@/lib/payments/checkout-pay-copy';

export default function CheckoutPage() {
  return (
    <CheckoutCartClient submitLabel={getCheckoutSubmitLabel()} paymentHint={CHECKOUT_PAYMENT_HINT} />
  );
}

import Link from 'next/link';
import { cancelPendingReservationFromRef } from '@/lib/actions/checkout-payment';

export default async function CheckoutFailurePage({
  searchParams,
}: {
  searchParams: { ref?: string; error?: string };
}) {
  await cancelPendingReservationFromRef(searchParams.ref);

  const errorMessage = searchParams.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:p-6 text-center animate-in fade-in duration-500 max-w-lg mx-auto w-full">
      <div className="w-20 h-20 bg-destructive/20 text-destructive rounded-full flex items-center justify-center text-4xl mb-8 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
        ✕
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">Algo salió mal</h1>
      <p className="text-xl text-muted-foreground max-w-lg mb-4 leading-relaxed">
        No pudimos confirmar tu pago. La reserva quedó cancelada y las fechas siguen disponibles en el catálogo.
      </p>
      {errorMessage ? (
        <p className="text-sm text-amber-200/90 mb-8 max-w-md">{errorMessage}</p>
      ) : (
        <p className="mb-8" />
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          href="/checkout"
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl px-8 py-3.5 font-bold transition-colors shadow-glow"
        >
          Intentar de nuevo
        </Link>
        <Link
          href="/catalog"
          className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-8 py-3.5 font-bold transition-colors"
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}

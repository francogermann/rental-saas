'use client';

import { useCart } from './CartContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatUy } from '@/lib/utils';
import { validateCartAvailabilityAction } from '@/lib/actions/cart-availability';
import { useState } from 'react';

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, totalSubtotal, totalDeposit } = useCart();
  const router = useRouter();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  if (!isCartOpen) return null;

  const handleContinueCheckout = async () => {
    setCheckoutError(null);
    setIsValidating(true);
    const result = await validateCartAvailabilityAction(
      items.map((item) => ({
        garmentId: item.garment.id,
        garmentName: item.garment.name,
        pickupDate: item.pickupDate,
        returnDate: item.returnDate,
      })),
    );
    setIsValidating(false);

    if (!result.ok) {
      setCheckoutError(result.message);
      return;
    }

    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-950/80 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-display font-bold">Tu Reserva</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-muted-foreground hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground opacity-70">
              <span className="text-4xl mb-4">🛒</span>
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.garment.id}
                className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 relative group"
              >
                <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-muted shrink-0">
                  {item.garment.photos_urls && item.garment.photos_urls[0] ? (
                    <Image
                      src={item.garment.photos_urls[0]}
                      alt={item.garment.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">✨</div>
                  )}
                </div>

                <div className="flex flex-col flex-1 py-1">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-snug pr-6">{item.garment.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="bg-white/5 px-2 py-0.5 rounded-sm">Talle {item.garment.size_label || '-'}</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded-sm">{item.garment.category || '-'}</span>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    {item.garment.location_name ? (
                      <p className="mb-1 text-fuchsia-200/80">
                        Sede: <span className="text-foreground">{item.garment.location_name}</span>
                      </p>
                    ) : null}
                    <p>
                      Retiro: <span className="text-foreground">{item.pickupDate}</span>
                    </p>
                    <p>
                      Devolución: <span className="text-foreground">{item.returnDate}</span>
                    </p>
                  </div>

                  <div className="mt-auto pt-2 flex items-end justify-between">
                    <span className="font-bold text-lg">{formatUy(item.garment.rental_price)}</span>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.garment.id)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-white/[0.02]">
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal (Alquiler)</span>
                <span>{formatUy(totalSubtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Garantía Reembolsable</span>
                <span>{formatUy(totalDeposit)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                <span>Total a pagar hoy</span>
                <span className="text-fuchsia-400">{formatUy(totalSubtotal + totalDeposit)}</span>
              </div>
            </div>

            {checkoutError ? (
              <p className="mb-4 text-sm text-destructive">{checkoutError}</p>
            ) : null}

            <button
              type="button"
              disabled={isValidating}
              onClick={() => void handleContinueCheckout()}
              className="w-full flex items-center justify-center bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl py-4 font-bold tracking-wide transition-all shadow-glow hover:shadow-glow-lg disabled:opacity-50"
            >
              {isValidating ? 'Verificando disponibilidad…' : 'Continuar al Checkout'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

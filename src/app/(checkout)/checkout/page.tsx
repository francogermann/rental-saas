'use client';

import { useCart } from '@/components/cart/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { processCartCheckout } from '@/lib/actions/checkout';
import { useState } from 'react';
import { formatUy } from '@/lib/utils';

export default function CheckoutClientPage() {
  const { items, totalSubtotal, totalDeposit } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If cart is empty, redirect back to catalog
  if (items.length === 0) {
    return (
      <div className="min-h-screen py-32 flex flex-col items-center justify-center text-center px-6">
        <p className="text-muted-foreground mb-4">Tu carrito está vacío.</p>
        <button 
          onClick={() => router.push('/catalog')}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl px-6 py-3 font-semibold transition-colors"
        >
          Ir al catálogo
        </button>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      // Append the serialized cart items
      formData.append('cartPayload', JSON.stringify(items));
      
      const resultAction = await processCartCheckout(formData);
      
      if (resultAction?.error) {
        setError(resultAction.error);
        setIsProcessing(false);
      }
      // If successful, the server action triggers redirect to MP, so we don't need else.
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado al procesar tu reserva.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,hsl(315_100%_60%/.1),transparent_50%)]" />

      <div className="container mx-auto max-w-6xl py-24 px-6 relative z-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 tracking-tight">Finalizar Reserva</h1>
        <p className="text-muted-foreground mb-10">Completá tus datos para confirmar el alquiler.</p>
        
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12">
          
          {/* Checkout Form */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl h-fit">
            <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 text-fuchsia-400 text-xs flex items-center justify-center font-bold border border-fuchsia-500/50">1</span>
              Tus Datos
            </h2>
            
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="firstName">Nombre</label>
                  <input required id="firstName" name="firstName" type="text" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground placeholder:text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground" htmlFor="lastName">Apellido</label>
                  <input required id="lastName" name="lastName" type="text" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground placeholder:text-muted-foreground/50" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground" htmlFor="email">Correo Electrónico</label>
                <input required id="email" name="email" type="email" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground placeholder:text-muted-foreground/50" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground" htmlFor="phone">Celular (WhatsApp)</label>
                <input required id="phone" name="phone" type="tel" placeholder="+598 99 123 456" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground placeholder:text-muted-foreground/50" />
              </div>

              <hr className="border-white/10 my-4" />

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl py-4 font-bold tracking-wide shadow-glow transition-all"
              >
                {isProcessing ? 'Generando Pago Seguro...' : 'Pagar con MercadoPago'}
              </button>

              <p className="text-center text-xs text-muted-foreground mt-4 opacity-70">
                Al confirmar, serás redirigido de forma segura a MercadoPago. La reserva no se confirmará hasta que el pago esté aprobado.
              </p>
            </form>
          </div>

          {/* Cart Summary */}
          <div className="flex flex-col gap-6">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold border border-indigo-500/50">2</span>
              Resumen
            </h2>

            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.garment.id} className="flex gap-4 pb-4 border-b border-white/10 last:border-0 last:pb-0">
                  <div className="relative w-20 h-28 rounded-lg overflow-hidden shrink-0">
                    {item.garment.photos_urls?.[0] ? (
                      <Image src={item.garment.photos_urls[0]} alt={item.garment.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 py-1">
                    <h3 className="font-medium text-sm line-clamp-2">{item.garment.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] tracking-wider text-muted-foreground">
                      <span className="bg-white/5 px-1.5 py-0.5 rounded-sm">Talle {item.garment.size_label}</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground/80 space-y-0.5">
                      {item.garment.location_name ? (
                        <p>
                          Sede: <span className="text-foreground">{item.garment.location_name}</span>
                        </p>
                      ) : null}
                      <p>Retiro: <span className="text-foreground">{item.pickupDate}</span></p>
                      <p>Devolución: <span className="text-foreground">{item.returnDate}</span></p>
                    </div>

                    <div className="mt-auto text-sm font-semibold">
                      {formatUy(item.garment.rental_price)}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 space-y-2 text-sm mt-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Alquiler</span>
                  <span>{formatUy(totalSubtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Garantía Reembolsable</span>
                  <span>{formatUy(totalDeposit)}</span>
                </div>
                <div className="flex justify-between text-xl font-display font-bold pt-4 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-fuchsia-400">{formatUy(totalSubtotal + totalDeposit)}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

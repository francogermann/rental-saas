import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { processCheckout } from '@/lib/actions/checkout';
import { formatUy } from '@/lib/utils';

export default async function CheckoutPage({ 
    params, 
    searchParams 
}: { 
    params: { garmentId: string },
    searchParams: { pickup: string, return: string }
}) {
    if (!searchParams.pickup || !searchParams.return) {
        return <div className="p-12 text-center text-muted-foreground">Fechas no seleccionadas. Por favor regrese a la prenda.</div>;
    }

    const supabase = createServerClient();
    const { data: garment, error } = await supabase
        .from('garments')
        .select('name, rental_price, deposit_amount, photos_urls')
        .eq('id', params.garmentId)
        .single();

    if (error || !garment) {
        notFound();
    }

    const totalAmount = (garment.rental_price || 0) + (garment.deposit_amount || 0);

    return (
        <div className="min-h-screen">
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,hsl(315_100%_60%/.1),transparent_50%)]" />

            <div className="container mx-auto max-w-screen-md py-24 px-6 relative z-10">
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 tracking-tight">Finalizar Reserva</h1>
                <p className="text-muted-foreground mb-10">Completá tus datos para confirmar el alquiler.</p>
                
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Checkout Form */}
                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <h2 className="font-display text-xl font-semibold mb-6">Tus Datos</h2>
                        <form action={processCheckout} className="space-y-5">
                            <input type="hidden" name="garmentId" value={params.garmentId} />
                            <input type="hidden" name="pickupDate" value={searchParams.pickup} />
                            <input type="hidden" name="returnDate" value={searchParams.return} />

                            <div className="grid grid-cols-2 gap-4">
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
                                <label className="text-sm font-medium text-muted-foreground" htmlFor="phone">Teléfono / WhatsApp</label>
                                <input required id="phone" name="phone" type="tel" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground placeholder:text-muted-foreground/50" />
                            </div>

                            <div className="pt-6 mt-4 border-t border-white/10">
                                <button type="submit" className="w-full h-12 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold rounded-2xl shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300">
                                    Confirmar y Pagar
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Summary */}
                    <div className="space-y-6">
                        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                            <h2 className="font-display text-lg font-semibold mb-6">Resumen</h2>
                            
                            <div className="flex gap-4 items-center mb-6">
                                {garment.photos_urls && garment.photos_urls.length > 0 && (
                                    <div className="h-20 w-14 relative bg-secondary rounded-xl overflow-hidden border border-white/10">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={garment.photos_urls[0]} alt="" className="object-cover w-full h-full" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="font-medium">{garment.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1.5 text-balance">
                                        Retiro: {new Date(searchParams.pickup).toLocaleDateString('es-UY')} <br/>
                                        Devolución: {new Date(searchParams.return).toLocaleDateString('es-UY')}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 text-sm border-t border-white/10 pt-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Alquiler</span>
                                    <span>{formatUy(garment.rental_price)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Depósito (Reembolsable)</span>
                                    <span>{formatUy(garment.deposit_amount)}</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-4 mt-4">
                                <span>Total</span>
                                <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                                    {formatUy(totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

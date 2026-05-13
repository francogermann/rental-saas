import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { processCheckout } from '@/lib/actions/checkout';

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
        <div className="container max-w-screen-md mx-auto py-12 px-4">
            <h1 className="text-3xl font-extrabold mb-8 tracking-tight">Finalizar Reserva</h1>
            
            <div className="grid md:grid-cols-2 gap-8">
                {/* Checkout Form */}
                <div className="bg-card border border-border/40 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6">Tus Datos</h2>
                    <form action={processCheckout} className="space-y-4">
                        <input type="hidden" name="garmentId" value={params.garmentId} />
                        <input type="hidden" name="pickupDate" value={searchParams.pickup} />
                        <input type="hidden" name="returnDate" value={searchParams.return} />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-muted-foreground" htmlFor="firstName">Nombre</label>
                                <input required id="firstName" name="firstName" type="text" className="w-full bg-background border border-border focus:ring-2 focus:ring-primary/20 rounded-lg px-3 py-2 outline-none transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-muted-foreground" htmlFor="lastName">Apellido</label>
                                <input required id="lastName" name="lastName" type="text" className="w-full bg-background border border-border focus:ring-2 focus:ring-primary/20 rounded-lg px-3 py-2 outline-none transition-all" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground" htmlFor="email">Correo Electrónico</label>
                            <input required id="email" name="email" type="email" className="w-full bg-background border border-border focus:ring-2 focus:ring-primary/20 rounded-lg px-3 py-2 outline-none transition-all" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground" htmlFor="phone">Teléfono / WhatsApp</label>
                            <input required id="phone" name="phone" type="tel" className="w-full bg-background border border-border focus:ring-2 focus:ring-primary/20 rounded-lg px-3 py-2 outline-none transition-all" />
                        </div>

                        <div className="pt-4 mt-8 border-t border-border/40">
                            <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]">
                                Confirmar y Pagar
                            </button>
                        </div>
                    </form>
                </div>

                {/* Summary */}
                <div className="space-y-6">
                    <div className="bg-muted border border-border/40 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold mb-4">Resumen</h2>
                        
                        <div className="flex gap-4 items-center mb-6">
                            {garment.photos_urls && garment.photos_urls.length > 0 && (
                                <div className="h-16 w-12 relative bg-secondary rounded overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={garment.photos_urls[0]} alt="" className="object-cover w-full h-full" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="font-medium text-sm">{garment.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1 text-balance">
                                    Retiro: {new Date(searchParams.pickup).toLocaleDateString('es-AR')} <br/>
                                    Devolución: {new Date(searchParams.return).toLocaleDateString('es-AR')}
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm border-t border-border/40 pt-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Alquiler</span>
                                <span>${garment.rental_price?.toLocaleString('es-AR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Depósito (Reembolsable)</span>
                                <span>${garment.deposit_amount?.toLocaleString('es-AR')}</span>
                            </div>
                        </div>
                        
                        <div className="flex justify-between font-bold text-lg border-t border-border/40 pt-4 mt-4">
                            <span>Total</span>
                            <span>${totalAmount.toLocaleString('es-AR')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

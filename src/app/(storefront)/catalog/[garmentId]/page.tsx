import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import ClientDateSelector from './ClientDateSelector';

export default async function GarmentDetailPage({ params }: { params: { garmentId: string } }) {
  const supabase = createAdminClient();

  const { data: garment, error } = await supabase
    .from('garments')
    .select(`
      id, name, description, category, size_label, rental_price, deposit_amount, photos_urls, operative_status
    `)
    .eq('id', params.garmentId)
    .single();

  if (error || !garment) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,hsl(315_100%_60%/.08),transparent_50%)]" />

      <div className="container mx-auto max-w-7xl px-6 py-24 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Gallery */}
          <div className="flex flex-col gap-4 md:sticky md:top-24">
            <div className="relative aspect-[3/4] bg-muted rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {garment.photos_urls && garment.photos_urls.length > 0 ? (
                <Image
                  src={garment.photos_urls[0]}
                  alt={garment.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 text-muted-foreground">
                  <span className="text-sm uppercase tracking-widest opacity-40">Sin foto</span>
                </div>
              )}
             
              <div className="absolute top-4 left-4 flex gap-2">
                {garment.category && (
                  <Badge className="bg-black/50 backdrop-blur-md border-white/10 text-white/90" variant="secondary">
                    {garment.category}
                  </Badge>
                )}
                <Badge className="bg-black/50 backdrop-blur-md border-fuchsia-500/30 text-fuchsia-300" variant="outline">
                  Talle {garment.size_label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Details & Action */}
          <div className="flex flex-col space-y-8">
            <div>
              <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
                {garment.name}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {garment.description || "Vestido exclusivo de Carpe Diem. Elegí tus fechas y reservalo sin agenda previa."}
              </p>
            </div>

            {/* Price Section */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-widest">Valor de Alquiler</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                    ${garment.rental_price?.toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest">Garantía / Seña</p>
                  <p className="text-xl text-muted-foreground">${garment.deposit_amount?.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </div>
            
            {/* Calendar */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h3 className="font-display text-lg font-semibold mb-6 tracking-tight">Seleccionar Fechas</h3>
              <ClientDateSelector 
                garmentId={garment.id} 
                rentalPrice={garment.rental_price ?? 0}
                depositAmount={garment.deposit_amount ?? 0}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

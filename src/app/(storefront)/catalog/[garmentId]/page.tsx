import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import ClientDateSelector from './ClientDateSelector';

export default async function GarmentDetailPage({ params }: { params: { garmentId: string } }) {
  // Use admin client in this route if necessary to verify the organization mapping.
  // We'll use the regular client, assuming the Garment ID is specific enough.
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

  // To simulate the customer who's viewing, normally this comes from Auth session.
  // For the MVP preview, we'll hardcode a dummy UUID or let the ClientDateSelector handle it.

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Gallery */}
        <div className="flex flex-col gap-4 sticky top-24">
          <div className="relative aspect-[3/4] bg-muted rounded-2xl overflow-hidden border border-border/40">
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
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 text-muted-foreground">
                    <span className="text-sm uppercase tracking-widest opacity-50">Sin foto</span>
                </div>
            )}
           
            <div className="absolute top-4 left-4 flex gap-2">
               {garment.category && <Badge className="bg-background/80 backdrop-blur-md" variant="secondary">{garment.category}</Badge>}
               <Badge className="bg-background/80 backdrop-blur-md" variant="outline">Talle {garment.size_label}</Badge>
            </div>
          </div>
        </div>

        {/* Details & Action */}
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{garment.name}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {garment.description || "Prenda exclusiva de Maison. Detalles excepcionales elaborados a medida para tus eventos de gala."}
            </p>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-end border-b border-border/50 pb-4">
               <div>
                 <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-widest">Valor de Alquiler</p>
                 <p className="text-3xl font-bold">${garment.rental_price?.toLocaleString('es-AR')}</p>
               </div>
               <div className="text-right">
                 <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest">Garantía / Seña</p>
                 <p className="text-xl text-muted-foreground">${garment.deposit_amount?.toLocaleString('es-AR')}</p>
               </div>
             </div>
          </div>
          
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-sm">
             <h3 className="text-lg font-semibold mb-6 tracking-tight">Seleccionar Fechas</h3>
             <ClientDateSelector 
               garmentId={garment.id} 
               rentalPrice={garment.rental_price ?? 0}
               depositAmount={garment.deposit_amount ?? 0}
             />
          </div>

        </div>
      </div>
    </div>
  );
}

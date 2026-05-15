import { createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import ClientDateSelector from './ClientDateSelector';
import { formatUy } from '@/lib/utils';
import type { Database } from '@/types/supabase';
import type { GarmentSummary } from '@/types/domain';

type GarmentRow = Database['public']['Tables']['garments']['Row'];
type GarmentDetailRow = GarmentRow & {
  locations: { name: string; address_line: string } | null;
};

export default async function GarmentDetailPage({
  params,
  searchParams,
}: {
  params: { garmentId: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('garments')
    .select(`
      *,
      locations!garments_location_id_fkey(name, address_line)
    `)
    .eq('id', params.garmentId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    notFound();
  }

  const garment = data as GarmentDetailRow;
  const loc = garment.locations;

  const pickupDate =
    typeof searchParams.pickupDate === 'string' ? searchParams.pickupDate : new Date().toISOString().split('T')[0];
  const returnDate =
    typeof searchParams.returnDate === 'string'
      ? searchParams.returnDate
      : new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
  const rawPickupLoc =
    typeof searchParams.pickupLocationId === 'string' ? searchParams.pickupLocationId.trim() : '';
  const garmentLocId = garment.location_id;

  let pickupLocationId: string;
  let sedeLine: { name: string; address_line: string } | null =
    loc ? { name: loc.name, address_line: loc.address_line } : null;

  if (garmentLocId) {
    if (!z.string().uuid().safeParse(rawPickupLoc).success || rawPickupLoc !== garmentLocId) {
      redirect(
        `/catalog/${params.garmentId}?pickupLocationId=${garmentLocId}&pickupDate=${pickupDate}&returnDate=${returnDate}`,
      );
    }
    pickupLocationId = rawPickupLoc;
  } else {
    const { data: orgLocs } = await supabase
      .from('locations')
      .select('id, name, address_line')
      .eq('organization_id', garment.organization_id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    const locs = orgLocs ?? [];
    if (locs.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center text-muted-foreground">
          No hay sedes configuradas para esta tienda.
        </div>
      );
    }

    const defaultPid = locs[0].id;
    const rawOk = z.string().uuid().safeParse(rawPickupLoc).success && locs.some((l) => l.id === rawPickupLoc);
    if (!rawOk) {
      redirect(
        `/catalog/${params.garmentId}?pickupLocationId=${defaultPid}&pickupDate=${pickupDate}&returnDate=${returnDate}`,
      );
    }
    pickupLocationId = rawPickupLoc;
    const chosen = locs.find((l) => l.id === pickupLocationId);
    sedeLine = chosen ? { name: chosen.name, address_line: chosen.address_line } : null;
  }

  const cartGarment: GarmentSummary = {
    id: garment.id,
    name: garment.name,
    sku: garment.sku,
    size_label: garment.size_label,
    category: garment.category,
    rental_price: garment.rental_price,
    deposit_amount: garment.deposit_amount,
    photos_urls: garment.photos_urls ?? [],
    chest_cm: garment.chest_cm,
    waist_cm: garment.waist_cm,
    hip_cm: garment.hip_cm,
    tags: garment.tags ?? [],
    style_group_id: garment.style_group_id,
    location_id: garment.location_id ?? pickupLocationId,
    location_name: sedeLine?.name ?? loc?.name ?? null,
  };

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
              {sedeLine?.name && (
                <p className="text-sm text-fuchsia-300/90 mt-3">
                  <span className="font-medium text-fuchsia-200/90">Sede de retiro: </span>
                  {sedeLine.name}
                  <span className="text-muted-foreground font-normal"> — {sedeLine.address_line}</span>
                </p>
              )}
            </div>

            {/* Price Section */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-widest">Valor de Alquiler</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                    {formatUy(garment.rental_price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest">Garantía / Seña</p>
                  <p className="text-xl text-muted-foreground">{formatUy(garment.deposit_amount)}</p>
                </div>
              </div>
            </div>
            
            {/* Calendar */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h3 className="font-display text-lg font-semibold mb-6 tracking-tight">Seleccionar Fechas</h3>
              <ClientDateSelector garment={cartGarment} pickupLocationId={pickupLocationId} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

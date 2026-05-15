import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import ClientDateSelector from './ClientDateSelector';
import { formatUy } from '@/lib/utils';
import type { Database } from '@/types/supabase';
import type { GarmentSummary } from '@/types/domain';
import { searchAvailableGarments } from '@/lib/actions/availability';
import { SimilarGarments } from '@/components/catalog/SimilarGarments';
import { WaitlistJoin } from '@/components/catalog/WaitlistJoin';
import { FavoriteHeart } from '@/components/catalog/FavoriteHeart';
import { dateRangesOverlap } from '@/lib/date-range';

type GarmentRow = Database['public']['Tables']['garments']['Row'];
type GarmentDetailRow = GarmentRow & {
  locations: { name: string; address_line: string } | null;
};

type SimilarRow = {
  id: string;
  name: string;
  sku: string;
  size_label: string | null;
  category: string | null;
  rental_price: number | null;
  deposit_amount: number;
  photos_urls: string[] | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  length_cm: number | null;
  tags: string[] | null;
  style_group_id: string | null;
  location_id: string | null;
  locations: { name: string } | null;
};

function mapSimilarRow(r: SimilarRow): GarmentSummary {
  return {
    id: r.id,
    name: r.name,
    sku: r.sku,
    size_label: r.size_label,
    category: r.category,
    rental_price: r.rental_price,
    deposit_amount: r.deposit_amount,
    photos_urls: r.photos_urls ?? [],
    chest_cm: r.chest_cm,
    waist_cm: r.waist_cm,
    hip_cm: r.hip_cm,
    length_cm: r.length_cm,
    tags: r.tags ?? [],
    style_group_id: r.style_group_id,
    location_id: r.location_id,
    location_name: r.locations?.name ?? null,
  };
}

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
    .select(
      `
      *,
      locations!garments_location_id_fkey(name, address_line)
    `,
    )
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
        <div className="flex min-h-screen items-center justify-center p-8 text-center text-muted-foreground">
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
    length_cm: garment.length_cm,
    tags: garment.tags ?? [],
    style_group_id: garment.style_group_id,
    location_id: garment.location_id ?? pickupLocationId,
    location_name: sedeLine?.name ?? loc?.name ?? null,
  };

  const { data: activeBlocks } = await supabase
    .from('garment_blocks')
    .select('date_from, date_to')
    .eq('garment_id', garment.id)
    .is('released_at', null);

  const urlRangeBlocked =
    activeBlocks?.some((b) => dateRangesOverlap(pickupDate, returnDate, b.date_from, b.date_to)) ?? false;

  const userClient = createServerClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  let favorited = false;
  if (user) {
    const { data: fav } = await userClient
      .from('favorite_garments')
      .select('garment_id')
      .eq('user_id', user.id)
      .eq('garment_id', garment.id)
      .maybeSingle();
    favorited = Boolean(fav);
  }

  const detailRedirectPath = `/catalog/${params.garmentId}?pickupLocationId=${encodeURIComponent(pickupLocationId)}&pickupDate=${encodeURIComponent(pickupDate)}&returnDate=${encodeURIComponent(returnDate)}`;

  let similarGarments: GarmentSummary[] = [];
  if (garment.category && garment.size_label) {
    const { data: similarRows } = await supabase
      .from('garments')
      .select(
        `
      id, name, sku, size_label, category, rental_price, deposit_amount, photos_urls,
      chest_cm, waist_cm, hip_cm, length_cm, tags, style_group_id, location_id,
      locations!garments_location_id_fkey ( name )
    `,
      )
      .eq('organization_id', garment.organization_id)
      .eq('category', garment.category)
      .eq('size_label', garment.size_label)
      .neq('id', garment.id)
      .is('deleted_at', null)
      .eq('operative_status', 'available')
      .limit(12);

    const mappedSimilar = (similarRows ?? []) as unknown as SimilarRow[];
    const summaries = mappedSimilar.map(mapSimilarRow);

    const avail = await searchAvailableGarments({
      pickupDate,
      returnDate,
      pickupLocationId,
      category: garment.category ?? undefined,
      sizeLabel: garment.size_label ?? undefined,
      limit: 80,
    });
    const availIds = new Set((avail.data ?? []).map((x) => x.id));
    const availFiltered = summaries.filter((s) => availIds.has(s.id)).slice(0, 4);
    similarGarments = availFiltered.length > 0 ? availFiltered : summaries.slice(0, 4);
  }

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(315_100%_60%/.08),transparent_50%)]" />

      <div className="relative z-10 container mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-start gap-12 md:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-4 md:sticky md:top-24">
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/10 bg-muted shadow-2xl">
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

              <div className="absolute right-3 top-3 z-10">
                <FavoriteHeart
                  garmentId={garment.id}
                  initialFavorited={favorited}
                  isLoggedIn={Boolean(user)}
                  redirectPath={detailRedirectPath}
                />
              </div>

              <div className="absolute left-4 top-4 flex flex-wrap gap-2 pr-14">
                {garment.category && (
                  <Badge className="border-white/10 bg-black/50 text-white/90 backdrop-blur-md" variant="secondary">
                    {garment.category}
                  </Badge>
                )}
                <Badge className="border-fuchsia-500/30 bg-black/50 text-fuchsia-300 backdrop-blur-md" variant="outline">
                  Talle {garment.size_label}
                </Badge>
                {garment.length_cm != null && garment.length_cm > 0 && (
                  <Badge className="border-white/20 bg-black/50 text-white/85 backdrop-blur-md" variant="outline">
                    Largo {garment.length_cm} cm
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-8">
            <div>
              <h1 className="mb-4 font-display text-3xl font-bold tracking-tight md:text-5xl">{garment.name}</h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {garment.description || 'Vestido exclusivo de Carpe Diem. Elegí tus fechas y reservalo sin agenda previa.'}
              </p>
              {sedeLine?.name && (
                <p className="mt-3 text-sm text-fuchsia-300/90">
                  <span className="font-medium text-fuchsia-200/90">Sede de retiro: </span>
                  {sedeLine.name}
                  <span className="font-normal text-muted-foreground"> — {sedeLine.address_line}</span>
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-end justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium uppercase tracking-widest text-muted-foreground">Valor de Alquiler</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                    {formatUy(garment.rental_price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-sm uppercase tracking-widest text-muted-foreground">Garantía / Seña</p>
                  <p className="text-xl text-muted-foreground">{formatUy(garment.deposit_amount)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
              <h3 className="mb-6 font-display text-lg font-semibold tracking-tight">Seleccionar Fechas</h3>
              <ClientDateSelector garment={cartGarment} pickupLocationId={pickupLocationId} />
            </div>

            <WaitlistJoin
              garmentId={garment.id}
              organizationId={garment.organization_id}
              pickupLocationId={pickupLocationId}
              pickupDate={pickupDate}
              returnDate={returnDate}
              isLoggedIn={Boolean(user)}
              urlRangeBlocked={urlRangeBlocked}
            />
          </div>
        </div>

        <SimilarGarments
          items={similarGarments}
          pickupLocationId={pickupLocationId}
          pickupDate={pickupDate}
          returnDate={returnDate}
        />
      </div>
    </div>
  );
}

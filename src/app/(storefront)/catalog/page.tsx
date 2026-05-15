import { redirect } from 'next/navigation';
import { z } from 'zod';
import { listCatalogGarments, searchAvailableGarments } from '@/lib/actions/availability';
import { toLocalYmdString } from '@/lib/calendar-date';
import CatalogClient from './CatalogClient';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import {
  CATALOG_CATEGORY_LABEL_BY_VALUE,
  CATALOG_CATEGORY_OPTIONS,
  CATALOG_SIZE_OPTIONS,
} from '@/lib/catalog-taxonomy';
import { CATALOG_FETCH_SIZE, CATALOG_PAGE_SIZE } from '@/lib/catalog-pagination';

function pickStr(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

function parseAvailableOnly(sp: Record<string, string | string[] | undefined>): boolean {
  const v = pickStr(sp, 'availableOnly');
  return v === '1' || v === 'true';
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin.from('organizations').select('id').eq('slug', 'maison-demo').single();

  if (orgErr || !org) {
    return <div className="p-8 text-center text-muted-foreground">Tienda no disponible.</div>;
  }

  const { data: locRows } = await admin
    .from('locations')
    .select('id, name, address_line')
    .eq('organization_id', org.id)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const locations = locRows ?? [];
  if (locations.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No hay sedes configuradas.</div>;
  }

  const today = toLocalYmdString(new Date());
  const defaultReturn = toLocalYmdString(new Date(Date.now() + 86400000 * 3));
  const pickupDate = typeof searchParams.pickupDate === 'string' ? searchParams.pickupDate : today;
  const returnDate = typeof searchParams.returnDate === 'string' ? searchParams.returnDate : defaultReturn;
  const availableOnly = parseAvailableOnly(searchParams);

  const rawLoc = typeof searchParams.pickupLocationId === 'string' ? searchParams.pickupLocationId.trim() : '';
  const defaultLocId = locations[0].id;

  if (!z.string().uuid().safeParse(rawLoc).success || !locations.some((l) => l.id === rawLoc)) {
    const qs = new URLSearchParams({
      pickupLocationId: defaultLocId,
      pickupDate,
      returnDate,
    });
    if (availableOnly) qs.set('availableOnly', '1');
    redirect(`/catalog?${qs.toString()}`);
  }

  const pickupLocationId = rawLoc;

  const { data: catRows } = await admin
    .from('garments')
    .select('category')
    .eq('organization_id', org.id)
    .is('deleted_at', null);

  const distinctCats = Array.from(new Set(catRows?.map((r) => r.category).filter(Boolean) as string[]));
  const categoryValues = Array.from(
    new Set([...CATALOG_CATEGORY_OPTIONS.map((o) => o.value), ...distinctCats]),
  ).sort();
  const categoryOptions = categoryValues.map((value) => ({
    value,
    label: CATALOG_CATEGORY_LABEL_BY_VALUE[value] ?? value,
  }));

  const { data: sizeRows } = await admin
    .from('garments')
    .select('size_label')
    .eq('organization_id', org.id)
    .is('deleted_at', null);

  const distinctSizes = Array.from(new Set(sizeRows?.map((r) => r.size_label).filter(Boolean) as string[]));
  const sizeOptions = Array.from(new Set([...(CATALOG_SIZE_OPTIONS as readonly string[]), ...distinctSizes])).sort();

  const rawCategory = pickStr(searchParams, 'category');
  const category =
    rawCategory && categoryValues.includes(rawCategory) ? rawCategory : undefined;

  const rawSize = pickStr(searchParams, 'size');
  const sizeLabel = rawSize && sizeOptions.includes(rawSize) ? rawSize : undefined;

  const maxPriceRaw = pickStr(searchParams, 'maxPrice');
  const maxPriceParsed = maxPriceRaw ? Number(maxPriceRaw) : NaN;
  const maxPrice =
    maxPriceRaw !== undefined && !Number.isNaN(maxPriceParsed) && maxPriceParsed > 0 ? maxPriceParsed : undefined;

  const listParams = {
    pickupLocationId,
    category,
    sizeLabel,
    maxPrice,
    limit: CATALOG_FETCH_SIZE,
    offset: 0,
  };

  const { data: garmentsRaw, error } = availableOnly
    ? await searchAvailableGarments({
        pickupDate,
        returnDate,
        ...listParams,
      })
    : await listCatalogGarments(listParams);

  const rawList = garmentsRaw ?? [];
  const garments = rawList.slice(0, CATALOG_PAGE_SIZE);
  const initialHasMore = rawList.length > CATALOG_PAGE_SIZE;

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let favoriteIds: string[] = [];
  if (user) {
    const { data: favs } = await supabase.from('favorite_garments').select('garment_id').eq('user_id', user.id);
    favoriteIds = favs?.map((f) => f.garment_id) ?? [];
  }

  return (
    <div className="min-h-screen">
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(315_100%_60%/.12),transparent_50%)]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-fuchsia-400 via-pink-300 to-purple-400 bg-clip-text text-transparent">
            Nuestra Colección
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Vestidos de fiesta, graduación, casamiento y gala. Encontrá el tuyo y reservalo sin agenda previa.
          </p>
        </div>
      </section>

      <CatalogClient
        garments={garments}
        initialHasMore={initialHasMore}
        error={error}
        initialPickupDate={pickupDate}
        initialReturnDate={returnDate}
        locations={locations}
        pickupLocationId={pickupLocationId}
        initialCategory={category}
        initialSize={sizeLabel}
        initialMaxPrice={maxPrice}
        categoryOptions={categoryOptions}
        sizeOptions={sizeOptions}
        favoriteIds={favoriteIds}
        isLoggedIn={Boolean(user)}
        initialAvailableOnly={availableOnly}
      />
    </div>
  );
}

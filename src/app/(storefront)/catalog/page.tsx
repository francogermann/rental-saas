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
import { CatalogEventDateModal } from '@/components/catalog/CatalogEventDateModal';
import {
  hasCatalogEventContext,
  isCatalogBrowseWithoutDates,
  parseShowAllCatalog,
  resolveCatalogDatesFromSearchParams,
  shouldShowEventDateModal,
} from '@/lib/catalog/event-date-range';

function pickStr(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
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

  const rawLoc = typeof searchParams.pickupLocationId === 'string' ? searchParams.pickupLocationId.trim() : '';
  const pickupLocationId =
    rawLoc && z.string().uuid().safeParse(rawLoc).success && locations.some((l) => l.id === rawLoc)
      ? rawLoc
      : undefined;

  const catalogHeader = (
    <section className="relative overflow-hidden px-6 py-16 text-center sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(315_100%_60%/.12),transparent_50%)]" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <h1 className="mb-4 bg-gradient-to-r from-fuchsia-400 via-pink-300 to-purple-400 bg-clip-text font-display text-4xl font-bold tracking-tight text-transparent md:text-5xl">
          Nuestra Colección
        </h1>
        <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
          Vestidos de fiesta, graduación, casamiento y gala.
        </p>
      </div>
    </section>
  );

  const today = toLocalYmdString(new Date());
  const hasDates = hasCatalogEventContext(searchParams);
  const showAll = parseShowAllCatalog(searchParams);
  const browseWithoutDates = isCatalogBrowseWithoutDates(searchParams);
  const openEventDateModal = shouldShowEventDateModal(searchParams);

  let eventDate: string | null = null;
  let pickupDate = '';
  let returnDate = '';
  let datesError: string | null = null;

  if (hasDates) {
    const datesResolved = resolveCatalogDatesFromSearchParams(searchParams, today);
    if (datesResolved.ok) {
      eventDate = datesResolved.eventDate;
      pickupDate = datesResolved.pickupDate;
      returnDate = datesResolved.returnDate;
    } else {
      datesError = datesResolved.error;
    }
  }

  const availableOnly = hasDates && !showAll && !datesError;

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
    ...(pickupLocationId ? { pickupLocationId } : {}),
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
    <div className="relative min-h-screen">
      {catalogHeader}

      <CatalogClient
        garments={garments}
        initialHasMore={initialHasMore}
        error={error}
        initialEventDate={eventDate}
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
        showAllCatalog={showAll || browseWithoutDates}
        catalogBrowseWithoutDates={browseWithoutDates}
      />

      <CatalogEventDateModal
        open={openEventDateModal || Boolean(datesError)}
        locations={locations}
        defaultLocationId={pickupLocationId}
        initialError={datesError}
      />
    </div>
  );
}

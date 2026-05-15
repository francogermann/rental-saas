'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCart } from '@/components/cart/CartContext';
import { formatUy } from '@/lib/utils';
import { FavoriteHeart } from '@/components/catalog/FavoriteHeart';
import { CatalogFilterChip, CatalogFilterSection } from '@/components/catalog/CatalogFilterSection';
import { listCatalogGarments, searchAvailableGarments } from '@/lib/actions/availability';
import { checkGarmentAvailabilityAction } from '@/lib/actions/cart-availability';
import { resolvePickupLocationForGarment } from '@/lib/catalog-pickup-location';
import { CATALOG_FETCH_SIZE, CATALOG_PAGE_SIZE } from '@/lib/catalog-pagination';
import { primaryPhotoUrl } from '@/lib/photo-urls';
import {
  buildCatalogBrowseQuery,
  buildCatalogDateQuery,
  deriveRentalRangeFromEventDate,
  formatEventDateEs,
} from '@/lib/catalog/event-date-range';

import type { GarmentSummary } from '@/types/domain';

export type CatalogLocationOption = { id: string; name: string; address_line: string };

export type CatalogCategoryOption = { value: string; label: string };

const EVENT_TYPES = [
  { value: 'graduación', label: 'Graduaciones' },
  { value: 'xv', label: 'Quinceañera / XV' },
  { value: 'boda-dia', label: 'Boda de Día' },
  { value: 'boda-noche', label: 'Boda de Noche' },
  { value: 'fiesta-verano', label: 'Fiesta de Verano' },
  { value: 'novia', label: 'Novias' },
  { value: 'cocktail', label: 'Cóctel' },
  { value: 'gala', label: 'Gala' },
];

const COLORS = [
  { value: 'negro', label: 'Negro', hex: '#111' },
  { value: 'blanco', label: 'Blanco', hex: '#f5f5f5' },
  { value: 'rojo', label: 'Rojo', hex: '#dc2626' },
  { value: 'azul', label: 'Azul', hex: '#2563eb' },
  { value: 'navy', label: 'Navy', hex: '#1e3a5f' },
  { value: 'rosa', label: 'Rosa', hex: '#ec4899' },
  { value: 'fucsia', label: 'Fucsia', hex: '#d946ef' },
  { value: 'verde', label: 'Verde', hex: '#16a34a' },
  { value: 'esmeralda', label: 'Esmeralda', hex: '#047857' },
  { value: 'borgoña', label: 'Borgoña', hex: '#7f1d1d' },
  { value: 'ciruela', label: 'Ciruela', hex: '#6b21a8' },
  { value: 'champagne', label: 'Champagne', hex: '#d4a76a' },
  { value: 'nude', label: 'Nude', hex: '#c4a882' },
  { value: 'turquesa', label: 'Turquesa', hex: '#06b6d4' },
  { value: 'dorado', label: 'Dorado', hex: '#ca8a04' },
  { value: 'plateado', label: 'Plateado', hex: '#9ca3af' },
];

function matchesClientFilters(
  g: GarmentSummary,
  filters: {
    pickupLoc: string;
    events: string[];
    categories: string[];
    sizes: string[];
    colors: string[];
  },
): boolean {
  if (filters.pickupLoc && g.location_id != null && g.location_id !== filters.pickupLoc) {
    return false;
  }

  if (filters.events.length > 0) {
    const tags = (g.tags || []).map((t) => t.toLowerCase());
    const name = g.name.toLowerCase();
    const matchesEvent = filters.events.some((ev) => {
      if (ev === 'boda-dia' || ev === 'boda-noche')
        return tags.includes('boda') || tags.includes('casamiento') || g.category?.toLowerCase() === 'casamiento';
      if (ev === 'novia')
        return tags.includes('novia') || tags.includes('casamiento') || g.category?.toLowerCase() === 'casamiento';
      if (ev === 'fiesta-verano') return tags.includes('verano') || tags.includes('tropical') || tags.includes('floral');
      if (ev === 'cocktail')
        return tags.includes('cocktail') || tags.includes('fiesta') || g.category?.toLowerCase() === 'fiesta';
      if (ev === 'gala') return tags.includes('gala') || tags.includes('formal') || g.category?.toLowerCase() === 'gala';
      if (ev === 'xv') return tags.includes('xv') || tags.includes('quinceañera') || tags.includes('fiesta');
      return tags.includes(ev) || name.includes(ev) || g.category?.toLowerCase().includes(ev);
    });
    if (!matchesEvent) return false;
  }

  if (filters.categories.length > 0) {
    if (!filters.categories.some((c) => g.category === c)) return false;
  }

  if (filters.sizes.length > 0) {
    const sizeMatch = filters.sizes.some((s) => {
      if (s === 'Plus Size') return g.size_label === 'XL' || g.size_label === 'XXL' || g.size_label === 'Plus Size';
      return g.size_label === s;
    });
    if (!sizeMatch) return false;
  }

  if (filters.colors.length > 0) {
    const tags = (g.tags || []).map((t) => t.toLowerCase());
    const name = g.name.toLowerCase();
    if (!filters.colors.some((c) => tags.includes(c) || name.includes(c))) return false;
  }

  return true;
}

function chipCount(events: string[], categories: string[], sizes: string[], colors: string[]) {
  return events.length + categories.length + sizes.length + colors.length;
}

interface CatalogClientProps {
  garments: GarmentSummary[];
  initialHasMore: boolean;
  error: string | null;
  initialEventDate: string | null;
  initialPickupDate: string;
  initialReturnDate: string;
  locations: CatalogLocationOption[];
  pickupLocationId?: string;
  initialCategory?: string;
  initialSize?: string;
  initialMaxPrice?: number;
  categoryOptions: CatalogCategoryOption[];
  sizeOptions: string[];
  favoriteIds: string[];
  isLoggedIn: boolean;
  initialAvailableOnly: boolean;
  showAllCatalog?: boolean;
  catalogBrowseWithoutDates?: boolean;
}

export default function CatalogClient({
  garments,
  initialHasMore,
  error,
  initialEventDate,
  initialPickupDate,
  initialReturnDate,
  locations,
  pickupLocationId,
  initialCategory,
  initialSize,
  initialMaxPrice,
  categoryOptions,
  sizeOptions,
  favoriteIds,
  isLoggedIn,
  initialAvailableOnly,
  showAllCatalog = false,
  catalogBrowseWithoutDates = false,
}: CatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialLoc = pickupLocationId ?? '';

  const [draftEventDate, setDraftEventDate] = useState(initialEventDate ?? '');
  const [draftPickupDate, setDraftPickupDate] = useState(initialPickupDate);
  const [draftReturnDate, setDraftReturnDate] = useState(initialReturnDate);
  const [draftPickupLoc, setDraftPickupLoc] = useState(initialLoc);
  const [draftFilterByAvailability, setDraftFilterByAvailability] = useState(initialAvailableOnly);
  const [draftEvents, setDraftEvents] = useState<string[]>([]);
  const [draftCategories, setDraftCategories] = useState<string[]>(() =>
    initialCategory ? [initialCategory] : [],
  );
  const [draftSizes, setDraftSizes] = useState<string[]>(() => (initialSize ? [initialSize] : []));
  const [draftMaxPriceInput, setDraftMaxPriceInput] = useState(
    initialMaxPrice != null ? String(initialMaxPrice) : '',
  );
  const [draftColors, setDraftColors] = useState<string[]>([]);

  const [appliedEventDate, setAppliedEventDate] = useState(initialEventDate ?? '');
  const [appliedPickupDate, setAppliedPickupDate] = useState(initialPickupDate);
  const [appliedReturnDate, setAppliedReturnDate] = useState(initialReturnDate);
  const [appliedPickupLoc, setAppliedPickupLoc] = useState(initialLoc);
  const [appliedFilterByAvailability, setAppliedFilterByAvailability] = useState(initialAvailableOnly);
  const [appliedEvents, setAppliedEvents] = useState<string[]>([]);
  const [appliedCategories, setAppliedCategories] = useState<string[]>(() =>
    initialCategory ? [initialCategory] : [],
  );
  const [appliedSizes, setAppliedSizes] = useState<string[]>(() => (initialSize ? [initialSize] : []));
  const [appliedColors, setAppliedColors] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState('recommended');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [items, setItems] = useState(garments);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    setItems(garments);
    setHasMore(initialHasMore);
    setLoadMoreError(null);
  }, [garments, initialHasMore]);

  useEffect(() => {
    const loc = pickupLocationId ?? '';
    setAppliedEventDate(initialEventDate ?? '');
    setAppliedPickupDate(initialPickupDate);
    setAppliedReturnDate(initialReturnDate);
    setAppliedPickupLoc(loc);
    setAppliedFilterByAvailability(initialAvailableOnly);
    setAppliedCategories(initialCategory ? [initialCategory] : []);
    setAppliedSizes(initialSize ? [initialSize] : []);

    setDraftEventDate(initialEventDate ?? '');
    setDraftPickupDate(initialPickupDate);
    setDraftReturnDate(initialReturnDate);
    setDraftPickupLoc(loc);
    setDraftFilterByAvailability(initialAvailableOnly);
    setDraftCategories(initialCategory ? [initialCategory] : []);
    setDraftSizes(initialSize ? [initialSize] : []);
    setDraftMaxPriceInput(initialMaxPrice != null ? String(initialMaxPrice) : '');
  }, [
    initialEventDate,
    initialPickupDate,
    initialReturnDate,
    pickupLocationId,
    initialAvailableOnly,
    initialCategory,
    initialSize,
    initialMaxPrice,
    catalogBrowseWithoutDates,
  ]);

  const { addItem } = useCart();
  const [addError, setAddError] = useState<string | null>(null);
  const [checkingGarmentId, setCheckingGarmentId] = useState<string | null>(null);

  const handleAddToCart = useCallback(
    async (g: GarmentSummary, pickupLoc: string) => {
      setAddError(null);
      if (catalogBrowseWithoutDates || !appliedPickupDate || !appliedReturnDate) {
        setAddError('Indicá la fecha de tu evento para reservar. Usá el botón de arriba o elegí fechas en la ficha del vestido.');
        return;
      }
      setCheckingGarmentId(g.id);
      const check = await checkGarmentAvailabilityAction(g.id, appliedPickupDate, appliedReturnDate);
      setCheckingGarmentId(null);
      if (!check.available) {
        setAddError(check.message ?? 'Esta prenda no está disponible para las fechas seleccionadas.');
        return;
      }
      addItem({
        garment: g,
        pickupDate: appliedPickupDate,
        returnDate: appliedReturnDate,
        pickupLocationId: pickupLoc,
      });
    },
    [addItem, appliedPickupDate, appliedReturnDate, catalogBrowseWithoutDates],
  );

  const buildListParams = useCallback(
    (offset: number) => ({
      ...(appliedPickupLoc ? { pickupLocationId: appliedPickupLoc } : {}),
      category: initialCategory,
      sizeLabel: initialSize,
      maxPrice: initialMaxPrice,
      limit: CATALOG_FETCH_SIZE,
      offset,
    }),
    [appliedPickupLoc, initialCategory, initialSize, initialMaxPrice],
  );

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const listParams = buildListParams(items.length);
      const res = appliedFilterByAvailability
        ? await searchAvailableGarments({
            pickupDate: appliedPickupDate,
            returnDate: appliedReturnDate,
            ...listParams,
          })
        : await listCatalogGarments(listParams);
      if (res.error) {
        setLoadMoreError(res.error);
        return;
      }
      const batch = res.data ?? [];
      const nextHasMore = batch.length > CATALOG_PAGE_SIZE;
      const slice = batch.slice(0, CATALOG_PAGE_SIZE);
      setItems((prev) => {
        const seen = new Set(prev.map((g) => g.id));
        const merged = [...prev];
        for (const g of slice) {
          if (!seen.has(g.id)) {
            seen.add(g.id);
            merged.push(g);
          }
        }
        return merged;
      });
      setHasMore(nextHasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMore,
    items.length,
    appliedPickupDate,
    appliedReturnDate,
    appliedFilterByAvailability,
    buildListParams,
  ]);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const applyFilters = () => {
    let pickup = draftPickupDate;
    let ret = draftReturnDate;
    const eventDate = draftEventDate.trim();

    if (eventDate) {
      const derived = deriveRentalRangeFromEventDate(eventDate);
      if (!derived.ok) {
        setAddError(derived.error);
        return;
      }
      pickup = derived.range.pickupDate;
      ret = derived.range.returnDate;
    }

    setAddError(null);
    setAppliedEvents(draftEvents);
    setAppliedCategories(draftCategories);
    setAppliedSizes(draftSizes);
    setAppliedColors(draftColors);
    setAppliedPickupLoc(draftPickupLoc);
    setAppliedEventDate(eventDate);
    setAppliedPickupDate(pickup);
    setAppliedReturnDate(ret);
    setAppliedFilterByAvailability(draftFilterByAvailability);

    const p = new URLSearchParams();
    if (eventDate) {
      p.set('eventDate', eventDate);
      p.set('pickupDate', pickup);
      p.set('returnDate', ret);
      if (draftFilterByAvailability) {
        p.set('availableOnly', '1');
      } else {
        p.set('showAll', '1');
      }
    } else if (draftFilterByAvailability) {
      if (!pickup || !ret) {
        setAddError('Elegí fechas de retiro y devolución, o la fecha de tu evento.');
        return;
      }
      if (pickup > ret) {
        setAddError('La fecha de retiro debe ser anterior a la devolución.');
        return;
      }
      p.set('pickupDate', pickup);
      p.set('returnDate', ret);
      p.set('availableOnly', '1');
    } else {
      p.set('showAll', '1');
    }
    if (draftPickupLoc) p.set('pickupLocationId', draftPickupLoc);
    if (draftCategories.length === 1) p.set('category', draftCategories[0]);
    if (draftSizes.length === 1) p.set('size', draftSizes[0]);
    const mp = Number(draftMaxPriceInput);
    if (draftMaxPriceInput.trim() && !Number.isNaN(mp) && mp > 0) p.set('maxPrice', String(Math.round(mp)));

    router.push(`${pathname}?${p.toString()}`);
    setMobileFiltersOpen(false);
  };

  const handleChangeEventDate = () => {
    router.push(pathname);
  };

  const clearAll = () => {
    setDraftEvents([]);
    setDraftCategories([]);
    setDraftSizes([]);
    setDraftColors([]);
    setDraftMaxPriceInput('');
    setDraftPickupLoc('');
    setAppliedEvents([]);
    setAppliedCategories([]);
    setAppliedSizes([]);
    setAppliedColors([]);
    setAppliedPickupLoc('');

    const p = new URLSearchParams();
    p.set('pickupDate', appliedPickupDate);
    p.set('returnDate', appliedReturnDate);
    if (appliedFilterByAvailability) p.set('availableOnly', '1');
    router.push(`${pathname}?${p.toString()}`);
  };

  const draftChipCount = chipCount(draftEvents, draftCategories, draftSizes, draftColors);
  const appliedChipCount = chipCount(appliedEvents, appliedCategories, appliedSizes, appliedColors);

  const filtered = useMemo(() => {
    if (!items.length) return [];
    const filteredArray = items.filter((g) =>
      matchesClientFilters(g, {
        pickupLoc: appliedPickupLoc,
        events: appliedEvents,
        categories: appliedCategories,
        sizes: appliedSizes,
        colors: appliedColors,
      }),
    );

    return filteredArray.sort((a, b) => {
      if (sortBy === 'price_asc') return (a.rental_price || 0) - (b.rental_price || 0);
      if (sortBy === 'price_desc') return (b.rental_price || 0) - (a.rental_price || 0);
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'popular') return b.name.length - a.name.length;
      return 0;
    });
  }, [items, appliedPickupLoc, appliedEvents, appliedCategories, appliedSizes, appliedColors, sortBy]);

  const applyFiltersFooter = (
    <button
      type="button"
      onClick={applyFilters}
      disabled={Boolean(draftPickupDate && draftReturnDate && draftPickupDate > draftReturnDate)}
      className="mt-4 w-full rounded-lg bg-fuchsia-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-fuchsia-500 disabled:opacity-50 disabled:hover:bg-fuchsia-600"
    >
      Aplicar filtros
    </button>
  );

  const filtersContent = (
    <>
      <CatalogFilterSection title="Fechas y sede" count={0} defaultOpen>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">
              Fecha de tu evento
            </label>
            <input
              type="date"
              value={draftEventDate}
              onChange={(e) => {
                const next = e.target.value;
                setDraftEventDate(next);
                if (next) {
                  const derived = deriveRentalRangeFromEventDate(next);
                  if (derived.ok) {
                    setDraftPickupDate(derived.range.pickupDate);
                    setDraftReturnDate(derived.range.returnDate);
                  }
                }
              }}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Retiro y devolución: día anterior y día siguiente al evento (podés ajustarlos abajo).
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Sede de retiro</label>
            <select
              value={draftPickupLoc}
              onChange={(e) => setDraftPickupLoc(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none focus:border-fuchsia-500/50 focus:outline-none"
            >
              <option value="" className="bg-background text-foreground">
                Todas las sedes
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-background text-foreground">
                  {loc.name}
                </option>
              ))}
            </select>
            <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
              {draftPickupLoc
                ? locations.find((l) => l.id === draftPickupLoc)?.address_line
                : 'Mostrando vestidos de todos los locales'}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Retiro</label>
            <input
              type="date"
              value={draftPickupDate}
              onChange={(e) => setDraftPickupDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Devolución</label>
            <input
              type="date"
              value={draftReturnDate}
              onChange={(e) => setDraftReturnDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Precio máximo (UYU)</label>
            <input
              type="number"
              min={0}
              step={50}
              placeholder="Sin tope"
              value={draftMaxPriceInput}
              onChange={(e) => setDraftMaxPriceInput(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Un valor por vez en el servidor; podés refinar más con los chips de abajo.
            </p>
          </div>
          {showAllCatalog ? (
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
              <input
                type="checkbox"
                checked={draftFilterByAvailability}
                onChange={(e) => setDraftFilterByAvailability(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-fuchsia-600 focus:ring-fuchsia-500/50"
              />
              <span className="text-xs leading-snug text-muted-foreground">
                Solo disponibles para estas fechas
              </span>
            </label>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              Mostrando solo vestidos disponibles para tu evento.{' '}
              <button
                type="button"
                onClick={() => {
                  setDraftFilterByAvailability(false);
                  const p = new URLSearchParams(searchParams.toString());
                  p.set('showAll', '1');
                  p.delete('availableOnly');
                  router.push(`${pathname}?${p.toString()}`);
                }}
                className="text-fuchsia-400 underline hover:text-fuchsia-300"
              >
                Ver toda la colección
              </button>
            </p>
          )}
        </div>
      </CatalogFilterSection>

      <CatalogFilterSection title="Evento" count={draftEvents.length}>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((e) => (
            <CatalogFilterChip
              key={e.value}
              label={e.label}
              active={draftEvents.includes(e.value)}
              onClick={() => toggleFilter(draftEvents, e.value, setDraftEvents)}
            />
          ))}
        </div>
      </CatalogFilterSection>

      <CatalogFilterSection title="Categoría" count={draftCategories.length}>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((c) => (
            <CatalogFilterChip
              key={c.value}
              label={c.label}
              active={draftCategories.includes(c.value)}
              onClick={() => toggleFilter(draftCategories, c.value, setDraftCategories)}
            />
          ))}
        </div>
      </CatalogFilterSection>

      <CatalogFilterSection title="Talle" count={draftSizes.length}>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((s) => (
            <CatalogFilterChip
              key={s}
              label={s}
              active={draftSizes.includes(s)}
              onClick={() => toggleFilter(draftSizes, s, setDraftSizes)}
            />
          ))}
        </div>
      </CatalogFilterSection>

      <CatalogFilterSection title="Color (tags)" count={draftColors.length}>
        <p className="mb-2 text-[10px] text-muted-foreground">Se cruza con etiquetas y nombre; no hay columna de color en la base.</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => toggleFilter(draftColors, c.value, setDraftColors)}
              className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                draftColors.includes(c.value)
                  ? 'border-fuchsia-500/50 bg-fuchsia-500/20 text-fuchsia-300'
                  : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground'
              }`}
              title={c.label}
            >
              <span className="h-3 w-3 shrink-0 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
              {c.label}
            </button>
          ))}
        </div>
      </CatalogFilterSection>

      {applyFiltersFooter}
    </>
  );

  return (
    <div className="container mx-auto max-w-7xl px-6 pb-24">
      <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 lg:hidden"
          >
            <span>☰</span> Filtros
            {draftChipCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500 text-[10px] font-bold text-white">
                {draftChipCount}
              </span>
            )}
          </button>
          <p className="hidden text-sm text-muted-foreground sm:block">
            {appliedFilterByAvailability
              ? 'Filtrado por disponibilidad en las fechas elegidas'
              : appliedPickupLoc
                ? 'Colección en la sede seleccionada'
                : 'Toda la colección en todas las sedes'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {appliedChipCount > 0 && (
            <button type="button" onClick={clearAll} className="text-xs text-fuchsia-400 transition-colors hover:text-fuchsia-300">
              Limpiar filtros ✕
            </button>
          )}
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-8 rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">{error}</div>
      )}

      {mobileFiltersOpen && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl lg:hidden">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Filtros</h3>
            <button type="button" onClick={() => setMobileFiltersOpen(false)} className="text-lg text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
          {filtersContent}
        </div>
      )}

      <div className="flex gap-10">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Filtros</h3>
              {appliedChipCount > 0 && (
                <button type="button" onClick={clearAll} className="text-xs text-fuchsia-400 hover:text-fuchsia-300">
                  Limpiar
                </button>
              )}
            </div>
            {filtersContent}
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex flex-col gap-3">
            {catalogBrowseWithoutDates ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <span className="font-medium text-fuchsia-200">Explorando la colección</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ¿Cuándo es tu evento? Indicalo para ver solo vestidos disponibles para esas fechas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleChangeEventDate}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:from-fuchsia-400 hover:to-purple-500"
                >
                  Indicar fecha del evento
                </button>
              </div>
            ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                {appliedEventDate ? (
                  <>
                    <span className="font-medium text-fuchsia-200">Tu evento: </span>
                    {formatEventDateEs(appliedEventDate)}
                  </>
                ) : (
                  <span className="font-medium text-fuchsia-200">Fechas de alquiler seleccionadas</span>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Retiro {formatEventDateEs(appliedPickupDate)} · Devolución {formatEventDateEs(appliedReturnDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleChangeEventDate}
                className="shrink-0 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-white/10"
              >
                Cambiar fecha del evento
              </button>
            </div>
            )}

            {showAllCatalog ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
                {catalogBrowseWithoutDates
                  ? 'Estás viendo toda la colección sin filtrar por fecha. Las reservas requieren indicar cuándo es tu evento.'
                  : 'Estás viendo toda la colección. Algunas prendas pueden no estar disponibles para tus fechas.'}
              </div>
            ) : null}

            {addError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {addError}
              </div>
            ) : null}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">{filtered.length}</span> resultados
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Ordenar por
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-foreground outline-none focus:border-fuchsia-500/50"
                >
                  <option value="recommended" className="bg-background text-foreground">
                    Destacados
                  </option>
                  <option value="popular" className="bg-background text-foreground">
                    Más Reservados
                  </option>
                  <option value="price_asc" className="bg-background text-foreground">
                    Menor Precio
                  </option>
                  <option value="price_desc" className="bg-background text-foreground">
                    Mayor Precio
                  </option>
                  <option value="name_asc" className="bg-background text-foreground">
                    Nombre (A-Z)
                  </option>
                </select>
              </div>
            </div>
            {(appliedEvents.length > 0 || appliedColors.length > 0) && (
              <p className="text-xs text-muted-foreground">
                Los filtros de evento y color se aplican a las prendas ya cargadas. Usá &quot;Cargar más&quot; para traer más del catálogo.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((g) => {
              const redirectPath = `${pathname}?${searchParams.toString()}`;
              const coverUrl = primaryPhotoUrl(g.photos_urls);
              const garmentPickupLoc = resolvePickupLocationForGarment(g, appliedPickupLoc, locations);
              return (
                <Card
                  key={g.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-fuchsia-500/30 hover:shadow-glow"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={g.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/30 text-muted-foreground">
                        <span className="text-xl opacity-50">✦</span>
                        <span className="mt-2 text-xs uppercase tracking-widest opacity-50">Sin foto</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="absolute right-3 top-3 z-10">
                      <FavoriteHeart
                        garmentId={g.id}
                        initialFavorited={favoriteIds.includes(g.id)}
                        isLoggedIn={isLoggedIn}
                        redirectPath={redirectPath}
                      />
                    </div>

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2 pr-14">
                      {g.category && (
                        <Badge variant="secondary" className="border-white/10 bg-black/50 text-white/90 shadow-lg backdrop-blur-md">
                          {g.category}
                        </Badge>
                      )}
                      {g.size_label && (
                        <Badge variant="outline" className="border-fuchsia-500/30 bg-black/50 text-fuchsia-300 shadow-lg backdrop-blur-md">
                          Talle {g.size_label}
                        </Badge>
                      )}
                      {g.length_cm != null && g.length_cm > 0 && (
                        <Badge variant="outline" className="border-white/20 bg-black/50 text-white/85 shadow-lg backdrop-blur-md">
                          Largo {g.length_cm} cm
                        </Badge>
                      )}
                      {g.location_name && (
                        <Badge
                          variant="outline"
                          className="max-w-[11rem] truncate border-white/20 bg-black/50 text-white/85 shadow-lg backdrop-blur-md"
                          title={g.location_name}
                        >
                          {g.location_name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="flex-grow p-5">
                    <h3 className="font-display line-clamp-1 text-base font-semibold">{g.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">SKU: {g.sku}</p>
                  </CardContent>

                  <CardFooter className="flex items-end justify-between p-5 pt-0">
                    <div className="flex flex-col">
                      <span className="mb-0.5 text-xs font-medium text-muted-foreground">Alquiler</span>
                      <span className="text-lg font-bold">{formatUy(g.rental_price)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={checkingGarmentId === g.id}
                        onClick={() => void handleAddToCart(g, garmentPickupLoc)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 active:scale-95 disabled:opacity-50"
                      >
                        {checkingGarmentId === g.id ? '…' : 'Añadir'}
                      </button>
                      <Link
                        href={`/catalog/${g.id}?${
                          catalogBrowseWithoutDates
                            ? buildCatalogBrowseQuery(garmentPickupLoc)
                            : buildCatalogDateQuery({
                                eventDate: appliedEventDate || null,
                                pickupDate: appliedPickupDate,
                                returnDate: appliedReturnDate,
                                pickupLocationId: garmentPickupLoc,
                                availableOnly: appliedFilterByAvailability,
                                showAll: showAllCatalog,
                              })
                        }`}
                        className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-lg active:scale-95"
                      >
                        Detalles
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {hasMore && !error && (
            <div className="mt-10 flex flex-col items-center gap-3">
              {loadMoreError ? <p className="text-sm text-destructive">{loadMoreError}</p> : null}
              <button
                type="button"
                onClick={() => void handleLoadMore()}
                disabled={loadingMore}
                className="rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-8 py-3 text-sm font-semibold text-fuchsia-200 transition-colors hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          )}

          {filtered.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-fuchsia-500/10 shadow-glow">
                <span className="text-3xl">✦</span>
              </div>
              <p className="font-display text-xl font-medium tracking-tight">No encontramos prendas</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">Probá ajustando los filtros o las fechas.</p>
              {appliedChipCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-4 text-sm text-fuchsia-400 underline underline-offset-4 transition-colors hover:text-fuchsia-300"
                >
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

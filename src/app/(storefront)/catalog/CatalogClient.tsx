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
import { searchAvailableGarments } from '@/lib/actions/availability';
import { CATALOG_FETCH_SIZE, CATALOG_PAGE_SIZE } from '@/lib/catalog-pagination';
import { pickCatalogCoverUrl } from '@/lib/photo-urls';

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

interface CatalogClientProps {
  garments: GarmentSummary[];
  /** True si el servidor recibió más de CATALOG_PAGE_SIZE filas (hay página siguiente). */
  initialHasMore: boolean;
  error: string | null;
  initialPickupDate: string;
  initialReturnDate: string;
  locations: CatalogLocationOption[];
  pickupLocationId: string;
  initialCategory?: string;
  initialSize?: string;
  initialMaxPrice?: number;
  categoryOptions: CatalogCategoryOption[];
  sizeOptions: string[];
  favoriteIds: string[];
  isLoggedIn: boolean;
}

export default function CatalogClient({
  garments,
  initialHasMore,
  error,
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
}: CatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pickupDate, setPickupDate] = useState(initialPickupDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [pickupLoc, setPickupLoc] = useState(pickupLocationId);

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    initialCategory ? [initialCategory] : [],
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() => (initialSize ? [initialSize] : []));
  const [maxPriceInput, setMaxPriceInput] = useState(initialMaxPrice != null ? String(initialMaxPrice) : '');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
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
    setPickupDate(initialPickupDate);
    setReturnDate(initialReturnDate);
    setPickupLoc(pickupLocationId);
    setSelectedCategories(initialCategory ? [initialCategory] : []);
    setSelectedSizes(initialSize ? [initialSize] : []);
    setMaxPriceInput(initialMaxPrice != null ? String(initialMaxPrice) : '');
  }, [initialPickupDate, initialReturnDate, pickupLocationId, initialCategory, initialSize, initialMaxPrice]);

  const { addItem } = useCart();

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const offset = items.length;
      const res = await searchAvailableGarments({
        pickupDate,
        returnDate,
        pickupLocationId: pickupLoc,
        category: initialCategory,
        sizeLabel: initialSize,
        maxPrice: initialMaxPrice,
        limit: CATALOG_FETCH_SIZE,
        offset,
      });
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
    pickupDate,
    returnDate,
    pickupLoc,
    initialCategory,
    initialSize,
    initialMaxPrice,
  ]);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const pushCatalogUrl = () => {
    const p = new URLSearchParams();
    p.set('pickupLocationId', pickupLoc);
    p.set('pickupDate', pickupDate);
    p.set('returnDate', returnDate);
    if (selectedCategories.length === 1) p.set('category', selectedCategories[0]);
    if (selectedSizes.length === 1) p.set('size', selectedSizes[0]);
    const mp = Number(maxPriceInput);
    if (maxPriceInput.trim() && !Number.isNaN(mp) && mp > 0) p.set('maxPrice', String(Math.round(mp)));
    router.push(`${pathname}?${p.toString()}`);
  };

  const clearAll = () => {
    setSelectedEvents([]);
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setMaxPriceInput('');
    const p = new URLSearchParams();
    p.set('pickupLocationId', pickupLoc);
    p.set('pickupDate', pickupDate);
    p.set('returnDate', returnDate);
    router.push(`${pathname}?${p.toString()}`);
  };

  const activeCount =
    selectedEvents.length + selectedCategories.length + selectedSizes.length + selectedColors.length;

  const filtered = useMemo(() => {
    if (!items.length) return [];
    const filteredArray = items.filter((g) => {
      if (selectedEvents.length > 0) {
        const tags = (g.tags || []).map((t) => t.toLowerCase());
        const name = g.name.toLowerCase();
        const matchesEvent = selectedEvents.some((ev) => {
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

      if (selectedCategories.length > 0) {
        const matchesCat = selectedCategories.some((c) => g.category === c);
        if (!matchesCat) return false;
      }

      if (selectedSizes.length > 0) {
        const sizeMatch = selectedSizes.some((s) => {
          if (s === 'Plus Size') return g.size_label === 'XL' || g.size_label === 'XXL' || g.size_label === 'Plus Size';
          return g.size_label === s;
        });
        if (!sizeMatch) return false;
      }

      if (selectedColors.length > 0) {
        const tags = (g.tags || []).map((t) => t.toLowerCase());
        const name = g.name.toLowerCase();
        const colorMatch = selectedColors.some((c) => tags.includes(c) || name.includes(c));
        if (!colorMatch) return false;
      }

      return true;
    });

    return filteredArray.sort((a, b) => {
      if (sortBy === 'price_asc') return (a.rental_price || 0) - (b.rental_price || 0);
      if (sortBy === 'price_desc') return (b.rental_price || 0) - (a.rental_price || 0);
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'popular') return b.name.length - a.name.length;
      return 0;
    });
  }, [items, selectedEvents, selectedCategories, selectedSizes, selectedColors, sortBy]);

  const catalogCoverByGarmentId = useMemo(() => {
    const used = new Set<string>();
    const m = new Map<string, string | null>();
    for (const g of filtered) {
      m.set(g.id, pickCatalogCoverUrl(g.photos_urls, used));
    }
    return m;
  }, [filtered]);

  const FilterSection = ({
    title,
    count,
    children,
  }: {
    title: string;
    count: number;
    children: React.ReactNode;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="border-b border-white/5 last:border-0">
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full cursor-pointer items-center justify-between py-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-fuchsia-400">{title}</span>
          <div className="flex items-center gap-2">
            {count > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-500 text-[9px] font-bold text-white">
                {count}
              </span>
            )}
            <span className={`text-xs text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </div>
        </button>
        {isOpen && <div className="pb-4 pt-1">{children}</div>}
      </div>
    );
  };

  const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        active
          ? 'border-fuchsia-500/50 bg-fuchsia-500/20 text-fuchsia-300'
          : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  const filtersContent = (
    <>
      <FilterSection title="Fechas y sede" count={0}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Sede de retiro</label>
            <select
              value={pickupLoc}
              onChange={(e) => setPickupLoc(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-fuchsia-500/50 focus:outline-none"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
              {locations.find((l) => l.id === pickupLoc)?.address_line}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Retiro</label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Devolución</label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Precio máximo (UYU)</label>
            <input
              type="number"
              min={0}
              step={50}
              placeholder="Sin tope"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-fuchsia-500/50 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Un valor por vez en el servidor; podés refinar más con los chips de abajo.
            </p>
          </div>
          <button
            type="button"
            onClick={pushCatalogUrl}
            disabled={pickupDate > returnDate}
            className="mt-1 w-full rounded-lg bg-fuchsia-600 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-fuchsia-500 disabled:opacity-50 disabled:hover:bg-fuchsia-600"
          >
            Aplicar fechas, sede y filtros
          </button>
        </div>
      </FilterSection>

      <FilterSection title="Evento" count={selectedEvents.length}>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((e) => (
            <FilterChip
              key={e.value}
              label={e.label}
              active={selectedEvents.includes(e.value)}
              onClick={() => toggleFilter(selectedEvents, e.value, setSelectedEvents)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Categoría" count={selectedCategories.length}>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((c) => (
            <FilterChip
              key={c.value}
              label={c.label}
              active={selectedCategories.includes(c.value)}
              onClick={() => toggleFilter(selectedCategories, c.value, setSelectedCategories)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Talle" count={selectedSizes.length}>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((s) => (
            <FilterChip
              key={s}
              label={s}
              active={selectedSizes.includes(s)}
              onClick={() => toggleFilter(selectedSizes, s, setSelectedSizes)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Color (tags)" count={selectedColors.length}>
        <p className="mb-2 text-[10px] text-muted-foreground">Se cruza con etiquetas y nombre; no hay columna de color en la base.</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => toggleFilter(selectedColors, c.value, setSelectedColors)}
              className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                selectedColors.includes(c.value)
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
      </FilterSection>
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
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
          <p className="hidden text-sm text-muted-foreground sm:block">Resultados según URL y disponibilidad</p>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
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
              {activeCount > 0 && (
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
                  <option value="recommended" className="text-black">
                    Destacados
                  </option>
                  <option value="popular" className="text-black">
                    Más Reservados
                  </option>
                  <option value="price_asc" className="text-black">
                    Menor Precio
                  </option>
                  <option value="price_desc" className="text-black">
                    Mayor Precio
                  </option>
                  <option value="name_asc" className="text-black">
                    Nombre (A-Z)
                  </option>
                </select>
              </div>
            </div>
            {(selectedEvents.length > 0 || selectedColors.length > 0) && (
              <p className="text-xs text-muted-foreground">
                Los filtros de evento y color se aplican a las prendas ya cargadas. Usá &quot;Cargar más&quot; para traer más del catálogo.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((g) => {
              const redirectPath = `${pathname}?${searchParams.toString()}`;
              const coverUrl = catalogCoverByGarmentId.get(g.id);
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
                        onClick={() => addItem({ garment: g, pickupDate, returnDate, pickupLocationId: pickupLoc })}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 active:scale-95"
                      >
                        Añadir
                      </button>
                      <Link
                        href={`/catalog/${g.id}?pickupLocationId=${encodeURIComponent(pickupLoc)}&pickupDate=${encodeURIComponent(pickupDate)}&returnDate=${encodeURIComponent(returnDate)}`}
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
              {activeCount > 0 && (
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

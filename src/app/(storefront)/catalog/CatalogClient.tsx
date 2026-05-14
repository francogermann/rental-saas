'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

// Types
interface Garment {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  size_label: string | null;
  rental_price: number | null;
  deposit_amount: number | null;
  photos_urls: string[] | null;
  tags: string[] | null;
}

// Filter options
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

const CATEGORIES = [
  { value: 'Vestido Corto', label: 'Vestidos Cortos' },
  { value: 'Vestido Midi', label: 'Vestidos Midi' },
  { value: 'Vestido Largo', label: 'Vestidos Largos' },
  { value: 'Conjunto', label: 'Conjuntos' },
  { value: 'Mono', label: 'Monos' },
  { value: 'Accesorio', label: 'Accesorios' },
  { value: 'Calzado', label: 'Calzados' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Plus Size'];

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
  garments: Garment[];
  error: string | null;
}

export default function CatalogClient({ garments, error }: CatalogClientProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const toggleFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const clearAll = () => {
    setSelectedEvents([]);
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
  };

  const activeCount = selectedEvents.length + selectedCategories.length + selectedSizes.length + selectedColors.length;

  const filtered = useMemo(() => {
    if (!garments) return [];
    return garments.filter(g => {
      // Event filter: match against tags
      if (selectedEvents.length > 0) {
        const tags = (g.tags || []).map(t => t.toLowerCase());
        const name = g.name.toLowerCase();
        const matchesEvent = selectedEvents.some(ev => {
          if (ev === 'boda-dia' || ev === 'boda-noche') return tags.includes('boda') || tags.includes('casamiento') || g.category?.toLowerCase() === 'casamiento';
          if (ev === 'novia') return tags.includes('novia') || tags.includes('casamiento') || g.category?.toLowerCase() === 'casamiento';
          if (ev === 'fiesta-verano') return tags.includes('verano') || tags.includes('tropical') || tags.includes('floral');
          if (ev === 'cocktail') return tags.includes('cocktail') || tags.includes('fiesta') || g.category?.toLowerCase() === 'fiesta';
          if (ev === 'gala') return tags.includes('gala') || tags.includes('formal') || g.category?.toLowerCase() === 'gala';
          if (ev === 'xv') return tags.includes('xv') || tags.includes('quinceañera') || tags.includes('fiesta');
          return tags.includes(ev) || name.includes(ev) || g.category?.toLowerCase().includes(ev);
        });
        if (!matchesEvent) return false;
      }

      // Category filter: match against category field
      if (selectedCategories.length > 0) {
        const cat = g.category?.toLowerCase() || '';
        const name = g.name.toLowerCase();
        const matchesCat = selectedCategories.some(c => {
          const cv = c.toLowerCase();
          if (cv.includes('corto')) return cat.includes('fiesta') || name.includes('mini') || name.includes('corto');
          if (cv.includes('midi')) return name.includes('midi');
          if (cv.includes('largo')) return cat.includes('gala') || cat.includes('graduación') || cat.includes('casamiento') || name.includes('largo');
          return cat.includes(cv) || name.includes(cv);
        });
        if (!matchesCat) return false;
      }

      // Size filter
      if (selectedSizes.length > 0) {
        const sizeMatch = selectedSizes.some(s => {
          if (s === 'Plus Size') return g.size_label === 'XL' || g.size_label === 'XXL' || g.size_label === 'Plus Size';
          return g.size_label === s;
        });
        if (!sizeMatch) return false;
      }

      // Color filter: match against tags or name
      if (selectedColors.length > 0) {
        const tags = (g.tags || []).map(t => t.toLowerCase());
        const name = g.name.toLowerCase();
        const colorMatch = selectedColors.some(c => tags.includes(c) || name.includes(c));
        if (!colorMatch) return false;
      }

      return true;
    });
  }, [garments, selectedEvents, selectedCategories, selectedSizes, selectedColors]);

  const FilterSection = ({ title, count, children }: { title: string; count: number; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="border-b border-white/5 last:border-0">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between cursor-pointer py-3"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-fuchsia-400">{title}</span>
          <div className="flex items-center gap-2">
            {count > 0 && (
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-fuchsia-500 text-white text-[9px] font-bold">{count}</span>
            )}
            <span className={`text-muted-foreground text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
          </div>
        </button>
        {isOpen && (
          <div className="pb-4 pt-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
        active
          ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300'
          : 'bg-white/[0.02] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );

  const filtersContent = (
    <>
      <FilterSection title="Evento" count={selectedEvents.length}>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map(e => (
            <FilterChip key={e.value} label={e.label} active={selectedEvents.includes(e.value)} onClick={() => toggleFilter(selectedEvents, e.value, setSelectedEvents)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Categoría" count={selectedCategories.length}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <FilterChip key={c.value} label={c.label} active={selectedCategories.includes(c.value)} onClick={() => toggleFilter(selectedCategories, c.value, setSelectedCategories)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Talle" count={selectedSizes.length}>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(s => (
            <FilterChip key={s} label={s} active={selectedSizes.includes(s)} onClick={() => toggleFilter(selectedSizes, s, setSelectedSizes)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Color" count={selectedColors.length}>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => toggleFilter(selectedColors, c.value, setSelectedColors)}
              className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                selectedColors.includes(c.value)
                  ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300'
                  : 'bg-white/[0.02] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'
              }`}
              title={c.label}
            >
              <span className="w-3 h-3 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: c.hex }} />
              {c.label}
            </button>
          ))}
        </div>
      </FilterSection>
    </>
  );

  return (
    <div className="container mx-auto max-w-7xl px-6 pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8">
        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <span>☰</span> Filtros
            {activeCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-fuchsia-500 text-white text-[10px] font-bold">{activeCount}</span>
            )}
          </button>
          <p className="text-sm text-muted-foreground hidden sm:block">Mostrando prendas disponibles</p>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
              Limpiar filtros ✕
            </button>
          )}
          <span className="text-sm font-medium bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 p-6 mb-8">
          {error}
        </div>
      )}

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="lg:hidden mb-8 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Filtros</h3>
            <button onClick={() => setMobileFiltersOpen(false)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
          </div>
          {filtersContent}
        </div>
      )}

      <div className="flex gap-10">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold">Filtros</h3>
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-xs text-fuchsia-400 hover:text-fuchsia-300">
                  Limpiar
                </button>
              )}
            </div>
            {filtersContent}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((g) => (
              <Card key={g.id} className="group overflow-hidden bg-white/[0.03] backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl hover:shadow-glow hover:border-fuchsia-500/30 transition-all duration-500 flex flex-col">
                <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                  {g.photos_urls && g.photos_urls.length > 0 ? (
                    <Image 
                      src={g.photos_urls[0]} 
                      alt={g.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/30 text-muted-foreground">
                      <span className="text-xl opacity-50">✦</span>
                      <span className="text-xs uppercase tracking-widest mt-2 opacity-50">Sin foto</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="absolute top-4 left-4 flex flex-wrap gap-2 pr-3">
                    {g.category && (
                      <Badge variant="secondary" className="bg-black/50 backdrop-blur-md border-white/10 text-white/90 shadow-lg">
                        {g.category}
                      </Badge>
                    )}
                    {g.size_label && (
                      <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-fuchsia-500/30 text-fuchsia-300 shadow-lg">
                        Talle {g.size_label}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <CardContent className="p-5 flex-grow">
                  <h3 className="font-display text-base font-semibold line-clamp-1">{g.name}</h3>
                  <p className="text-muted-foreground text-xs mt-1 uppercase tracking-wider">SKU: {g.sku}</p>
                </CardContent>
                
                <CardFooter className="p-5 pt-0 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground mb-0.5">Alquiler</span>
                    <span className="font-bold text-lg">${g.rental_price?.toLocaleString('es-AR')}</span>
                  </div>
                  <Link href={`/catalog/${g.id}`} className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white hover:scale-[1.02] active:scale-95 px-5 py-2 transition-all duration-300 text-sm font-semibold shadow-glow hover:shadow-glow-lg">
                    Detalles
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && !error && (
            <div className="py-24 text-center flex flex-col items-center justify-center opacity-60">
              <div className="w-20 h-20 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-6 shadow-glow">
                <span className="text-3xl">✦</span>
              </div>
              <p className="text-xl font-display font-medium tracking-tight">No encontramos prendas</p>
              <p className="text-sm mt-2 max-w-sm text-muted-foreground">Probá ajustando los filtros para encontrar lo que buscás.</p>
              {activeCount > 0 && (
                <button onClick={clearAll} className="mt-4 text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors underline underline-offset-4">
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

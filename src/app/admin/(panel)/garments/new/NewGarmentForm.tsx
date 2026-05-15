'use client';

import { useState } from 'react';
import { createGarment, type AdminLocationOption } from '@/lib/actions/admin';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'Plus Size'] as const;

type Props = {
  locations: AdminLocationOption[];
};

export default function NewGarmentForm({ locations }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createGarment(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <a href="/admin/garments" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-colors">
          <span className="text-muted-foreground text-xl">←</span>
        </a>
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Nueva Prenda</h1>
          <p className="text-muted-foreground mt-1">
            Marcá los talles en los que tenés esta pieza. Se creará un registro por talle (mismo precio y fotos), con SKU{' '}
            <span className="text-fuchsia-300/90">BASE-TALLE</span>.
          </p>
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <input required name="name" type="text" placeholder="Ej: Vestido Esmeralda Noche" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">SKU base (sin talle)</label>
              <input required name="sku" type="text" placeholder="Ej: VEST-ESM-01" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Descripción</label>
            <textarea required name="description" rows={3} placeholder="Breve descripción del vestido..." className="w-full bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl p-4 outline-none transition-all text-foreground resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Categoría</label>
              <select required name="category" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground">
                <option className="text-black" value="vestido-largo">Vestido Largo</option>
                <option className="text-black" value="vestido-corto">Vestido Corto</option>
                <option className="text-black" value="gala">Gala</option>
                <option className="text-black" value="casamiento">Casamiento</option>
                <option className="text-black" value="cóctel">Cóctel</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Sede del ejemplar</label>
              {locations.length === 0 ? (
                <p className="text-xs text-amber-300/90 py-2">No hay sedes cargadas. Ejecutá la migración SQL o creá sedes en Supabase.</p>
              ) : (
                <select name="location_id" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground">
                  <option className="text-black" value="">
                    Sin asignar
                  </option>
                  {locations.map((loc) => (
                    <option className="text-black" key={loc.id} value={loc.id}>
                      {loc.name} — {loc.address_line}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Talles disponibles (uno o más)</label>
            <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
              {SIZE_OPTIONS.map((sz) => (
                <label key={sz} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" name="sizes" value={sz} className="rounded border-white/20" />
                  <span>{sz}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Precio de alquiler (UYU)</label>
              <input required name="rental_price" type="number" min="0" step="50" defaultValue="1500" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Garantía / seña (UYU)</label>
              <p className="text-xs text-muted-foreground">No puede superar el alquiler; suele ser ~⅓ (ej. $1.500 + $500).</p>
              <input required name="deposit_amount" type="number" min="0" step="50" defaultValue="500" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Fotos desde tu computadora</label>
            <p className="text-xs text-muted-foreground">Se comparten entre todos los talles (JPEG, PNG, WebP o GIF, hasta 5MB c/u, máximo 12).</p>
            <input
              name="photos"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-fuchsia-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-fuchsia-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">URLs de fotos (opcional, una por línea)</label>
            <p className="text-xs text-muted-foreground">Primero URLs, después archivos, en el arreglo final.</p>
            <textarea
              name="photos_urls"
              rows={3}
              placeholder="https://ejemplo.com/foto1.jpg"
              className="w-full bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl p-4 outline-none transition-all text-foreground resize-none font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl py-4 font-bold tracking-wide shadow-glow transition-all mt-4"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar variantes en el catálogo'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createGarment } from '@/lib/actions/admin';

export default function NewGarmentPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createGarment(formData);

    // If result is returned, it means there was an error (otherwise it redirects)
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
          <p className="text-muted-foreground mt-1">Ingresa los datos para agregar un vestido al catálogo.</p>
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <input required name="name" type="text" placeholder="Ej: Vestido Esmeralda Noche" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">SKU (Identificador)</label>
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
              <label className="text-sm font-medium text-muted-foreground">Talle</label>
              <select required name="size_label" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground">
                <option className="text-black" value="XS">XS</option>
                <option className="text-black" value="S">S</option>
                <option className="text-black" value="M">M</option>
                <option className="text-black" value="L">L</option>
                <option className="text-black" value="XL">XL</option>
                <option className="text-black" value="Plus Size">Plus Size</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Precio de Alquiler (ARS)</label>
              <input required name="rental_price" type="number" min="0" defaultValue="15000" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Valor de Garantía/Seña (ARS)</label>
              <input required name="deposit_amount" type="number" min="0" defaultValue="5000" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground font-mono" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl py-4 font-bold tracking-wide shadow-glow transition-all mt-4"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Prenda en el Catálogo'}
          </button>
        </form>
      </div>
    </div>
  );
}

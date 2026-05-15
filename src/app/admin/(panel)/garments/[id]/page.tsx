import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { listGarmentLocations, updateGarment } from '@/lib/actions/admin';

export default async function EditGarmentPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const [{ data: garment, error }, locations] = await Promise.all([
    supabase
      .from('garments')
      .select('*')
      .eq('id', params.id)
      .single(),
    listGarmentLocations(),
  ]);

  if (error || !garment) {
    notFound();
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <a href="/admin/garments" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-colors">
          <span className="text-muted-foreground text-xl">←</span>
        </a>
        <div>
          <h1 className="font-admin-display text-4xl font-bold tracking-tight">Editar Prenda</h1>
          <p className="text-muted-foreground mt-1">Modifica los detalles, precios o estado operativo.</p>
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl">
        <form action={updateGarment} className="space-y-6">
          <input type="hidden" name="id" value={garment.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <input required defaultValue={garment.name || ''} name="name" type="text" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">SKU / Identificador</label>
              <input required defaultValue={garment.sku || ''} name="sku" type="text" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Descripción</label>
            <textarea required defaultValue={garment.description || ''} name="description" rows={3} className="w-full bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl p-4 outline-none transition-all text-foreground resize-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Categoría</label>
              <select required defaultValue={garment.category || ''} name="category" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground">
                <option className="text-black" value="vestido-largo">Vestido Largo</option>
                <option className="text-black" value="vestido-corto">Vestido Corto</option>
                <option className="text-black" value="gala">Gala</option>
                <option className="text-black" value="casamiento">Casamiento</option>
                <option className="text-black" value="cóctel">Cóctel</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Talle</label>
              <select required defaultValue={garment.size_label || ''} name="size_label" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground">
                <option className="text-black" value="XS">XS</option>
                <option className="text-black" value="S">S</option>
                <option className="text-black" value="M">M</option>
                <option className="text-black" value="L">L</option>
                <option className="text-black" value="XL">XL</option>
                <option className="text-black" value="Plus Size">Plus Size</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Estado operativo</label>
              <select required defaultValue={garment.operative_status || 'available'} name="operative_status" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground">
                <option className="text-black" value="available">Disponible (catálogo)</option>
                <option className="text-black" value="processing">Procesando post-devolución</option>
                <option className="text-black" value="in_cleaning">En tintorería</option>
                <option className="text-black" value="in_repair">En reparación</option>
                <option className="text-black" value="reserved">Reservada (uso interno)</option>
                <option className="text-black" value="retired">Retirada / baja</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Sede</label>
              <select
                name="location_id"
                defaultValue={garment.location_id || ''}
                className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground"
              >
                <option className="text-black" value="">Sin asignar</option>
                {locations.map((loc) => (
                  <option className="text-black" key={loc.id} value={loc.id}>
                    {loc.name} — {loc.address_line}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Precio de alquiler (UYU)</label>
              <input required defaultValue={garment.rental_price || 0} name="rental_price" type="number" min="0" step="50" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Garantía / seña (UYU)</label>
              <p className="text-xs text-muted-foreground">Debe ser menor o igual al alquiler (típico ~⅓).</p>
              <input required defaultValue={garment.deposit_amount || 0} name="deposit_amount" type="number" min="0" step="50" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">URLs de Fotos (Una por línea)</label>
            <textarea 
              name="photos_urls" 
              defaultValue={garment.photos_urls?.join('\n') || ''} 
              rows={4} 
              placeholder="https://ejemplo.com/foto1.jpg"
              className="w-full bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl p-4 outline-none transition-all text-foreground resize-none font-mono text-sm" 
            />
            {garment.photos_urls?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {garment.photos_urls.map((url: string, i: number) => (
                  <div key={i} className="w-16 h-20 rounded bg-white/10 shrink-0 overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl py-4 font-bold tracking-wide shadow-glow transition-all mt-4"
          >
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}

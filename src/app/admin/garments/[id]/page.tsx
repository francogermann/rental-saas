import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { updateGarment } from '@/lib/actions/admin';

export default async function EditGarmentPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: garment, error } = await supabase
    .from('garments')
    .select('*')
    .eq('id', params.id)
    .single();

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
          <h1 className="font-display text-4xl font-bold tracking-tight">Editar Prenda</h1>
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
              <label className="text-sm font-medium text-muted-foreground">Estado Operativo</label>
              <select required defaultValue={garment.operative_status || ''} name="operative_status" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground">
                <option className="text-black" value="disponible">🟢 Disponible</option>
                <option className="text-black" value="mantenimiento">🟡 Mantenimiento / Tintorería</option>
                <option className="text-black" value="fuera_de_servicio">🔴 Fuera de Servicio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Precio de Alquiler (ARS)</label>
              <input required defaultValue={garment.rental_price || 0} name="rental_price" type="number" min="0" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Valor de Garantía (ARS)</label>
              <input required defaultValue={garment.deposit_amount || 0} name="deposit_amount" type="number" min="0" className="w-full h-12 bg-white/5 border border-white/10 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 rounded-xl px-4 outline-none transition-all text-foreground font-mono" />
            </div>
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

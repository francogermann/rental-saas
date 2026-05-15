/**
 * Recomendaciones curadas de calzado para acompañar el vestido (ver anotaciones del proyecto).
 * Cuando existan prendas reales (p. ej. categoría accesorios/zapatos), se puede reemplazar
 * esta lista por datos de Supabase manteniendo el mismo componente de carrusel.
 */
export type ShoeRecommendation = {
  id: string;
  name: string;
  imageUrl: string;
  /** Opcional: enlace a WhatsApp, catálogo PDF o producto externo. */
  href?: string;
};

export const SHOE_RECOMMENDATIONS: ShoeRecommendation[] = [
  {
    id: 'heel-nude',
    name: 'Tacón nude clásico',
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'heel-strap',
    name: 'Sandalia de tiras',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d95?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'heel-black',
    name: 'Tacón negro liso',
    imageUrl: 'https://images.unsplash.com/photo-1573100924588-4b48229116bf?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'heel-silver',
    name: 'Metálico plateado',
    imageUrl: 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'flat-elegant',
    name: 'Bailarina / puntera',
    imageUrl: 'https://images.unsplash.com/photo-1582897085656-c636d006a246?auto=format&fit=crop&w=400&q=80',
  },
];

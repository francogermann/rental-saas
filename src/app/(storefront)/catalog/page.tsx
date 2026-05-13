import { searchAvailableGarments } from '@/lib/actions/availability';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

export default async function CatalogPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const pickupDate = typeof searchParams.pickupDate === 'string' ? searchParams.pickupDate : new Date().toISOString().split('T')[0];
  const returnDate = typeof searchParams.returnDate === 'string' ? searchParams.returnDate : new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const { data: garments, error } = await searchAvailableGarments({
    pickupDate,
    returnDate,
    limit: 20
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(315_100%_60%/.12),transparent_50%)]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-fuchsia-400 via-pink-300 to-purple-400 bg-clip-text text-transparent">
            Colección Exclusiva
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Prendas de diseñador seleccionadas para tus eventos más importantes. Reservá online y viví la experiencia VIP.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="container mx-auto max-w-7xl px-6 pb-24">
        <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-12">
          <div>
            <p className="text-sm text-muted-foreground">Mostrando prendas disponibles</p>
          </div>
          <span className="text-sm font-medium bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full">
            {garments?.length ?? 0} resultados
          </span>
        </div>

        {error && (
          <div className="rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 p-6 mb-8">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {garments?.map((g) => (
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
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Badges */}
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
              
              <CardContent className="p-6 flex-grow">
                <h3 className="font-display text-lg font-semibold line-clamp-1">{g.name}</h3>
                <p className="text-muted-foreground text-xs mt-1.5 uppercase tracking-wider">SKU: {g.sku}</p>
              </CardContent>
              
              <CardFooter className="p-6 pt-0 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground mb-0.5">Alquiler</span>
                  <span className="font-bold text-xl">${g.rental_price?.toLocaleString('es-AR')}</span>
                </div>
                <Link href={`/catalog/${g.id}`} className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white hover:scale-[1.02] active:scale-95 px-6 py-2.5 transition-all duration-300 text-sm font-semibold shadow-glow hover:shadow-glow-lg">
                  Detalles
                </Link>
              </CardFooter>
            </Card>
          ))}
          
          {garments?.length === 0 && !error && (
            <div className="col-span-full py-24 text-center flex flex-col items-center justify-center opacity-60">
              <div className="w-20 h-20 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-6 shadow-glow">
                <span className="text-3xl">✦</span>
              </div>
              <p className="text-xl font-display font-medium tracking-tight">No hay prendas disponibles</p>
              <p className="text-sm mt-2 max-w-sm text-muted-foreground">Intenta ajustar las fechas o los filtros para encontrar lo que buscás.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

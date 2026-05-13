import { searchAvailableGarments } from '@/lib/actions/availability';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

export default async function CatalogPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Parsing search params safely for the RPC query
  const pickupDate = typeof searchParams.pickupDate === 'string' ? searchParams.pickupDate : new Date().toISOString().split('T')[0];
  const returnDate = typeof searchParams.returnDate === 'string' ? searchParams.returnDate : new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]; // Default +3 days

  const { data: garments, error } = await searchAvailableGarments({
    pickupDate,
    returnDate,
    limit: 20
  });

  return (
    <div className="container max-w-screen-xl px-4 py-12 mx-auto">
      <div className="flex flex-col min-h-[70vh] md:flex-row gap-8">
        
        {/* Sidebar Fillters placeholder */}
        <aside className="w-full md:w-64 space-y-6">
           <div className="sticky top-24">
             <h2 className="text-lg font-semibold tracking-tight mb-4">Filtros</h2>
             <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 text-sm text-muted-foreground relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <p className="relative z-10 text-balance">
                 Selector interactivo en desarrollo. A futuro aquí irá el Date Picker genérico para buscar prendas en fechas específicas.
               </p>
             </div>
           </div>
        </aside>

        {/* Catalog Grid */}
        <div className="flex-1 space-y-8">
           <div className="flex items-end justify-between border-b border-border/50 pb-4">
             <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Colección Disponible</h1>
                <p className="text-sm text-muted-foreground mt-1">Descubre prendas exclusivas para tus fechas.</p>
             </div>
             <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
               {garments?.length ?? 0} resultados
             </span>
           </div>

           {error && (
             <div className="rounded-lg bg-destructive/10 text-destructive border border-destructive/20 p-4">
               {error}
             </div>
           )}

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {garments?.map((g) => (
                <Card key={g.id} className="group overflow-hidden border-border/40 bg-card hover:shadow-2xl hover:border-primary/20 transition-all duration-500 flex flex-col">
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
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50 text-muted-foreground">
                         <span className="text-xl opacity-50">✦</span>
                         <span className="text-xs uppercase tracking-widest mt-2 opacity-50">Sin foto</span>
                       </div>
                     )}
                     
                     {/* Tags & Badges */}
                     <div className="absolute top-3 left-3 flex flex-wrap gap-2 pr-3">
                       {g.category && (
                         <Badge variant="secondary" className="bg-background/95 backdrop-blur-md shadow-sm">
                           {g.category}
                         </Badge>
                       )}
                       {g.size_label && (
                         <Badge variant="outline" className="bg-background/95 backdrop-blur-md border-primary/20 shadow-sm text-primary">
                           Talle {g.size_label}
                         </Badge>
                       )}
                     </div>
                  </div>
                  
                  <CardContent className="p-5 flex-grow border-t border-border/10">
                    <h3 className="font-semibold text-lg line-clamp-1">{g.name}</h3>
                    <p className="text-muted-foreground text-xs mt-1 uppercase tracking-wider">SKU: {g.sku}</p>
                  </CardContent>
                  
                  <CardFooter className="p-5 pt-0 flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground mb-0.5">Precio de Alquiler</span>
                      <span className="font-bold text-xl">${g.rental_price?.toLocaleString('es-AR')}</span>
                    </div>
                    <Link href={`/catalog/${g.id}`} className="rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring focus-visible:ring-primary/20 px-5 py-2.5 transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-primary/25 hover:-translate-y-0.5">
                      Detalles
                    </Link>
                  </CardFooter>
                </Card>
             ))}
             
             {garments?.length === 0 && !error && (
               <div className="col-span-full py-24 text-center flex flex-col items-center justify-center opacity-60">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                 </div>
                 <p className="text-xl font-medium tracking-tight">No hay prendas disponibles</p>
                 <p className="text-sm mt-2 max-w-sm">Intenta ajustar las fechas o los filtros para encontrar lo que buscas.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

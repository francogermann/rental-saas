import { searchAvailableGarments } from '@/lib/actions/availability';
import CatalogClient from './CatalogClient';

export default async function CatalogPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const pickupDate = typeof searchParams.pickupDate === 'string' ? searchParams.pickupDate : new Date().toISOString().split('T')[0];
  const returnDate = typeof searchParams.returnDate === 'string' ? searchParams.returnDate : new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const { data: garments, error } = await searchAvailableGarments({
    pickupDate,
    returnDate,
    limit: 50
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(315_100%_60%/.12),transparent_50%)]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-fuchsia-400 via-pink-300 to-purple-400 bg-clip-text text-transparent">
            Nuestra Colección
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Vestidos de fiesta, graduación, casamiento y gala. Encontrá el tuyo y reservalo sin agenda previa.
          </p>
        </div>
      </section>

      {/* Catalog with Filters */}
      <CatalogClient garments={garments ?? []} error={error} />
    </div>
  );
}

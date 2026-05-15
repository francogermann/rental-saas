import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { primaryPhotoUrl } from '@/lib/photo-urls';
import { formatUy } from '@/lib/utils';
import type { GarmentSummary } from '@/types/domain';

type Props = {
  items: GarmentSummary[];
  pickupLocationId: string;
  pickupDate: string;
  returnDate: string;
};

export function SimilarGarments({ items, pickupLocationId, pickupDate, returnDate }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="mt-12 border-t border-white/10 pt-10 sm:mt-20 sm:pt-16">
      <h2 className="mb-4 font-display text-xl font-bold tracking-tight sm:mb-8 sm:text-2xl">Similares</h2>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground sm:mb-8">
        Misma categoría y talle. La disponibilidad puede variar según las fechas que elijas.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((g) => {
          const thumb = primaryPhotoUrl(g.photos_urls);
          return (
          <Link
            key={g.id}
            href={`/catalog/${g.id}?pickupLocationId=${encodeURIComponent(pickupLocationId)}&pickupDate=${encodeURIComponent(pickupDate)}&returnDate=${encodeURIComponent(returnDate)}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-fuchsia-500/30"
          >
            <div className="relative aspect-[3/4] bg-muted">
              {thumb ? (
                <Image
                  src={thumb}
                  alt={g.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sin foto</div>
              )}
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {g.category && (
                  <Badge variant="secondary" className="border-white/10 bg-black/50 text-white/90 backdrop-blur-md">
                    {g.category}
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-4">
              <p className="font-display line-clamp-1 text-sm font-semibold">{g.name}</p>
              <p className="mt-1 text-xs font-bold">{formatUy(g.rental_price)}</p>
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}

'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalYmd } from '@/lib/calendar-date';
import { selectShoesForRentalWindow } from '@/lib/shoe-recommendations';

export interface ShoeRecommendationsRailProps {
  pickupDate: string;
  returnDate: string;
}

export function ShoeRecommendationsRail({ pickupDate, returnDate }: ShoeRecommendationsRailProps) {
  const items = useMemo(
    () => selectShoesForRentalWindow(pickupDate, returnDate, 7),
    [pickupDate, returnDate],
  );

  const rangeLabel = useMemo(() => {
    if (!pickupDate || !returnDate) return null;
    try {
      const from = parseLocalYmd(pickupDate);
      const to = parseLocalYmd(returnDate);
      return `${format(from, "d MMM", { locale: es })} – ${format(to, "d MMM yyyy", { locale: es })}`;
    } catch {
      return null;
    }
  }, [pickupDate, returnDate]);

  if (items.length === 0) return null;

  return (
    <section
      className="mt-16 border-t border-white/10 pt-12"
      aria-label="Zapatos sugeridos para combinar con tu vestido"
    >
      <h2 className="font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
        Zapatos que combinan
      </h2>
      {rangeLabel && (
        <p className="mt-1 text-sm text-muted-foreground">
          Sugerencias para tu ventana de alquiler: <span className="text-foreground/90">{rangeLabel}</span>
        </p>
      )}
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Ideas de calzado para completar tu look. Consultá en tienda disponibilidad y talles.
      </p>

      <ul className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
        {items.map((item) => {
          const card = (
            <div className="w-[140px] shrink-0 snap-start sm:w-[160px]">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-muted">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="160px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <p className="mt-2 line-clamp-2 text-xs font-medium text-foreground">{item.name}</p>
            </div>
          );

          return (
            <li key={item.id} className="shrink-0">
              {item.href ? (
                <a
                  href={item.href}
                  className="group block rounded-xl outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {card}
                </a>
              ) : (
                <div className="group block rounded-xl">{card}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

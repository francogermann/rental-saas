'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toLocalYmdString } from '@/lib/calendar-date';
import {
  deriveRentalRangeFromEventDate,
  formatEventDateEs,
} from '@/lib/catalog/event-date-range';
import type { CatalogLocationOption } from '@/app/(storefront)/catalog/CatalogClient';

type Props = {
  locations: CatalogLocationOption[];
  defaultLocationId?: string;
};

export function CatalogEventDateGate({ locations, defaultLocationId }: Props) {
  const router = useRouter();
  const today = useMemo(() => toLocalYmdString(new Date()), []);

  const initialLoc =
    defaultLocationId && locations.some((l) => l.id === defaultLocationId)
      ? defaultLocationId
      : locations.length === 1
        ? locations[0].id
        : '';

  const [eventDate, setEventDate] = useState('');
  const [pickupLoc, setPickupLoc] = useState(initialLoc);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!eventDate) return null;
    return deriveRentalRangeFromEventDate(eventDate, today);
  }, [eventDate, today]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!eventDate) {
      setError('Elegí la fecha de tu evento.');
      return;
    }

    if (locations.length > 1 && !pickupLoc) {
      setError('Elegí la sede de retiro.');
      return;
    }

    const derived = deriveRentalRangeFromEventDate(eventDate, today);
    if (!derived.ok) {
      setError(derived.error);
      return;
    }

    const loc = pickupLoc || locations[0]?.id;
    const params = new URLSearchParams();
    params.set('eventDate', eventDate);
    params.set('pickupDate', derived.range.pickupDate);
    params.set('returnDate', derived.range.returnDate);
    params.set('availableOnly', '1');
    if (loc) params.set('pickupLocationId', loc);

    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">¿Cuándo es tu evento?</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Te mostramos solo vestidos disponibles para esas fechas. No hace falta revisar prendas que ya están reservadas.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="eventDate" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fecha del evento
            </label>
            <input
              id="eventDate"
              type="date"
              min={today}
              value={eventDate}
              onChange={(e) => {
                setEventDate(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-foreground focus:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
              required
            />
          </div>

          {locations.length > 1 ? (
            <div>
              <label htmlFor="pickupLoc" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sede de retiro
              </label>
              <select
                id="pickupLoc"
                value={pickupLoc}
                onChange={(e) => setPickupLoc(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
              >
                <option value="" className="bg-background">
                  Elegí una sede
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-background">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          ) : locations.length === 1 ? (
            <p className="text-xs text-muted-foreground">
              Sede de retiro: <span className="text-foreground">{locations[0].name}</span>
            </p>
          ) : null}

          {preview?.ok ? (
            <p className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-100/90">
              Evento: <span className="font-medium">{formatEventDateEs(preview.range.eventDate)}</span>
              <br />
              Retiro: {formatEventDateEs(preview.range.pickupDate)} · Devolución:{' '}
              {formatEventDateEs(preview.range.returnDate)}
            </p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3.5 font-semibold text-white shadow-glow transition hover:from-fuchsia-400 hover:to-purple-500"
          >
            Ver vestidos disponibles
          </button>
        </form>
      </div>
    </div>
  );
}

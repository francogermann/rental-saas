'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toLocalYmdString } from '@/lib/calendar-date';
import {
  deriveRentalRangeFromEventDate,
  formatEventDateEs,
} from '@/lib/catalog/event-date-range';
import type { CatalogLocationOption } from '@/app/(storefront)/catalog/CatalogClient';

type Props = {
  open: boolean;
  locations: CatalogLocationOption[];
  defaultLocationId?: string;
  initialError?: string | null;
};

export function CatalogEventDateModal({ open, locations, defaultLocationId, initialError }: Props) {
  const router = useRouter();
  const today = useMemo(() => toLocalYmdString(new Date()), []);
  const dialogRef = useRef<HTMLDivElement>(null);

  const initialLoc =
    defaultLocationId && locations.some((l) => l.id === defaultLocationId)
      ? defaultLocationId
      : locations.length === 1
        ? locations[0].id
        : '';

  const [eventDate, setEventDate] = useState('');
  const [pickupLoc, setPickupLoc] = useState(initialLoc);
  const [error, setError] = useState<string | null>(initialError ?? null);

  useEffect(() => {
    setError(initialError ?? null);
  }, [initialError]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

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

  const handleBrowseOnly = () => {
    router.replace('/catalog?showAll=1');
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-date-modal-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-background/95 p-8 shadow-2xl backdrop-blur-xl outline-none"
      >
        <h2 id="event-date-modal-title" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          ¿Cuándo es tu evento?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Te mostramos solo vestidos disponibles para esas fechas. También podés explorar toda la colección sin
          elegir fecha.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="eventDate"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
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
            />
          </div>

          {locations.length > 1 ? (
            <div>
              <label
                htmlFor="pickupLoc"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
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

          <button
            type="button"
            onClick={handleBrowseOnly}
            className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            Todavía no tengo fecha definida — solo quiero ver la colección
          </button>
        </form>
      </div>
    </div>
  );
}

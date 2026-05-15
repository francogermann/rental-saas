'use client';

import { useFormState } from 'react-dom';
import { useMemo, useState } from 'react';
import { createManualReservation, type ManualReservationFormState } from '@/lib/actions/admin';

export type ManualReservationGarmentOption = {
  id: string;
  name: string;
  sku: string;
  rental_price: number;
  deposit_amount: number;
  photos_urls: string[];
  location_id: string | null;
  location_name: string | null;
};

export type ManualReservationCustomerOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type ManualReservationLocationOption = {
  id: string;
  name: string;
  address_line: string;
};

const initialState: ManualReservationFormState = {};

export function ManualReservationForm({
  garments,
  customers,
  locations,
  defaultPickup,
  defaultReturn,
  defaultEvent,
}: {
  garments: ManualReservationGarmentOption[];
  customers: ManualReservationCustomerOption[];
  locations: ManualReservationLocationOption[];
  defaultPickup: string;
  defaultReturn: string;
  defaultEvent: string;
}) {
  const [state, formAction] = useFormState(createManualReservation, initialState);
  const [customerMode, setCustomerMode] = useState<'registered' | 'walk_in'>('registered');
  const [garmentId, setGarmentId] = useState('');
  const [garmentSearch, setGarmentSearch] = useState('');

  const selected = useMemo(() => garments.find((g) => g.id === garmentId), [garments, garmentId]);

  const filteredGarments = useMemo(() => {
    const q = garmentSearch.trim().toLowerCase();
    if (!q) return garments;
    return garments.filter(
      (g) => g.name.toLowerCase().includes(q) || g.sku.toLowerCase().includes(q),
    );
  }, [garments, garmentSearch]);

  return (
    <form action={formAction} className="space-y-8 max-w-3xl">
      {state?.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</div>
      ) : null}

      <input type="hidden" name="customer_mode" value={customerMode} />
      <input type="hidden" name="garment_id" value={garmentId} />

      <p className="text-sm text-muted-foreground border border-white/10 rounded-lg px-4 py-3 bg-white/[0.02]">
        Reserva manual sin Mercado Pago: queda en estado <span className="text-emerald-300 font-medium">confirmed</span> y
        bloquea las fechas en el calendario como una reserva habitual.
      </p>

      <section className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Clienta</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCustomerMode('registered')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              customerMode === 'registered'
                ? 'border-fuchsia-500/50 bg-fuchsia-500/15 text-fuchsia-100'
                : 'border-white/10 bg-black/30 text-muted-foreground hover:bg-white/[0.06]'
            }`}
          >
            Ya está registrada
          </button>
          <button
            type="button"
            onClick={() => setCustomerMode('walk_in')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              customerMode === 'walk_in'
                ? 'border-fuchsia-500/50 bg-fuchsia-500/15 text-fuchsia-100'
                : 'border-white/10 bg-black/30 text-muted-foreground hover:bg-white/[0.06]'
            }`}
          >
            Alta rápida (mostrador)
          </button>
        </div>

        {customerMode === 'registered' ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Elegí de la lista
            </label>
            <select
              name="customer_id"
              required
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground"
            >
              <option value="">Seleccioná una clienta…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.last_name}, {c.first_name} — {c.email}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Para quien viene en persona y aún no tiene ficha: se crea el registro de clienta al guardar la reserva. Si no
              cargás email, generamos uno interno único.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Nombre (obligatorio)
              </label>
              <input
                type="text"
                name="walk_in_full_name"
                required
                placeholder="Ej. María López o solo María"
                autoComplete="name"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  name="walk_in_phone"
                  placeholder="099 …"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  name="walk_in_email"
                  placeholder="Vacío = correo interno"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Prenda</h2>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Buscar por nombre o SKU (en vivo)
          </label>
          <input
            type="search"
            value={garmentSearch}
            onChange={(e) => setGarmentSearch(e.target.value)}
            placeholder="Escribí para acotar la lista…"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />
        </div>
        <div className="max-h-[min(24rem,50vh)] overflow-y-auto rounded-xl border border-white/10 bg-black/20">
          {filteredGarments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay prendas que coincidan. Probá otra búsqueda o usá el filtro superior de la página.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {filteredGarments.map((g) => {
                const active = g.id === garmentId;
                const thumb = g.photos_urls?.[0];
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => setGarmentId(g.id)}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition-colors ${
                        active ? 'bg-fuchsia-600/20 ring-1 ring-inset ring-fuchsia-500/40' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5">
                        {thumb ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-1 text-center text-[9px] text-muted-foreground">
                            Sin foto
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground line-clamp-2">{g.name}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">SKU {g.sku}</div>
                        {g.location_name ? (
                          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-fuchsia-200/80">
                            Depósito: {g.location_name}
                          </div>
                        ) : null}
                        <div className="mt-1 text-xs text-zinc-400">
                          Alquiler {g.rental_price} · Seña {g.deposit_amount}
                        </div>
                      </div>
                      {active ? (
                        <span className="shrink-0 rounded-full bg-fuchsia-500/30 px-2 py-0.5 text-[10px] font-bold uppercase text-fuchsia-200">
                          Elegida
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {!garmentId ? (
          <p className="text-xs text-amber-200/90">Tocá una fila de la lista para elegir la prenda.</p>
        ) : selected ? (
          <p className="text-xs text-muted-foreground">
            Precios sugeridos abajo: alquiler {selected.rental_price}, seña {selected.deposit_amount} (editables).
            {selected.location_name ? (
              <>
                {' '}
                · Depósito físico: <span className="text-fuchsia-200/90">{selected.location_name}</span>
              </>
            ) : null}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Retiro y logística</h2>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sede de retiro pactada (opcional)
          </label>
          <select
            name="pickup_location_id"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground"
            defaultValue=""
          >
            <option value="">Igual que la sede del vestido (depósito físico)</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Si la clienta retira en otra sede, elegila acá; queda registrada en la reserva aunque el vestido esté en
            depósito en otra ubicación.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Notas / logística
          </label>
          <textarea
            name="reservation_notes"
            rows={3}
            placeholder="Ej. coordinar traslado a Montevideo, retira la hermana…"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm placeholder:text-muted-foreground/50"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Retiro</label>
          <input
            type="date"
            name="pickup_date"
            required
            defaultValue={defaultPickup}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Devolución</label>
          <input
            type="date"
            name="return_date"
            required
            defaultValue={defaultReturn}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Evento (opc.)</label>
          <input
            type="date"
            name="event_date"
            defaultValue={defaultEvent}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Alquiler</label>
          <input
            type="number"
            name="rental_price"
            required
            min={0}
            step="0.01"
            defaultValue={selected?.rental_price ?? ''}
            key={`rental-${garmentId || 'none'}`}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Seña / garantía</label>
          <input
            type="number"
            name="deposit_amount"
            required
            min={0}
            step="0.01"
            defaultValue={selected?.deposit_amount ?? ''}
            key={`dep-${garmentId || 'none'}`}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:from-fuchsia-500 hover:to-purple-500 sm:w-auto"
      >
        Crear reserva manual
      </button>
    </form>
  );
}

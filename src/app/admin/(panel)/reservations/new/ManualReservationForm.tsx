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
};

export type ManualReservationCustomerOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

const initialState: ManualReservationFormState = {};

export function ManualReservationForm({
  garments,
  customers,
  defaultPickup,
  defaultReturn,
  defaultEvent,
}: {
  garments: ManualReservationGarmentOption[];
  customers: ManualReservationCustomerOption[];
  defaultPickup: string;
  defaultReturn: string;
  defaultEvent: string;
}) {
  const [state, formAction] = useFormState(createManualReservation, initialState);
  const [garmentId, setGarmentId] = useState('');
  const selected = useMemo(() => garments.find((g) => g.id === garmentId), [garments, garmentId]);

  return (
    <form action={formAction} className="space-y-6 max-w-xl">
      {state?.error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</div>
      ) : null}

      <p className="text-sm text-muted-foreground border border-white/10 rounded-lg px-4 py-3 bg-white/[0.02]">
        Reserva manual sin Mercado Pago: queda en estado <span className="text-emerald-300 font-medium">confirmed</span> y
        bloquea las fechas en el calendario como una reserva habitual.
      </p>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Clienta</label>
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

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Prenda (disponible)</label>
        <select
          name="garment_id"
          required
          value={garmentId}
          onChange={(e) => setGarmentId(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground"
        >
          <option value="">Seleccioná una prenda…</option>
          {garments.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} — {g.sku}
            </option>
          ))}
        </select>
        {selected ? (
          <p className="text-xs text-muted-foreground">
            Precios sugeridos: alquiler {selected.rental_price}, seña {selected.deposit_amount} (podés ajustarlos abajo).
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-6 py-2.5 text-sm font-semibold shadow-glow transition-all"
      >
        Crear reserva manual
      </button>
    </form>
  );
}

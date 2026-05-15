'use client';

import { useRouter } from 'next/navigation';
import type { ManualReservationLocationOption } from './ManualReservationForm';

type GarmentInventoryFilterProps = {
  scopeAll: boolean;
  garmentLocId: string;
  locations: ManualReservationLocationOption[];
};

export function GarmentInventoryFilter({ scopeAll, garmentLocId, locations }: GarmentInventoryFilterProps) {
  const router = useRouter();

  function apply(scope: string, locationId: string) {
    const params = new URLSearchParams();
    if (scope === 'all') {
      params.set('garment_scope', 'all');
    } else if (locationId) {
      params.set('garment_location_id', locationId);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/reservations/new?${qs}` : '/admin/reservations/new');
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="w-full min-w-[200px] space-y-1 sm:max-w-xs">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Inventario listado</label>
        <select
          defaultValue={scopeAll ? 'all' : ''}
          onChange={(e) => {
            const all = e.target.value === 'all';
            apply(all ? 'all' : '', all ? '' : garmentLocId);
          }}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
        >
          <option value="">Solo sede seleccionada</option>
          <option value="all">Todas las sedes</option>
        </select>
      </div>

      {!scopeAll ? (
        <div className="w-full min-w-[200px] space-y-1 sm:max-w-xs">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Sede (prendas)</label>
          <select
            defaultValue={garmentLocId}
            onChange={(e) => apply('', e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

import type { GarmentSummary } from '@/types/domain';

/** Sede para reserva/detalle: filtro aplicado, sede de la prenda o primera sede de la org. */
export function resolvePickupLocationForGarment(
  garment: Pick<GarmentSummary, 'location_id'>,
  appliedPickupLoc: string,
  locations: { id: string }[],
): string {
  if (appliedPickupLoc) return appliedPickupLoc;
  if (garment.location_id) return garment.location_id;
  return locations[0]?.id ?? '';
}

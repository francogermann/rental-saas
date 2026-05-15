/** Valores de BD (inglés) → etiquetas para el panel admin. */

export const OPERATIVE_STATUS_VALUES = [
  'available',
  'processing',
  'in_cleaning',
  'in_repair',
  'reserved',
  'retired',
] as const;

export type OperativeStatusValue = (typeof OPERATIVE_STATUS_VALUES)[number];

const OPERATIVE_STATUS_LABELS: Record<OperativeStatusValue, string> = {
  available: 'Disponible (catálogo)',
  processing: 'Procesando post-devolución',
  in_cleaning: 'En tintorería',
  in_repair: 'En reparación',
  reserved: 'Reservada (uso interno)',
  retired: 'Retirada / baja',
};

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Esperando pago',
  confirmed: 'Confirmada',
  paid: 'Pagada',
  delivered: 'Entregada',
  returned: 'Devuelta',
  cancelled: 'Cancelada',
  disputed: 'En disputa',
};

export function labelOperativeStatus(status: string): string {
  return OPERATIVE_STATUS_LABELS[status as OperativeStatusValue] ?? status;
}

export function labelReservationStatus(status: string): string {
  return RESERVATION_STATUS_LABELS[status] ?? status;
}

export function isOperativeStatus(value: string): value is OperativeStatusValue {
  return (OPERATIVE_STATUS_VALUES as readonly string[]).includes(value);
}

import { addDays, parseISO, startOfDay } from 'date-fns';
import { toLocalYmdString } from '@/lib/calendar-date';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type DerivedRentalRange = {
  eventDate: string;
  pickupDate: string;
  returnDate: string;
};

export type DeriveRentalRangeResult =
  | { ok: true; range: DerivedRentalRange }
  | { ok: false; error: string };

function parseYmd(ymd: string): Date {
  return startOfDay(parseISO(ymd));
}

export function isValidDateYmd(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = parseYmd(value);
  return !Number.isNaN(d.getTime());
}

/** Retiro = evento − 1 día (mínimo hoy), devolución = evento + 1 día. */
export function deriveRentalRangeFromEventDate(
  eventDate: string,
  todayYmd?: string,
): DeriveRentalRangeResult {
  if (!isValidDateYmd(eventDate)) {
    return { ok: false, error: 'Elegí una fecha de evento válida.' };
  }

  const today = todayYmd ? parseYmd(todayYmd) : startOfDay(new Date());
  const event = parseYmd(eventDate);

  if (event < today) {
    return { ok: false, error: 'La fecha del evento no puede ser en el pasado.' };
  }

  const pickupCandidate = addDays(event, -1);
  const pickup = pickupCandidate < today ? today : pickupCandidate;
  const returnD = addDays(event, 1);

  if (pickup > returnD) {
    return { ok: false, error: 'No hay ventana de alquiler válida para esa fecha.' };
  }

  return {
    ok: true,
    range: {
      eventDate,
      pickupDate: toLocalYmdString(pickup),
      returnDate: toLocalYmdString(returnD),
    },
  };
}

export function formatEventDateEs(ymd: string): string {
  if (!isValidDateYmd(ymd)) return ymd;
  const d = parseYmd(ymd);
  return d.toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' });
}

type SearchParamsLike = Record<string, string | string[] | undefined>;

function pickDate(sp: SearchParamsLike, key: string): string | undefined {
  const v = sp[key];
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return isValidDateYmd(t) ? t : undefined;
}

export function hasCatalogEventContext(searchParams: SearchParamsLike): boolean {
  const eventDate = pickDate(searchParams, 'eventDate');
  if (eventDate) return true;

  const pickup = pickDate(searchParams, 'pickupDate');
  const ret = pickDate(searchParams, 'returnDate');
  return Boolean(pickup && ret);
}

export function resolveCatalogDatesFromSearchParams(
  searchParams: SearchParamsLike,
  todayYmd?: string,
): { ok: true; eventDate: string | null; pickupDate: string; returnDate: string } | { ok: false; error: string } {
  const eventDateRaw = pickDate(searchParams, 'eventDate');
  if (eventDateRaw) {
    const derived = deriveRentalRangeFromEventDate(eventDateRaw, todayYmd);
    if (!derived.ok) return derived;
    return {
      ok: true,
      eventDate: eventDateRaw,
      pickupDate: derived.range.pickupDate,
      returnDate: derived.range.returnDate,
    };
  }

  const pickup = pickDate(searchParams, 'pickupDate');
  const ret = pickDate(searchParams, 'returnDate');
  if (pickup && ret) {
    if (pickup > ret) {
      return { ok: false, error: 'La fecha de retiro debe ser anterior a la devolución.' };
    }
    return { ok: true, eventDate: null, pickupDate: pickup, returnDate: ret };
  }

  return { ok: false, error: 'Faltan fechas.' };
}

export function parseShowAllCatalog(searchParams: SearchParamsLike): boolean {
  const v = searchParams.showAll;
  if (typeof v === 'string') return v === '1' || v === 'true';
  return false;
}

/** Explorar catálogo sin fecha ni filtro de disponibilidad (`?showAll=1` sin fechas). */
export function isCatalogBrowseWithoutDates(searchParams: SearchParamsLike): boolean {
  return !hasCatalogEventContext(searchParams) && parseShowAllCatalog(searchParams);
}

/** Mostrar modal de fecha al entrar sin fechas y sin haber elegido "solo ver". */
export function shouldShowEventDateModal(searchParams: SearchParamsLike): boolean {
  return !hasCatalogEventContext(searchParams) && !parseShowAllCatalog(searchParams);
}

/** Query para enlaces en modo browse (detalle, similares). */
export function buildCatalogBrowseQuery(pickupLocationId?: string): string {
  const p = new URLSearchParams();
  p.set('showAll', '1');
  if (pickupLocationId) p.set('pickupLocationId', pickupLocationId);
  return p.toString();
}

export function buildCatalogDateQuery(params: {
  eventDate?: string | null;
  pickupDate: string;
  returnDate: string;
  pickupLocationId?: string;
  availableOnly?: boolean;
  showAll?: boolean;
}): string {
  const p = new URLSearchParams();
  if (params.eventDate) p.set('eventDate', params.eventDate);
  p.set('pickupDate', params.pickupDate);
  p.set('returnDate', params.returnDate);
  if (params.pickupLocationId) p.set('pickupLocationId', params.pickupLocationId);
  if (params.showAll) {
    p.set('showAll', '1');
  } else if (params.availableOnly !== false) {
    p.set('availableOnly', '1');
  }
  return p.toString();
}

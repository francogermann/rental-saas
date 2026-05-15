import { parse, startOfDay } from 'date-fns';

/**
 * Interpreta 'YYYY-MM-DD' como fecha de calendario en la zona local del navegador.
 * Evita el desfase de parseISO (medianoche UTC) frente a startOfDay(local) en el DayPicker.
 */
export function parseLocalYmd(dateString: string): Date {
  return startOfDay(parse(dateString, 'yyyy-MM-dd', new Date()));
}

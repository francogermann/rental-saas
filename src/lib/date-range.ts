/** Inclusive date strings `YYYY-MM-DD`: true si los rangos se solapan. */
export function dateRangesOverlap(
  aFrom: string,
  aTo: string,
  bFrom: string,
  bTo: string,
): boolean {
  return aFrom <= bTo && aTo >= bFrom;
}

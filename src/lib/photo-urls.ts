/**
 * Normaliza y deduplica URLs de galería (evita repetir la misma imagen en carruseles).
 * Orden original se respeta; comparación por string exacta tras trim.
 */
export function uniquePhotoUrls(urls: string[] | null | undefined): string[] {
  if (!urls?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const u = typeof raw === 'string' ? raw.trim() : '';
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

/** Primera foto única del vestido (detalle, similares, etc.). */
export function primaryPhotoUrl(urls: string[] | null | undefined): string | null {
  const u = uniquePhotoUrls(urls);
  return u[0] ?? null;
}

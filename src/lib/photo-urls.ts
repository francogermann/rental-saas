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

/**
 * Portada de grilla: prioriza una URL que aún no se usó como portada en la página,
 * para que dos vestidos no muestren el mismo thumb si hay fotos alternativas.
 */
export function pickCatalogCoverUrl(
  photos_urls: string[] | null | undefined,
  globallyUsed: Set<string>,
): string | null {
  const urls = uniquePhotoUrls(photos_urls);
  if (urls.length === 0) return null;
  for (const u of urls) {
    if (!globallyUsed.has(u)) {
      globallyUsed.add(u);
      return u;
    }
  }
  return urls[0];
}

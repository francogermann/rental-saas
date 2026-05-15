/**
 * Valores de categoría alineados con el admin (`NewGarmentForm`).
 * El filtro del catálogo usa estos mismos slugs en URL y en la RPC.
 */
export const CATALOG_CATEGORY_OPTIONS = [
  { value: 'vestido-largo', label: 'Vestido largo' },
  { value: 'vestido-corto', label: 'Vestido corto' },
  { value: 'gala', label: 'Gala' },
  { value: 'casamiento', label: 'Casamiento' },
  { value: 'cóctel', label: 'Cóctel' },
] as const;

export const CATALOG_CATEGORY_VALUES = CATALOG_CATEGORY_OPTIONS.map((o) => o.value);

export const CATALOG_CATEGORY_LABEL_BY_VALUE: Record<string, string> = Object.fromEntries(
  CATALOG_CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
);

/** Talles iguales al admin. */
export const CATALOG_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'Plus Size'] as const;

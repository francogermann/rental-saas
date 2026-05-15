/** Prendas por página en el catálogo público (SSR + "Cargar más"). */
export const CATALOG_PAGE_SIZE = 12;

/** Pedimos una fila extra para saber si hay página siguiente sin COUNT. */
export const CATALOG_FETCH_SIZE = CATALOG_PAGE_SIZE + 1;

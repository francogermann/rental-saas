/**
 * Catálogo curado de calzado (imágenes Unsplash). La selección visible depende del rango
 * de alquiler (pickup + return) vía `selectShoesForRentalWindow`.
 */
export type ShoeRecommendation = {
  id: string;
  name: string;
  imageUrl: string;
  href?: string;
};

const U = (path: string, w = 400) =>
  `https://images.unsplash.com/${path}?auto=format&fit=crop&w=${w}&q=80`;

export const SHOE_CATALOG: ShoeRecommendation[] = [
  { id: 's1', name: 'Tacón nude clásico', imageUrl: U('photo-1543163521-1bf539c55dd2') },
  { id: 's2', name: 'Sandalia de tiras', imageUrl: U('photo-1595950653106-6c9ebd614d95') },
  { id: 's3', name: 'Tacón negro liso', imageUrl: U('photo-1573100924588-4b48229116bf') },
  { id: 's4', name: 'Metálico plateado', imageUrl: U('photo-1535043934128-cf0b28d52f95') },
  { id: 's5', name: 'Bailarina elegante', imageUrl: U('photo-1582897085656-c636d006a246') },
  { id: 's6', name: 'Sandalia champagne', imageUrl: U('photo-1549298916-b41d501d3772') },
  { id: 's7', name: 'Stiletto rojo', imageUrl: U('photo-1515886657613-9f3515b0c78f') },
  { id: 's8', name: 'Mule dorado', imageUrl: U('photo-1496747611173-043a258b693f') },
  { id: 's9', name: 'Tacón bloque negro', imageUrl: U('photo-1509631179647-0177331693ae') },
  { id: 's10', name: 'Sandalia fucsia', imageUrl: U('photo-1529626455594-4ff0802cfb7e') },
  { id: 's11', name: 'Zapato esmeralda', imageUrl: U('photo-1562784439-4fbc317a0c42') },
  { id: 's12', name: 'Tacón navy', imageUrl: U('photo-1595777457583-95e059d581b8') },
  { id: 's13', name: 'Sandalia minimal nude', imageUrl: U('photo-1515372039744-b8f02a3ae446') },
  { id: 's14', name: 'Plataforma negra', imageUrl: U('photo-1539008835657-9e8e9680c956') },
  { id: 's15', name: 'Tacón borgoña', imageUrl: U('photo-1572804013309-59a88b7e92f1') },
  { id: 's16', name: 'Sandalia plateada', imageUrl: U('photo-1566174053879-31528523f8ae') },
  { id: 's17', name: 'Stiletto negro', imageUrl: U('photo-1618932260643-eee4a2f652a6') },
  { id: 's18', name: 'Zapato cóctel', imageUrl: U('photo-1550639525-c97d455acf70') },
  { id: 's19', name: 'Sandalia coral', imageUrl: U('photo-1594552072238-b8a33785b261') },
  { id: 's20', name: 'Tacón burdeos', imageUrl: U('photo-1568252542512-9fe8fe9c87bb') },
  { id: 's21', name: 'Mule blanco', imageUrl: U('photo-1583391733956-3750e0ff4e8b') },
  { id: 's22', name: 'Sandalia turquesa', imageUrl: U('photo-1623609163859-ca93c959b98a') },
  { id: 's23', name: 'Tacón animal print', imageUrl: U('photo-1612336307429-8a898d10e223') },
  { id: 's24', name: 'Zapato gala', imageUrl: U('photo-1460353581641-37badddb0afa') },
  { id: 's25', name: 'Sandalia asimétrica', imageUrl: U('photo-1543163521-1bf539c55dd2', 500) },
  { id: 's26', name: 'Tacón transparente', imageUrl: U('photo-1595950653106-6c9ebd614d95', 500) },
  { id: 's27', name: 'Sandalia joya', imageUrl: U('photo-1573100924588-4b48229116bf', 500) },
  { id: 's28', name: 'Zapato puntera', imageUrl: U('photo-1535043934128-cf0b28d52f95', 500) },
  { id: 's29', name: 'Tacón midi', imageUrl: U('photo-1582897085656-c636d006a246', 500) },
  { id: 's30', name: 'Sandalia cruzada', imageUrl: U('photo-1549298916-b41d501d3772', 500) },
  { id: 's31', name: 'Stiletto nude', imageUrl: U('photo-1515886657613-9f3515b0c78f', 500) },
  { id: 's32', name: 'Mule tacón medio', imageUrl: U('photo-1496747611173-043a258b693f', 500) },
  { id: 's33', name: 'Sandalia t-bar', imageUrl: U('photo-1509631179647-0177331693ae', 500) },
  { id: 's34', name: 'Zapato clásico', imageUrl: U('photo-1529626455594-4ff0802cfb7e', 500) },
  { id: 's35', name: 'Tacón slim', imageUrl: U('photo-1562784439-4fbc317a0c42', 500) },
  { id: 's36', name: 'Sandalia fiesta', imageUrl: U('photo-1595777457583-95e059d581b8', 500) },
  { id: 's37', name: 'Tacón ancho', imageUrl: U('photo-1515372039744-b8f02a3ae446', 500) },
  { id: 's38', name: 'Zapato satinado', imageUrl: U('photo-1539008835657-9e8e9680c956', 500) },
  { id: 's39', name: 'Sandalia minimal', imageUrl: U('photo-1572804013309-59a88b7e92f1', 500) },
  { id: 's40', name: 'Tacón alto', imageUrl: U('photo-1566174053879-31528523f8ae', 500) },
  { id: 's41', name: 'Sandalia encaje', imageUrl: U('photo-1618932260643-eee4a2f652a6', 500) },
  { id: 's42', name: 'Zapato noche', imageUrl: U('photo-1550639525-c97d455acf70', 500) },
  { id: 's43', name: 'Sandalia verano', imageUrl: U('photo-1594552072238-b8a33785b261', 500) },
  { id: 's44', name: 'Tacón fino', imageUrl: U('photo-1568252542512-9fe8fe9c87bb', 500) },
  { id: 's45', name: 'Sandalia sofisticada', imageUrl: U('photo-1583391733956-3750e0ff4e8b', 500) },
];

function hashSeed(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Elige un subconjunto estable según el rango de alquiler (cambia al cambiar fechas). */
export function selectShoesForRentalWindow(
  pickupDate: string,
  returnDate: string,
  count = 7,
): ShoeRecommendation[] {
  if (!pickupDate || !returnDate) return SHOE_CATALOG.slice(0, Math.min(count, SHOE_CATALOG.length));
  const seed = hashSeed(`${pickupDate}|${returnDate}`);
  const n = SHOE_CATALOG.length;
  const picked: ShoeRecommendation[] = [];
  const used = new Set<string>();
  for (let k = 0; k < n && picked.length < count; k++) {
    const idx = (seed + k * 17) % n;
    const item = SHOE_CATALOG[idx];
    if (!used.has(item.id)) {
      used.add(item.id);
      picked.push(item);
    }
  }
  return picked;
}

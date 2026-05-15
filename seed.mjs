// ============================================================================
// seed.mjs — Popula la base de datos con datos realistas de Carpe Diem
// Ejecutar: node seed.mjs
// ============================================================================

import { randomUUID } from 'node:crypto';

const SUPABASE_URL = 'https://fjozuxxqpgfamggomgcj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqb3p1eHhxcGdmYW1nZ29tZ2NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcwMjkwNywiZXhwIjoyMDk0Mjc4OTA3fQ.pFJ75d6eIHjN1NlDlm1N1cJe_U3acXQMdIvpTiEWvoI';

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Prefer': 'return=representation',
};

async function api(table, body, method = 'POST') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method,
    headers: { ...headers, ...(method === 'POST' ? { 'Prefer': 'return=representation' } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${table} ${method} failed: ${res.status} ${err}`);
  }
  return res.json();
}

async function main() {
  console.log('🌱 Seeding Carpe Diem demo data...\n');

  // 1. Fetch or create organization
  console.log('1. Fetching organization...');
  let orgRes = await fetch(`${SUPABASE_URL}/rest/v1/organizations?slug=eq.maison-demo&select=id`, {
    headers,
  });
  let orgs = await orgRes.json();
  let orgId;

  if (orgs.length > 0) {
    orgId = orgs[0].id;
    console.log(`   ✅ Existing org found: ${orgId}`);

    // Clean existing data
    console.log('   🧹 Cleaning old data...');
    await fetch(`${SUPABASE_URL}/rest/v1/garment_blocks?organization_id=eq.${orgId}`, { method: 'DELETE', headers });
    await fetch(`${SUPABASE_URL}/rest/v1/reservations?organization_id=eq.${orgId}`, { method: 'DELETE', headers });
    await fetch(`${SUPABASE_URL}/rest/v1/customers?organization_id=eq.${orgId}`, { method: 'DELETE', headers });
    await fetch(`${SUPABASE_URL}/rest/v1/garments?organization_id=eq.${orgId}`, { method: 'DELETE', headers });
    console.log('   ✅ Old data cleaned\n');
  } else {
    const [org] = await api('organizations', {
      name: 'Carpe Diem — Alquiler de Vestidos',
      slug: 'maison-demo',
      plan: 'pro',
      settings: {
        currency: 'UYU',
        timezone: 'America/Montevideo',
        brand: 'Carpe Diem',
        tagline: '#TuMejorVersion',
      },
    });
    orgId = org.id;
    console.log(`   ✅ Org created: ${orgId}\n`);
  }

  // 1b. Sedes (Montevideo / Colonia) — idempotente vía migración o inserción aquí
  console.log('1b. Locations...');
  let locRes = await fetch(
    `${SUPABASE_URL}/rest/v1/locations?organization_id=eq.${orgId}&select=id&order=sort_order.asc`,
    { headers },
  );
  let locRows = await locRes.json();
  if (!locRows.length) {
    await api('locations', [
      {
        organization_id: orgId,
        name: 'Montevideo — Micenas Mall',
        address_line: 'Av Brasil 3072, local 9',
        sort_order: 1,
      },
      {
        organization_id: orgId,
        name: 'Colonia',
        address_line: 'Av Artigas 316',
        sort_order: 2,
      },
    ]);
    locRes = await fetch(
      `${SUPABASE_URL}/rest/v1/locations?organization_id=eq.${orgId}&select=id&order=sort_order.asc`,
      { headers },
    );
    locRows = await locRes.json();
  }
  const locIds = locRows.map((r) => r.id);
  console.log(`   ✅ ${locIds.length} sedes listas\n`);

  // 2. Garments (variantes multi-talle en los 3 primeros estilos + resto en un talle)
  console.log('2. Inserting garments...');
  const depositFor = (rental) => Math.max(300, Math.round(rental / 3));

  const garmentDefs = [
    {
      sku: 'CD-001', name: 'Vestido Navy Halter con Cadena',
      description: 'Minivestido azul marino con escote halter profundo y cinturón de cadena dorada. Perfecto para fiestas y cócteles.',
      category: 'Fiesta', size_label: 'M', chest_cm: 88, waist_cm: 70, hip_cm: 94, length_cm: 80,
      rental_price: 1800,
      photos_urls: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80'],
      tags: ['halter', 'cadena', 'navy', 'cocktail'],
    },
    {
      sku: 'CD-002', name: 'Vestido Royal Blue Satinado',
      description: 'Vestido largo azul royal en satén con escote drapeado y cuello halter. Ideal para galas y eventos formales.',
      category: 'Gala', size_label: 'S', chest_cm: 84, waist_cm: 66, hip_cm: 90, length_cm: 140,
      rental_price: 3200,
      photos_urls: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80&fit=crop&crop=top'],
      tags: ['royal blue', 'satin', 'gala', 'formal'],
    },
    {
      sku: 'CD-003', name: 'Vestido Borgoña con Tajo',
      description: 'Vestido largo color borgoña con escote profundo, cinturón de monedas plateado y tajo lateral. Elegancia total.',
      category: 'Gala', size_label: 'M', chest_cm: 88, waist_cm: 70, hip_cm: 94, length_cm: 145,
      rental_price: 2900,
      photos_urls: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80'],
      tags: ['borgoña', 'tajo', 'gala', 'cinturon'],
    },
    {
      sku: 'CD-004', name: 'Vestido Ciruela con Encaje',
      description: 'Vestido largo color ciruela con panel de encaje en la cintura y tirantes finos. Romántico y sofisticado.',
      category: 'Graduación', size_label: 'S', chest_cm: 82, waist_cm: 64, hip_cm: 88, length_cm: 150,
      rental_price: 2100,
      photos_urls: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80'],
      tags: ['ciruela', 'encaje', 'graduación', 'largo'],
    },
    {
      sku: 'CD-005', name: 'Vestido Floral Rosa Tropical',
      description: 'Vestido largo con estampado floral en tonos rosa y rojo, tirantes finos y corte sirena. Perfecto para verano.',
      category: 'Fiesta', size_label: 'M', chest_cm: 86, waist_cm: 68, hip_cm: 92, length_cm: 145,
      rental_price: 1900,
      photos_urls: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80'],
      tags: ['floral', 'rosa', 'tropical', 'verano'],
    },
    {
      sku: 'CD-006', name: 'Vestido Esmeralda Strapless',
      description: 'Vestido largo verde esmeralda strapless con corte recto y abertura lateral. Clásico y elegante.',
      category: 'Gala', size_label: 'L', chest_cm: 92, waist_cm: 76, hip_cm: 100, length_cm: 148,
      rental_price: 3600,
      photos_urls: ['https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=600&q=80'],
      tags: ['esmeralda', 'strapless', 'verde', 'gala'],
    },
    {
      sku: 'CD-007', name: 'Vestido Negro Lentejuelas',
      description: 'Vestido corto negro completamente bordado en lentejuelas. Show-stopper para fiestas de noche.',
      category: 'Fiesta', size_label: 'S', chest_cm: 82, waist_cm: 64, hip_cm: 88, length_cm: 85,
      rental_price: 2200,
      photos_urls: ['https://images.unsplash.com/photo-1550639525-c97d455acf70?w=600&q=80'],
      tags: ['negro', 'lentejuelas', 'cocktail', 'noche'],
    },
    {
      sku: 'CD-008', name: 'Vestido Champagne Drapeado',
      description: 'Vestido largo champagne con drapeado asymétrico y un hombro. Perfecto para bodas civiles.',
      category: 'Casamiento', size_label: 'M', chest_cm: 86, waist_cm: 68, hip_cm: 92, length_cm: 150,
      rental_price: 3400,
      photos_urls: ['https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=600&q=80'],
      tags: ['champagne', 'drapeado', 'boda', 'un-hombro'],
    },
    {
      sku: 'CD-009', name: 'Vestido Rojo Pasión',
      description: 'Vestido largo rojo intenso con escote corazón y falda con movimiento. El vestido que todos miran.',
      category: 'Gala', size_label: 'M', chest_cm: 88, waist_cm: 70, hip_cm: 94, length_cm: 148,
      rental_price: 3000,
      photos_urls: ['https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=600&q=80'],
      tags: ['rojo', 'corazón', 'gala', 'llamativo'],
    },
    {
      sku: 'CD-010', name: 'Vestido Turquesa Plisado',
      description: 'Vestido midi turquesa con plisado completo y tirantes cruzados en la espalda. Fresco y juvenil.',
      category: 'Graduación', size_label: 'S', chest_cm: 82, waist_cm: 64, hip_cm: 88, length_cm: 110,
      rental_price: 1500,
      photos_urls: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80'],
      tags: ['turquesa', 'plisado', 'graduación', 'juvenil'],
    },
    {
      sku: 'CD-011', name: 'Vestido Nude con Pedrería',
      description: 'Vestido largo nude con aplicaciones de pedrería en el corpiño. Elegancia minimalista que brilla.',
      category: 'Casamiento', size_label: 'L', chest_cm: 92, waist_cm: 76, hip_cm: 100, length_cm: 150,
      rental_price: 3900,
      photos_urls: ['https://images.unsplash.com/photo-1623609163859-ca93c959b98a?w=600&q=80'],
      tags: ['nude', 'pedrería', 'casamiento', 'elegante'],
    },
    {
      sku: 'CD-012', name: 'Vestido Fucsia Mini Asimétrico',
      description: 'Minivestido fucsia con corte asimétrico y mangas abullonadas. Diversión y glamour en estado puro.',
      category: 'Fiesta', size_label: 'XS', chest_cm: 80, waist_cm: 62, hip_cm: 86, length_cm: 78,
      rental_price: 1400,
      photos_urls: ['https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600&q=80'],
      tags: ['fucsia', 'mini', 'asimétrico', 'fiesta'],
    },
  ];

  const garmentRows = [];
  garmentDefs.forEach((g, idx) => {
    const loc = locIds[idx % locIds.length];
    if (idx < 3) {
      const sg = randomUUID();
      const combos =
        idx === 0
          ? [
              { size: 'S', suf: 'S', d: -2 },
              { size: 'M', suf: 'M', d: 0 },
              { size: 'L', suf: 'L', d: 2 },
            ]
          : idx === 1
            ? [
                { size: 'XS', suf: 'XS', d: -2 },
                { size: 'S', suf: 'S', d: 0 },
                { size: 'M', suf: 'M', d: 2 },
              ]
            : [
                { size: 'M', suf: 'M', d: 0 },
                { size: 'L', suf: 'L', d: 2 },
                { size: 'XL', suf: 'XL', d: 4 },
              ];
      combos.forEach((c, si) => {
        garmentRows.push({
          ...g,
          sku: `${g.sku}-${c.suf}`,
          size_label: c.size,
          chest_cm: g.chest_cm + c.d,
          waist_cm: g.waist_cm + c.d,
          hip_cm: g.hip_cm + c.d,
          deposit_amount: depositFor(g.rental_price),
          organization_id: orgId,
          operative_status: 'available',
          location_id: locIds[(idx + si) % locIds.length],
          style_group_id: sg,
        });
      });
    } else {
      garmentRows.push({
        ...g,
        deposit_amount: depositFor(g.rental_price),
        organization_id: orgId,
        operative_status: 'available',
        location_id: loc,
        style_group_id: null,
      });
    }
  });

  const insertedGarments = await api('garments', garmentRows);
  console.log(`   ✅ ${insertedGarments.length} garments inserted\n`);

  // 3. Customers
  console.log('3. Creating sample customers...');
  const customers = [
    { first_name: 'Martina', last_name: 'Rodríguez', email: 'martina.r@demo.com', phone: '099111222' },
    { first_name: 'Lucía', last_name: 'González', email: 'lucia.g@demo.com', phone: '099333444' },
    { first_name: 'Valentina', last_name: 'Torres', email: 'valentina.t@demo.com', phone: '099555666' },
    { first_name: 'Sofía', last_name: 'Martínez', email: 'sofia.m@demo.com', phone: '099777888' },
    { first_name: 'Camila', last_name: 'Silva', email: 'camila.s@demo.com', phone: '099888999' },
    { first_name: 'Julieta', last_name: 'Pérez', email: 'julieta.p@demo.com', phone: '099222333' },
    { first_name: 'Agustina', last_name: 'López', email: 'agustina.l@demo.com', phone: '099444555' },
    { first_name: 'Micaela', last_name: 'Fernández', email: 'micaela.f@demo.com', phone: '099666777' },
  ].map(c => ({ ...c, organization_id: orgId }));

  const insertedCustomers = await api('customers', customers);
  console.log(`   ✅ ${insertedCustomers.length} customers inserted\n`);

  // 4. Reservations & Blocks (demo con fechas reales)
  console.log('4. Creating sample reservations and blocks...');
  const today = new Date();
  
  function dateStr(daysFromNow) {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  }

  const baseReservations = [
    {
      customer_id: insertedCustomers[0].id,
      garment_id: insertedGarments[0].id,
      pickup_date: dateStr(2),
      return_date: dateStr(5),
      event_date: dateStr(3),
      status: 'confirmed',
      rental_price: insertedGarments[0].rental_price,
      deposit_amount: insertedGarments[0].deposit_amount,
      total_amount: insertedGarments[0].rental_price + insertedGarments[0].deposit_amount,
    },
    {
      customer_id: insertedCustomers[1].id,
      garment_id: insertedGarments[6].id,
      pickup_date: dateStr(7),
      return_date: dateStr(10),
      event_date: dateStr(8),
      status: 'confirmed',
      rental_price: insertedGarments[6].rental_price,
      deposit_amount: insertedGarments[6].deposit_amount,
      total_amount: insertedGarments[6].rental_price + insertedGarments[6].deposit_amount,
    },
    {
      customer_id: insertedCustomers[2].id,
      garment_id: insertedGarments[10].id,
      pickup_date: dateStr(-1),
      return_date: dateStr(2),
      event_date: dateStr(0),
      status: 'delivered',
      rental_price: insertedGarments[10].rental_price,
      deposit_amount: insertedGarments[10].deposit_amount,
      total_amount: insertedGarments[10].rental_price + insertedGarments[10].deposit_amount,
    },
    {
      customer_id: insertedCustomers[0].id,
      garment_id: insertedGarments[13].id,
      pickup_date: dateStr(14),
      return_date: dateStr(17),
      event_date: dateStr(15),
      status: 'pending',
      rental_price: insertedGarments[13].rental_price,
      deposit_amount: insertedGarments[13].deposit_amount,
      total_amount: insertedGarments[13].rental_price + insertedGarments[13].deposit_amount,
    },
  ];

  const extraReservations = [];
  for (let i = 0; i < 14; i++) {
    const gidx = 9 + (i % 9);
    const cust = insertedCustomers[i % insertedCustomers.length];
    const g = insertedGarments[gidx];
    const pickup = dateStr(35 + i * 12);
    const ret = dateStr(38 + i * 12);
    extraReservations.push({
      customer_id: cust.id,
      garment_id: g.id,
      pickup_date: pickup,
      return_date: ret,
      event_date: dateStr(36 + i * 12),
      status: i % 4 === 0 ? 'pending' : 'confirmed',
      rental_price: g.rental_price,
      deposit_amount: g.deposit_amount,
      total_amount: g.rental_price + g.deposit_amount,
    });
  }

  const reservations = [...baseReservations, ...extraReservations].map((r) => ({
    ...r,
    organization_id: orgId,
  }));

  const insertedReservations = await api('reservations', reservations);
  console.log(`   ✅ ${insertedReservations.length} reservations inserted\n`);

  // 5. Garment Blocks (matching reservations + some extra blocks)
  console.log('5. Creating garment blocks...');
  const blocks = [
    // Blocks for confirmed/delivered reservations
    ...insertedReservations.map(r => ({
      organization_id: orgId,
      garment_id: r.garment_id,
      date_from: r.pickup_date,
      date_to: r.return_date,
      block_type: 'reservation',
      source_id: r.id,
      source_type: 'reservation',
      notes: null,
    })),
    // Extra blocks: cleaning
    {
      organization_id: orgId,
      garment_id: insertedGarments[12].id,
      date_from: dateStr(-2),
      date_to: dateStr(1),
      block_type: 'cleaning',
      source_id: null,
      source_type: 'cleaning',
      notes: 'Limpieza post-evento',
    },
    // Extra: manual hold
    {
      organization_id: orgId,
      garment_id: insertedGarments[14].id,
      date_from: dateStr(5),
      date_to: dateStr(9),
      block_type: 'hold',
      source_id: null,
      source_type: 'manual',
      notes: 'Reservado para clienta VIP — Sofía M.',
    },
  ];

  const insertedBlocks = await api('garment_blocks', blocks);
  console.log(`   ✅ ${insertedBlocks.length} blocks inserted\n`);

  console.log('═══════════════════════════════════════════════');
  console.log('🎉 Seed completo! Resumen:');
  console.log(`   • 1 organización (maison-demo)`);
  console.log(`   • ${insertedGarments.length} vestidos`);
  console.log(`   • ${insertedCustomers.length} clientas`);
  console.log(`   • ${insertedReservations.length} reservas`);
  console.log(`   • ${insertedBlocks.length} bloques de fechas`);
  console.log('═══════════════════════════════════════════════');
  console.log('\nAlgunas prendas con fechas bloqueadas (ejemplos):');
  console.log(`   • CD-001-* (Navy):         ${dateStr(2)} → ${dateStr(5)} [confirmed]`);
  console.log(`   • CD-003-* (Borgoña):      ${dateStr(7)} → ${dateStr(10)} [confirmed]`);
  console.log(`   • CD-005 (Floral Rosa):    ${dateStr(-1)} → ${dateStr(2)} [delivered]`);
  console.log(`   • CD-007 (Negro Lenteju.): ${dateStr(-2)} → ${dateStr(1)} [cleaning]`);
  console.log(`   • CD-008 (Champagne):      ${dateStr(14)} → ${dateStr(17)} [pending]`);
  console.log(`   • CD-009 (Rojo Pasión):    ${dateStr(5)} → ${dateStr(9)} [hold VIP]`);
}

main().catch(console.error);

-- =============================================================================
-- Seed demo maison-demo: catálogo legible para pruebas locales.
-- - 1 foto única por prenda (sin repetir URLs entre vestidos).
-- - ~35 clientas con nombres/emails variados.
-- - Agenda del día + volumen histórico moderado.
--
-- Aplicar: supabase db reset   (o pegar este archivo en SQL Editor tras migraciones)
-- =============================================================================

DO $$
DECLARE
  v_org      uuid;
  v_loc_mvd  uuid;
  v_loc_col  uuid;
  v_rid      uuid;
  v_gid      uuid;
  v_cid      uuid;
  t_urls     text[];
  cats       text[];
  sizes      text[];
  i          int;
  gs         int;
  loc_id     uuid;
  photo_idx  int;
  tag1       text;
  tag2       text;
  cat_ids    uuid[];
  n_cat      int;
  v_pick_d   date;
  v_ret_d    date;
  v_rp       numeric;
  v_dep_amt  numeric;
  -- Clientas (35 filas, emails fijos para referencias en reservas)
  c_first    text[] := ARRAY[
    'María', 'Lucía', 'Valentina', 'Sofía', 'Camila', 'Julieta', 'Agustina', 'Martina',
    'Florencia', 'Catalina', 'Paula', 'Daniela', 'Carolina', 'Andrea', 'Gabriela', 'Natalia',
    'Victoria', 'Romina', 'Belén', 'Micaela', 'Josefina', 'Antonella', 'Renata', 'Bianca',
    'Clara', 'Elena', 'Isabel', 'Teresa', 'Adriana', 'Patricia', 'Silvia', 'Roxana',
    'Verónica', 'Mariana', 'Fernanda'
  ];
  c_last     text[] := ARRAY[
    'González', 'Fernández', 'Rodríguez', 'Silva', 'Martínez', 'López', 'Pérez', 'García',
    'Suárez', 'Acosta', 'Romero', 'Castro', 'Benítez', 'Herrera', 'Méndez', 'Viera',
    'Correa', 'Domínguez', 'Ramos', 'Núñez', 'Costa', 'Molina', 'Pintos', 'Carbajal',
    'Bentancur', 'Cabrera', 'Fagúndez', 'Lorenzo', 'Alonso', 'Bianchi', 'Morales', 'Reyes',
    'Santín', 'Iglesias', 'Barreiro'
  ];
  c_email    text[] := ARRAY[
    'maria.gonzalez@ejemplo.uy', 'lucia.fernandez@ejemplo.uy', 'valentina.rodriguez@mail.demo',
    'sofia.silva@ejemplo.uy', 'camila.martinez@mail.demo', 'julieta.lopez@ejemplo.uy',
    'agustina.perez@mail.demo', 'martina.garcia@ejemplo.uy', 'florencia.suarez@mail.demo',
    'catalina.acosta@ejemplo.uy', 'paula.romero@mail.demo', 'daniela.castro@ejemplo.uy',
    'carolina.benitez@mail.demo', 'andrea.herrera@ejemplo.uy', 'gabriela.mendez@mail.demo',
    'natalia.viera@ejemplo.uy', 'victoria.correa@mail.demo', 'romina.dominguez@ejemplo.uy',
    'belen.ramos@mail.demo', 'micaela.nunez@ejemplo.uy', 'josefina.costa@mail.demo',
    'antonella.molina@ejemplo.uy', 'renata.pintos@mail.demo', 'bianca.carbajal@ejemplo.uy',
    'clara.bentancur@mail.demo', 'elena.cabrera@ejemplo.uy', 'isabel.fagundez@mail.demo',
    'teresa.lorenzo@ejemplo.uy', 'adriana.alonso@mail.demo', 'patricia.bianchi@ejemplo.uy',
    'silvia.morales@mail.demo', 'roxana.reyes@ejemplo.uy', 'veronica.santin@mail.demo',
    'mariana.iglesias@ejemplo.uy', 'fernanda.barreiro@mail.demo'
  ];
  c_phone    text[] := ARRAY[
    '099412345', '098234567', '097356789', '096478901', '095589012', '094690123',
    '093701234', '092812345', '091923456', '090134567', '099245678', '098356789',
    '097467890', '096578901', '095689012', '094790123', '093801234', '092912345',
    '091023456', '090134567', '099256789', '098367890', '097478901', '096589012',
    '095690123', '094701234', '093812345', '092923456', '091034567', '090145678',
    '099267890', '098378901', '097489012', '096590123', '095601234'
  ];
  g_names    text[] := ARRAY[
    'Vestido largo sirena negro', 'Cóctel rojo palabra de honor', 'Gala champagne con broche',
    'Vestido corto satén verde', 'Novia encaje marfil', 'Vestido largo azul petróleo',
    'Cóctel dorado lentejuelas', 'Vestido borgoña terciopelo', 'Largo nude escote en V',
    'Corto blanco civil', 'Gala negro con abertura', 'Vestido coral verano',
    'Largo espalda descubierta', 'Cóctel negro minimal', 'Vestido lavanda midi',
    'Gala plateado hombro descubierto', 'Largo rosa palo', 'Cóctel turquesa plisado'
  ];
  g_desc     text[] := ARRAY[
    'Ideal para gala o fiesta formal. Calce marcado en cadera.',
    'Línea A con falda fluida. Muy favorecedor para eventos de noche.',
    'Tejido con brillo suave y caída elegante.',
    'Tono intenso para cocktail y recepciones.',
    'Clásico de ceremonia, manga larga de encaje.',
    'Azul profundo, silueta limpia y contemporánea.',
    'Brillo discreto en hombros y cintura.',
    'Textura rica, perfecto para invierno.',
    'Nude universal, largo hasta el piso.',
    'Corte recto para civil o after party.',
    'Impacto visual con abertura lateral moderada.',
    'Color vivo para eventos de día o exterior.',
    'Espalda diseño, ideal para fotos.',
    'Silueta sobria y atemporal.',
    'Largo midi, tono pastel de tendencia.',
    'Hombros al descubierto con drapeado.',
    'Rosa suave, falda amplia.',
    'Plisado ligero, movimiento al caminar.'
  ];
BEGIN
  SELECT id INTO v_org FROM public.organizations WHERE slug = 'maison-demo' LIMIT 1;
  IF v_org IS NULL THEN
    INSERT INTO public.organizations (name, slug, plan, settings)
    VALUES ('Maison Demo', 'maison-demo', 'starter', '{"currency":"UYU","timezone":"America/Montevideo"}'::jsonb)
    RETURNING id INTO v_org;
  END IF;

  SELECT l.id INTO v_loc_mvd
  FROM public.locations l
  WHERE l.organization_id = v_org
  ORDER BY l.sort_order ASC NULLS LAST, l.name ASC
  LIMIT 1;

  SELECT l.id INTO v_loc_col
  FROM public.locations l
  WHERE l.organization_id = v_org
    AND l.id IS DISTINCT FROM v_loc_mvd
  ORDER BY l.sort_order DESC NULLS LAST, l.name DESC
  LIMIT 1;

  IF v_loc_mvd IS NULL THEN
    INSERT INTO public.locations (organization_id, name, address_line, sort_order)
    VALUES (v_org, 'Montevideo — Micenas Mall', 'Av Brasil 3072, local 9', 1)
    RETURNING id INTO v_loc_mvd;
  END IF;

  IF v_loc_col IS NULL THEN
    INSERT INTO public.locations (organization_id, name, address_line, sort_order)
    VALUES (v_org, 'Colonia', 'Av Artigas 316', 2)
    RETURNING id INTO v_loc_col;
  END IF;

  DELETE FROM public.favorite_garments fg
  USING public.garments g
  WHERE fg.garment_id = g.id AND g.organization_id = v_org;

  DELETE FROM public.garment_waitlist WHERE organization_id = v_org;
  DELETE FROM public.garment_blocks WHERE organization_id = v_org;
  DELETE FROM public.reservations WHERE organization_id = v_org;
  DELETE FROM public.garments WHERE organization_id = v_org;
  DELETE FROM public.customers WHERE organization_id = v_org;

  -- 35 clientas
  FOR i IN 1..array_length(c_first, 1) LOOP
    INSERT INTO public.customers (organization_id, first_name, last_name, email, phone)
    VALUES (v_org, c_first[i], c_last[i], c_email[i], c_phone[i]);
  END LOOP;

  -- 29 URLs distintas (1 por prenda)
  t_urls := ARRAY[
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
    'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80',
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
    'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80',
    'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800&q=80',
    'https://images.unsplash.com/photo-1550639525-c97d455acf70?w=800&q=80',
    'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=800&q=80',
    'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=800&q=80',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
    'https://images.unsplash.com/photo-1623609163859-ca93c959b98a?w=800&q=80',
    'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&q=80',
    'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=800&q=80',
    'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=800&q=80',
    'https://images.unsplash.com/photo-1573100924588-4b48229116bf?w=800&q=80',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d95?w=800&q=80',
    'https://images.unsplash.com/photo-1460353581641-37badddb0afa?w=800&q=80',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    'https://images.unsplash.com/photo-1496747611173-043a258b693f?w=800&q=80',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
    'https://images.unsplash.com/photo-1562784439-4fbc317a0c42?w=800&q=80',
    'https://images.unsplash.com/photo-1485230893291-40f5b48584e2?w=800&q=80',
    'https://images.unsplash.com/photo-1502716110388-9d51ddfee1e6?w=800&q=80',
    'https://images.unsplash.com/photo-1519657334134-44a8e809d1b4?w=800&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    'https://images.unsplash.com/photo-1515377905703-c4788e51b152?w=800&q=80'
  ];

  cats := ARRAY['vestido-largo', 'vestido-corto', 'gala', 'casamiento', 'cóctel'];
  sizes := ARRAY['XS', 'S', 'M', 'L', 'XL', 'Plus Size'];

  photo_idx := 0;

  -- Catálogo: 18 prendas disponibles
  FOR gs IN 1..18 LOOP
    photo_idx := photo_idx + 1;
    loc_id := CASE WHEN gs % 2 = 1 THEN v_loc_mvd ELSE v_loc_col END;
    tag1 := (ARRAY['gala', 'boda', 'casamiento', 'cocktail', 'fiesta', 'civil'])[1 + ((gs - 1) % 6)];
    tag2 := (ARRAY['negro', 'rojo', 'nude', 'rosa', 'azul', 'verde', 'dorado', 'borgoña'])[1 + ((gs - 1) % 8)];

    INSERT INTO public.garments (
      organization_id, sku, name, description, category, size_label,
      chest_cm, waist_cm, hip_cm, length_cm,
      rental_price, deposit_amount, operative_status, photos_urls, tags,
      location_id, notes
    ) VALUES (
      v_org,
      'CAT-' || lpad(gs::text, 3, '0'),
      g_names[gs],
      g_desc[gs],
      cats[1 + ((gs - 1) % array_length(cats, 1))],
      sizes[1 + ((gs - 1) % array_length(sizes, 1))],
      78 + (gs * 2),
      60 + gs,
      86 + gs,
      85 + ((gs * 11) % 75),
      (1250 + gs * 180)::numeric,
      greatest(350::numeric, round((1250 + gs * 180) / 3.0)::numeric),
      'available',
      ARRAY[t_urls[photo_idx]],
      ARRAY[tag1, tag2, 'demo']::text[],
      loc_id,
      NULL
    );
  END LOOP;

  -- Agenda hoy (5 prendas, fotos 19–23)
  photo_idx := 18;
  INSERT INTO public.garments (organization_id, sku, name, description, category, size_label, chest_cm, waist_cm, hip_cm, length_cm, rental_price, deposit_amount, operative_status, photos_urls, tags, location_id)
  VALUES
    (v_org, 'AGD-PICK-1', 'Retiro hoy — Gala esmeralda', 'Reserva con retiro en el día.', 'gala', 'M', 88, 70, 94, 140, 2800, 900, 'available', ARRAY[t_urls[19]], ARRAY['gala', 'verde', 'demo']::text[], v_loc_mvd),
    (v_org, 'AGD-PICK-2', 'Retiro hoy — Cóctel burdeos', 'Cliente retira hoy en Colonia.', 'cóctel', 'S', 84, 66, 90, 95, 1900, 650, 'available', ARRAY[t_urls[20]], ARRAY['cocktail', 'borgoña', 'demo']::text[], v_loc_col),
    (v_org, 'AGD-RET-1', 'Devolución hoy — Largo marfil', 'Entregado; vuelve hoy.', 'vestido-largo', 'L', 92, 74, 100, 150, 3200, 1100, 'available', ARRAY[t_urls[21]], ARRAY['boda', 'marfil', 'demo']::text[], v_loc_mvd),
    (v_org, 'AGD-EVT-1', 'Evento hoy — Gala plata', 'Fiesta esta noche.', 'gala', 'S', 82, 64, 88, 138, 4100, 1400, 'available', ARRAY[t_urls[22]], ARRAY['gala', 'plateado', 'demo']::text[], v_loc_mvd),
    (v_org, 'AGD-EVT-2', 'Evento hoy — Corto fucsia', 'Cumpleaños / after.', 'vestido-corto', 'XS', 80, 62, 86, 88, 1600, 550, 'available', ARRAY[t_urls[23]], ARRAY['fiesta', 'fucsia', 'demo']::text[], v_loc_col);

  -- Histórico (2 prendas, fotos 24–25)
  FOR gs IN 1..2 LOOP
    photo_idx := 23 + gs;
    INSERT INTO public.garments (
      organization_id, sku, name, description, category, size_label,
      chest_cm, waist_cm, hip_cm, length_cm, rental_price, deposit_amount,
      operative_status, photos_urls, tags, location_id
    ) VALUES (
      v_org,
      'HIST-' || lpad(gs::text, 2, '0'),
      'Archivo — Largo clásico ' || gs::text,
      'Con alquileres pasados ya devueltos.',
      cats[1 + ((gs - 1) % array_length(cats, 1))],
      sizes[gs + 2],
      84 + gs, 66 + gs, 90 + gs, 120 + gs * 8,
      (1500 + gs * 150)::numeric,
      500::numeric,
      'available',
      ARRAY[t_urls[photo_idx]],
      ARRAY['archivo', 'demo']::text[],
      CASE WHEN gs % 2 = 1 THEN v_loc_mvd ELSE v_loc_col END
    );
  END LOOP;

  -- Estados operativos (3) + papelera (1), fotos 26–29
  INSERT INTO public.garments (organization_id, sku, name, description, category, size_label, chest_cm, waist_cm, hip_cm, length_cm, rental_price, deposit_amount, operative_status, photos_urls, tags, location_id)
  VALUES
    (v_org, 'OPS-CLEAN', 'En limpieza — Cóctel crema', 'Tintorería en curso.', 'cóctel', 'M', 88, 70, 94, 100, 2000, 700, 'in_cleaning', ARRAY[t_urls[26]], ARRAY['limpieza', 'demo']::text[], v_loc_mvd),
    (v_org, 'OPS-PROC', 'Procesamiento — Gala azul', 'Post-devolución.', 'gala', 'L', 92, 74, 100, 142, 3000, 1000, 'processing', ARRAY[t_urls[27]], ARRAY['procesamiento', 'demo']::text[], v_loc_mvd),
    (v_org, 'OPS-RET', 'Baja — Largo vintage', 'Fuera de catálogo público.', 'vestido-largo', 'S', 84, 66, 90, 140, 2500, 850, 'retired', ARRAY[t_urls[28]], ARRAY['baja', 'demo']::text[], v_loc_col);

  INSERT INTO public.garments (organization_id, sku, name, description, category, size_label, chest_cm, waist_cm, hip_cm, length_cm, rental_price, deposit_amount, operative_status, photos_urls, tags, location_id, deleted_at)
  VALUES
    (v_org, 'TRASH-01', 'Papelera — Corto descartado', 'Eliminado del catálogo.', 'cóctel', 'M', 88, 70, 94, 98, 1800, 600, 'available', ARRAY[t_urls[29]], ARRAY['papelera', 'demo']::text[], v_loc_mvd, now());

  -- --- Reservas agenda (hoy) ---
  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = c_email[1];
  SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'AGD-PICK-1';
  INSERT INTO public.reservations (
    organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
    rental_price, deposit_amount, discount_amount, total_amount,
    pickup_location_id, mp_preference_id, mp_payment_status
  ) VALUES (
    v_org, v_cid, v_gid, CURRENT_DATE + 2, CURRENT_DATE, CURRENT_DATE + 5, 'pending',
    2800, 900, 0, 3700, v_loc_mvd, 'seed-' || gen_random_uuid()::text, NULL
  ) RETURNING id INTO v_rid;
  -- pending web: sin bloqueo hasta confirmar pago (ver confirm_reservation_payment)

  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = c_email[2];
  SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'AGD-PICK-2';
  INSERT INTO public.reservations (
    organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
    rental_price, deposit_amount, discount_amount, total_amount,
    pickup_location_id, mp_preference_id, mp_payment_status
  ) VALUES (
    v_org, v_cid, v_gid, CURRENT_DATE + 1, CURRENT_DATE, CURRENT_DATE + 4, 'confirmed',
    1900, 650, 0, 2550, v_loc_col, 'seed-' || gen_random_uuid()::text, 'approved'
  ) RETURNING id INTO v_rid;
  INSERT INTO public.garment_blocks (organization_id, garment_id, date_from, date_to, block_type, source_id, source_type)
  VALUES (v_org, v_gid, CURRENT_DATE, CURRENT_DATE + 4, 'reservation', v_rid, 'reservation');

  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = c_email[4];
  SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'AGD-RET-1';
  INSERT INTO public.reservations (
    organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
    rental_price, deposit_amount, discount_amount, total_amount,
    pickup_location_id, mp_preference_id, mp_payment_status, actual_return_date
  ) VALUES (
    v_org, v_cid, v_gid, CURRENT_DATE - 3, CURRENT_DATE - 7, CURRENT_DATE, 'delivered',
    3200, 1100, 0, 4300, v_loc_mvd, 'seed-' || gen_random_uuid()::text, 'approved', NULL
  ) RETURNING id INTO v_rid;
  INSERT INTO public.garment_blocks (organization_id, garment_id, date_from, date_to, block_type, source_id, source_type)
  VALUES (v_org, v_gid, CURRENT_DATE - 7, CURRENT_DATE, 'reservation', v_rid, 'reservation');

  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = c_email[6];
  SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'AGD-EVT-1';
  INSERT INTO public.reservations (
    organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
    rental_price, deposit_amount, discount_amount, total_amount,
    pickup_location_id, mp_preference_id, mp_payment_status
  ) VALUES (
    v_org, v_cid, v_gid, CURRENT_DATE, CURRENT_DATE + 1, CURRENT_DATE + 5, 'confirmed',
    4100, 1400, 0, 5500, v_loc_mvd, 'seed-' || gen_random_uuid()::text, 'approved'
  ) RETURNING id INTO v_rid;
  INSERT INTO public.garment_blocks (organization_id, garment_id, date_from, date_to, block_type, source_id, source_type)
  VALUES (v_org, v_gid, CURRENT_DATE + 1, CURRENT_DATE + 5, 'reservation', v_rid, 'reservation');

  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = c_email[8];
  SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'AGD-EVT-2';
  INSERT INTO public.reservations (
    organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
    rental_price, deposit_amount, discount_amount, total_amount,
    pickup_location_id, mp_preference_id, mp_payment_status
  ) VALUES (
    v_org, v_cid, v_gid, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE + 3, 'paid',
    1600, 550, 0, 2150, v_loc_col, 'seed-' || gen_random_uuid()::text, 'approved'
  ) RETURNING id INTO v_rid;
  INSERT INTO public.garment_blocks (organization_id, garment_id, date_from, date_to, block_type, source_id, source_type)
  VALUES (v_org, v_gid, CURRENT_DATE, CURRENT_DATE + 3, 'reservation', v_rid, 'reservation');

  -- Histórico devuelto (HIST-*)
  FOR gs IN 1..2 LOOP
    SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'HIST-' || lpad(gs::text, 2, '0');
    SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = c_email[10 + gs];
    INSERT INTO public.reservations (
      organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
      rental_price, deposit_amount, discount_amount, total_amount,
      pickup_location_id, mp_preference_id, mp_payment_status, actual_return_date
    ) VALUES (
      v_org, v_cid, v_gid,
      (CURRENT_DATE - 90 - gs * 10)::date,
      (CURRENT_DATE - 92 - gs * 10)::date,
      (CURRENT_DATE - 88 - gs * 10)::date,
      'returned',
      (1500 + gs * 150)::numeric,
      500::numeric,
      0,
      (2000 + gs * 150)::numeric,
      (SELECT location_id FROM public.garments WHERE id = v_gid),
      'seed-hist-' || gs::text,
      'approved',
      (CURRENT_DATE - 87 - gs * 10)::date
    ) RETURNING id INTO v_rid;

    INSERT INTO public.garment_blocks (
      organization_id, garment_id, date_from, date_to,
      block_type, source_id, source_type, released_at, release_reason
    ) VALUES (
      v_org, v_gid,
      (CURRENT_DATE - 92 - gs * 10)::date,
      (CURRENT_DATE - 88 - gs * 10)::date,
      'reservation', v_rid, 'reservation',
      (CURRENT_DATE - 87 - gs * 10)::date + interval '1 day',
      'returned'
    );
  END LOOP;

  -- Bulk histórico sobre catálogo CAT-* (~80 devueltas)
  SELECT coalesce(array_agg(id ORDER BY sku), ARRAY[]::uuid[]) INTO cat_ids
  FROM public.garments
  WHERE organization_id = v_org AND sku LIKE 'CAT-%';

  n_cat := coalesce(array_length(cat_ids, 1), 0);

  IF n_cat > 0 THEN
    FOR gs IN 1..80 LOOP
      v_gid := cat_ids[1 + ((gs - 1) % n_cat)];

      SELECT rental_price, deposit_amount, coalesce(location_id, v_loc_mvd)
      INTO v_rp, v_dep_amt, loc_id
      FROM public.garments
      WHERE id = v_gid;

      SELECT id INTO v_cid FROM public.customers
      WHERE organization_id = v_org
        AND email = c_email[1 + ((gs * 7) % array_length(c_email, 1))];

      v_pick_d := (CURRENT_DATE - (20 + ((gs * 17) % 300)))::date;
      v_ret_d := (v_pick_d + (2 + (gs % 5)))::date;

      INSERT INTO public.reservations (
        organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
        rental_price, deposit_amount, discount_amount, total_amount,
        pickup_location_id, mp_preference_id, mp_payment_status, actual_return_date
      ) VALUES (
        v_org, v_cid, v_gid,
        v_pick_d + 1,
        v_pick_d,
        v_ret_d,
        'returned',
        v_rp, v_dep_amt, 0,
        (v_rp + v_dep_amt)::numeric(10, 2),
        loc_id,
        'seed-bulk-' || gs::text,
        'approved',
        v_ret_d
      ) RETURNING id INTO v_rid;

      INSERT INTO public.garment_blocks (
        organization_id, garment_id, date_from, date_to,
        block_type, source_id, source_type, released_at, release_reason
      ) VALUES (
        v_org, v_gid, v_pick_d, v_ret_d,
        'reservation', v_rid, 'reservation',
        (v_ret_d + interval '1 day')::timestamptz,
        'returned'
      );
    END LOOP;

    -- Futuras canceladas (8)
    FOR gs IN 1..8 LOOP
      v_gid := cat_ids[1 + ((gs * 3) % n_cat)];

      SELECT rental_price, deposit_amount, coalesce(location_id, v_loc_mvd)
      INTO v_rp, v_dep_amt, loc_id
      FROM public.garments
      WHERE id = v_gid;

      SELECT id INTO v_cid FROM public.customers
      WHERE organization_id = v_org
        AND email = c_email[1 + ((gs * 5) % array_length(c_email, 1))];

      v_pick_d := (CURRENT_DATE + 30 + (gs * 12))::date;
      v_ret_d := (v_pick_d + 4)::date;

      INSERT INTO public.reservations (
        organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
        rental_price, deposit_amount, discount_amount, total_amount,
        pickup_location_id, mp_preference_id, mp_payment_status
      ) VALUES (
        v_org, v_cid, v_gid,
        v_pick_d + 1,
        v_pick_d,
        v_ret_d,
        'cancelled',
        v_rp, v_dep_amt, 0,
        (v_rp + v_dep_amt)::numeric(10, 2),
        loc_id,
        'seed-cancel-' || gs::text,
        NULL
      ) RETURNING id INTO v_rid;

      INSERT INTO public.garment_blocks (
        organization_id, garment_id, date_from, date_to,
        block_type, source_id, source_type, released_at, release_reason
      ) VALUES (
        v_org, v_gid, v_pick_d, v_ret_d,
        'reservation', v_rid, 'reservation',
        now(),
        'cancelled'
      );
    END LOOP;

    -- Una cancelada puntual en CAT-005
    SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'CAT-005';
    SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = c_email[15];
    INSERT INTO public.reservations (
      organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
      rental_price, deposit_amount, discount_amount, total_amount,
      pickup_location_id, mp_preference_id, mp_payment_status
    ) VALUES (
      v_org, v_cid, v_gid, CURRENT_DATE + 25, CURRENT_DATE + 23, CURRENT_DATE + 27, 'cancelled',
      2000, 700, 0, 2700, v_loc_mvd, 'seed-cancel-cat005', NULL
    ) RETURNING id INTO v_rid;
    INSERT INTO public.garment_blocks (
      organization_id, garment_id, date_from, date_to,
      block_type, source_id, source_type, released_at, release_reason
    ) VALUES (
      v_org, v_gid, CURRENT_DATE + 23, CURRENT_DATE + 27,
      'reservation', v_rid, 'reservation', now(), 'cancelled'
    );
  END IF;

END $$;

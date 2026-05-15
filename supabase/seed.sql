-- =============================================================================
-- Seed QA coherente para org maison-demo (tras migraciones, p. ej. db reset).
-- - Limpia reservas/bloqueos/prendas/clientas de esa org (no borra org ni sedes).
-- - Prendas variadas (categorías storefront, talles, tags, precios, fotos distintas).
-- - Reservas + garment_blocks alineados; agenda del día = CURRENT_DATE.
-- - Favoritos / waitlist no se insertan (requieren auth.users reales).
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
  p1         int;
  p2         int;
  p3         int;
  tag1       text;
  tag2       text;
  tag3       text;
  cat_ids    uuid[];
  n_cat      int;
  v_pick_d   date;
  v_ret_d    date;
  v_rp       numeric;
  v_dep_amt  numeric;
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

  -- Limpieza FK-safe
  DELETE FROM public.favorite_garments fg
  USING public.garments g
  WHERE fg.garment_id = g.id AND g.organization_id = v_org;

  DELETE FROM public.garment_waitlist WHERE organization_id = v_org;
  DELETE FROM public.garment_blocks WHERE organization_id = v_org;
  DELETE FROM public.reservations WHERE organization_id = v_org;
  DELETE FROM public.garments WHERE organization_id = v_org;
  DELETE FROM public.customers WHERE organization_id = v_org;

  -- Clientas QA (emails determinísticos)
  FOR i IN 1..180 LOOP
    INSERT INTO public.customers (organization_id, first_name, last_name, email, phone)
    VALUES (
      v_org,
      (ARRAY['María','Lucía','Valentina','Sofía','Camila','Julieta'])[1 + ((i - 1) % 6)],
      'QA ' || lpad(i::text, 3, '0'),
      'qa-' || lpad(i::text, 3, '0') || '@maison-demo.invalid',
      '09' || lpad((8800000 + i)::text, 8, '0')
    );
  END LOOP;

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
    'https://images.unsplash.com/photo-1562784439-4fbc317a0c42?w=800&q=80'
  ];

  cats := ARRAY['vestido-largo','vestido-corto','gala','casamiento','cóctel'];
  sizes := ARRAY['XS','S','M','L','XL','Plus Size','XXL'];

  -- Catálogo: 28 prendas disponibles, sin reservas (sin bloqueos activos)
  FOR gs IN 1..28 LOOP
    loc_id := CASE WHEN gs % 2 = 1 THEN v_loc_mvd ELSE v_loc_col END;
    p1 := 1 + ((gs - 1) % array_length(t_urls, 1));
    p2 := 1 + (gs % array_length(t_urls, 1));
    p3 := 1 + ((gs + 3) % array_length(t_urls, 1));

    tag1 := (ARRAY['gala','boda','casamiento','cocktail','fiesta','xv','verano','floral','novia','graduación'])[1 + ((gs - 1) % 10)];
    tag2 := (ARRAY['negro','rojo','nude','rosa','azul','verde','dorado','borgoña','turquesa','champagne'])[1 + ((gs + 2) % 10)];
    tag3 := (ARRAY['largo','corto','sirena','minimal','encaje','lentejuelas'])[1 + ((gs + 4) % 6)];

    INSERT INTO public.garments (
      organization_id, sku, name, description, category, size_label,
      chest_cm, waist_cm, hip_cm, length_cm,
      rental_price, deposit_amount, operative_status, photos_urls, tags,
      location_id, notes
    ) VALUES (
      v_org,
      'QA-CAT-' || lpad(gs::text, 3, '0'),
      'Vestido QA colección ' || gs::text,
      'Prenda de prueba coherente con el catálogo público.',
      cats[1 + ((gs - 1) % array_length(cats, 1))],
      sizes[1 + ((gs - 1) % array_length(sizes, 1))],
      78 + (gs * 2),
      60 + gs,
      86 + gs,
      85 + ((gs * 11) % 75),
      (1150 + gs * 220)::numeric,
      greatest(350::numeric, round((1150 + gs * 220) / 3.0)::numeric),
      'available',
      ARRAY[t_urls[p1], t_urls[p2], t_urls[p3]],
      ARRAY[tag1, tag2, tag3, 'qa-seed']::text[],
      loc_id,
      'QA seed catálogo'
    );
  END LOOP;

  -- Prendas dedicadas agenda (hoy)
  INSERT INTO public.garments (organization_id, sku, name, description, category, size_label, chest_cm, waist_cm, hip_cm, length_cm, rental_price, deposit_amount, operative_status, photos_urls, tags, location_id)
  VALUES
    (v_org, 'AGD-PICK-1', 'Agenda — retiro hoy A', 'Reserva pickup hoy.', 'gala', 'M', 88, 70, 94, 140, 2800, 900, 'available', ARRAY[t_urls[1], t_urls[2]], ARRAY['gala','qa-agenda']::text[], v_loc_mvd),
    (v_org, 'AGD-PICK-2', 'Agenda — retiro hoy B', 'Reserva pickup hoy.', 'cóctel', 'S', 84, 66, 90, 95, 1900, 650, 'available', ARRAY[t_urls[3], t_urls[4]], ARRAY['cocktail','qa-agenda']::text[], v_loc_col),
    (v_org, 'AGD-PICK-3', 'Agenda — retiro hoy C', 'Reserva pickup hoy.', 'vestido-largo', 'M', 88, 70, 94, 148, 2400, 800, 'available', ARRAY[t_urls[2], t_urls[5]], ARRAY['boda','qa-agenda']::text[], v_loc_mvd),
    (v_org, 'AGD-RET-1', 'Agenda — devolución hoy A', 'Entregada; devuelve hoy.', 'vestido-largo', 'L', 92, 74, 100, 150, 3200, 1100, 'available', ARRAY[t_urls[5], t_urls[6]], ARRAY['boda','qa-agenda']::text[], v_loc_mvd),
    (v_org, 'AGD-RET-2', 'Agenda — devolución hoy B', 'Entregada; devuelve hoy.', 'casamiento', 'M', 88, 70, 94, 145, 3500, 1200, 'available', ARRAY[t_urls[7], t_urls[8]], ARRAY['casamiento','qa-agenda']::text[], v_loc_col),
    (v_org, 'AGD-EVT-1', 'Agenda — evento hoy A', 'Evento hoy.', 'gala', 'S', 82, 64, 88, 138, 4100, 1400, 'available', ARRAY[t_urls[9], t_urls[10]], ARRAY['gala','formal','qa-agenda']::text[], v_loc_mvd),
    (v_org, 'AGD-EVT-2', 'Agenda — evento hoy B', 'Evento hoy.', 'vestido-corto', 'XS', 80, 62, 86, 88, 1600, 550, 'available', ARRAY[t_urls[11], t_urls[12]], ARRAY['fiesta','qa-agenda']::text[], v_loc_col);

  -- Histórico devuelto (prendas siguen en catálogo sin bloqueo activo)
  FOR gs IN 1..5 LOOP
    INSERT INTO public.garments (
      organization_id, sku, name, description, category, size_label,
      chest_cm, waist_cm, hip_cm, length_cm, rental_price, deposit_amount,
      operative_status, photos_urls, tags, location_id, notes
    ) VALUES (
      v_org,
      'QA-HIST-' || lpad(gs::text, 2, '0'),
      'Vestido histórico ' || gs::text,
      'Con reservas pasadas liberadas.',
      cats[1 + ((gs - 1) % array_length(cats, 1))],
      sizes[1 + ((gs - 1) % array_length(sizes, 1))],
      84 + gs, 66 + gs, 90 + gs, 120 + gs * 5,
      (1400 + gs * 100)::numeric,
      500::numeric,
      'available',
      ARRAY[
        t_urls[1 + ((gs - 1) % array_length(t_urls, 1))],
        t_urls[1 + (gs % array_length(t_urls, 1))]
      ],
      ARRAY['qa-hist','demo']::text[],
      CASE WHEN gs % 2 = 1 THEN v_loc_mvd ELSE v_loc_col END,
      'QA seed histórico'
    );
  END LOOP;

  -- Estados operativos + papelera
  INSERT INTO public.garments (organization_id, sku, name, description, category, size_label, chest_cm, waist_cm, hip_cm, length_cm, rental_price, deposit_amount, operative_status, photos_urls, tags, location_id)
  VALUES
    (v_org, 'QA-OPS-CLEAN', 'En limpieza (no catálogo)', 'Tintorería.', 'cóctel', 'M', 88, 70, 94, 100, 2000, 700, 'in_cleaning', ARRAY[t_urls[13]], ARRAY['qa-ops']::text[], v_loc_mvd),
    (v_org, 'QA-OPS-PROC', 'En procesamiento', 'Post-devolución.', 'gala', 'L', 92, 74, 100, 142, 3000, 1000, 'processing', ARRAY[t_urls[14]], ARRAY['qa-ops']::text[], v_loc_mvd),
    (v_org, 'QA-OPS-RET', 'Retirado de catálogo', 'Baja.', 'vestido-largo', 'S', 84, 66, 90, 140, 2500, 850, 'retired', ARRAY[t_urls[15]], ARRAY['qa-ops']::text[], v_loc_col);

  INSERT INTO public.garments (organization_id, sku, name, description, category, size_label, chest_cm, waist_cm, hip_cm, length_cm, rental_price, deposit_amount, operative_status, photos_urls, tags, location_id, deleted_at)
  VALUES
    (v_org, 'QA-TRASH-01', 'En papelera (soft delete)', 'Borrado lógico.', 'cóctel', 'M', 88, 70, 94, 98, 1800, 600, 'available', ARRAY[t_urls[16]], ARRAY['qa-trash']::text[], v_loc_mvd, now());

  -- Helper: primera clienta por email
  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = 'qa-001@maison-demo.invalid';

  -- Retiros hoy (pending / confirmed / paid)
  SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'AGD-PICK-1';
  INSERT INTO public.reservations (
    organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
    rental_price, deposit_amount, discount_amount, total_amount,
    pickup_location_id, mp_preference_id, mp_payment_status
  ) VALUES (
    v_org, v_cid, v_gid, CURRENT_DATE + 2, CURRENT_DATE, CURRENT_DATE + 5, 'pending',
    2800, 900, 0, 3700, v_loc_mvd, 'seed-' || gen_random_uuid()::text, NULL
  ) RETURNING id INTO v_rid;
  INSERT INTO public.garment_blocks (organization_id, garment_id, date_from, date_to, block_type, source_id, source_type)
  VALUES (v_org, v_gid, CURRENT_DATE, CURRENT_DATE + 5, 'reservation', v_rid, 'reservation');

  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = 'qa-002@maison-demo.invalid';
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

  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = 'qa-003@maison-demo.invalid';
  SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'AGD-PICK-3';
  INSERT INTO public.reservations (
    organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
    rental_price, deposit_amount, discount_amount, total_amount,
    pickup_location_id, mp_preference_id, mp_payment_status
  ) VALUES (
    v_org, v_cid, v_gid, CURRENT_DATE + 3, CURRENT_DATE, CURRENT_DATE + 6, 'paid',
    2400, 800, 0, 3200, v_loc_mvd, 'seed-' || gen_random_uuid()::text, 'approved'
  ) RETURNING id INTO v_rid;
  INSERT INTO public.garment_blocks (organization_id, garment_id, date_from, date_to, block_type, source_id, source_type)
  VALUES (v_org, v_gid, CURRENT_DATE, CURRENT_DATE + 6, 'reservation', v_rid, 'reservation');

  -- Devoluciones hoy (delivered, pickup en el pasado)
  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = 'qa-004@maison-demo.invalid';
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

  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = 'qa-005@maison-demo.invalid';
  SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'AGD-RET-2';
  INSERT INTO public.reservations (
    organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
    rental_price, deposit_amount, discount_amount, total_amount,
    pickup_location_id, mp_preference_id, mp_payment_status
  ) VALUES (
    v_org, v_cid, v_gid, CURRENT_DATE - 2, CURRENT_DATE - 5, CURRENT_DATE, 'delivered',
    3500, 1200, 0, 4700, v_loc_col, 'seed-' || gen_random_uuid()::text, 'approved'
  ) RETURNING id INTO v_rid;
  INSERT INTO public.garment_blocks (organization_id, garment_id, date_from, date_to, block_type, source_id, source_type)
  VALUES (v_org, v_gid, CURRENT_DATE - 5, CURRENT_DATE, 'reservation', v_rid, 'reservation');

  -- Eventos hoy
  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = 'qa-006@maison-demo.invalid';
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

  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = 'qa-007@maison-demo.invalid';
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

  -- Histórico: reservas devueltas (bloque liberado) sobre QA-HIST-*
  FOR gs IN 1..5 LOOP
    SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'QA-HIST-' || lpad(gs::text, 2, '0');
    SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = 'qa-' || lpad((8 + gs)::text, 3, '0') || '@maison-demo.invalid';
    INSERT INTO public.reservations (
      organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
      rental_price, deposit_amount, discount_amount, total_amount,
      pickup_location_id, mp_preference_id, mp_payment_status, actual_return_date
    ) VALUES (
      v_org, v_cid, v_gid,
      (CURRENT_DATE - 120 - gs)::date,
      (CURRENT_DATE - 120 - gs)::date,
      (CURRENT_DATE - 116 - gs)::date,
      'returned',
      (1400 + gs * 100)::numeric,
      500::numeric,
      0,
      (1900 + gs * 100)::numeric,
      (SELECT location_id FROM public.garments WHERE id = v_gid),
      'seed-hist-' || gs::text,
      'approved',
      (CURRENT_DATE - 115 - gs)::date
    ) RETURNING id INTO v_rid;

    INSERT INTO public.garment_blocks (
      organization_id, garment_id, date_from, date_to,
      block_type, source_id, source_type, released_at, release_reason
    ) VALUES (
      v_org, v_gid,
      (CURRENT_DATE - 120 - gs)::date,
      (CURRENT_DATE - 116 - gs)::date,
      'reservation',
      v_rid,
      'reservation',
      (CURRENT_DATE - 115 - gs)::date + interval '1 day',
      'returned'
    );
  END LOOP;

  -- Volumen histórico sobre catálogo QA-CAT (devueltas + bloques liberados)
  SELECT coalesce(array_agg(id ORDER BY sku), ARRAY[]::uuid[]) INTO cat_ids
  FROM public.garments
  WHERE organization_id = v_org AND sku LIKE 'QA-CAT-%';

  n_cat := coalesce(array_length(cat_ids, 1), 0);

  IF n_cat > 0 THEN
    FOR gs IN 1..520 LOOP
      v_gid := cat_ids[1 + ((gs - 1) % n_cat)];

      SELECT rental_price, deposit_amount, coalesce(location_id, v_loc_mvd)
      INTO v_rp, v_dep_amt, loc_id
      FROM public.garments
      WHERE id = v_gid;

      SELECT id INTO v_cid FROM public.customers
      WHERE organization_id = v_org
        AND email = 'qa-' || lpad(((gs * 13) % 180 + 1)::text, 3, '0') || '@maison-demo.invalid';

      v_pick_d := (CURRENT_DATE - (30 + ((gs * 31) % 371)))::date;
      v_ret_d := (v_pick_d + (2 + (gs % 6)))::date;

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

    -- Futuras canceladas (bloque liberado) para variedad en listados admin
    FOR gs IN 1..25 LOOP
      v_gid := cat_ids[1 + ((gs * 11) % n_cat)];

      SELECT rental_price, deposit_amount, coalesce(location_id, v_loc_mvd)
      INTO v_rp, v_dep_amt, loc_id
      FROM public.garments
      WHERE id = v_gid;

      SELECT id INTO v_cid FROM public.customers
      WHERE organization_id = v_org
        AND email = 'qa-' || lpad(((gs * 7) % 180 + 1)::text, 3, '0') || '@maison-demo.invalid';

      v_pick_d := (CURRENT_DATE + 40 + ((gs * 5) % 120))::date;
      v_ret_d := (v_pick_d + (3 + (gs % 5)))::date;

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
        'seed-fut-can-' || gs::text,
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
  END IF;

  -- Cancelada (bloque liberado)
  SELECT id INTO v_gid FROM public.garments WHERE organization_id = v_org AND sku = 'QA-CAT-010';
  SELECT id INTO v_cid FROM public.customers WHERE organization_id = v_org AND email = 'qa-010@maison-demo.invalid';
  INSERT INTO public.reservations (
    organization_id, customer_id, garment_id, event_date, pickup_date, return_date, status,
    rental_price, deposit_amount, discount_amount, total_amount,
    pickup_location_id, mp_preference_id, mp_payment_status
  ) VALUES (
    v_org, v_cid, v_gid, CURRENT_DATE + 20, CURRENT_DATE + 18, CURRENT_DATE + 22, 'cancelled',
    2000, 700, 0, 2700, v_loc_mvd, 'seed-cancel', NULL
  ) RETURNING id INTO v_rid;
  INSERT INTO public.garment_blocks (
    organization_id, garment_id, date_from, date_to,
    block_type, source_id, source_type, released_at, release_reason
  ) VALUES (
    v_org, v_gid, CURRENT_DATE + 18, CURRENT_DATE + 22,
    'reservation', v_rid, 'reservation', now(), 'cancelled'
  );

END $$;

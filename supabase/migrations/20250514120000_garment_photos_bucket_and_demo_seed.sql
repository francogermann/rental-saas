-- =============================================================================
-- Bucket público para fotos de prendas + datos demo (reservas, bloques, etc.)
-- Ejecutar después de 20240101_phase1_core.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Storage: bucket garment-photos (lectura pública; subida vía Service Role)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT
  'garment-photos',
  'garment-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'garment-photos');

DROP POLICY IF EXISTS "garment_photos_public_read" ON storage.objects;
CREATE POLICY "garment_photos_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'garment-photos');

-- -----------------------------------------------------------------------------
-- Datos demo (una sola vez: si ya existe DEMO-SEED-001, no hace nada)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_org uuid;
  v_garment_id uuid;
  v_customer_id uuid;
  v_res_id uuid;
  j int;
  v_idx int;
  v_pickup date;
  v_return date;
  v_rent numeric;
  v_dep numeric;
  st text;
  rec record;
BEGIN
  IF EXISTS (SELECT 1 FROM public.garments WHERE sku = 'DEMO-SEED-001') THEN
    RETURN;
  END IF;

  SELECT id INTO v_org FROM public.organizations WHERE slug = 'maison-demo' LIMIT 1;
  IF v_org IS NULL THEN
    INSERT INTO public.organizations (name, slug, plan)
    VALUES ('Maison Demo', 'maison-demo', 'starter')
    RETURNING id INTO v_org;
  END IF;

  -- Clientes de prueba
  FOR i IN 1..36 LOOP
    INSERT INTO public.customers (organization_id, first_name, last_name, email, phone)
    VALUES (
      v_org,
      (ARRAY['María','Lucía','Valentina','Sofía','Camila','Julieta','Agustina','Martina'])[1 + ((i - 1) % 8)],
      'Demo ' || i::text,
      'seed-' || i::text || '@demo-seed.local',
      '09' || lpad((8700000 + i)::text, 8, '0')
    );
  END LOOP;

  -- Prendas con varias fotos (URLs estables)
  FOR i IN 1..14 LOOP
    INSERT INTO public.garments (
      organization_id, sku, name, description, category, size_label,
      chest_cm, waist_cm, hip_cm, rental_price, deposit_amount,
      operative_status, photos_urls, tags
    ) VALUES (
      v_org,
      'DEMO-SEED-' || lpad(i::text, 3, '0'),
      'Vestido demo ' || i::text || ' — Colección Carpe',
      'Prenda generada para pruebas de UI. Medidas orientativas.',
      (ARRAY['vestido-largo','vestido-corto','gala','casamiento','cóctel'])[1 + ((i - 1) % 5)],
      (ARRAY['XS','S','M','L','XL'])[1 + ((i - 1) % 5)],
      80 + (i * 2),
      62 + i,
      88 + i,
      (1000 + (i * 120))::numeric,
      greatest(300, round((1000 + (i * 120)) / 3.0))::numeric,
      'available',
      ARRAY[
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
        'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80'
      ],
      ARRAY['demo','seed']::text[]
    );
  END LOOP;

  -- Reservas + bloques (histórico con bloque liberado; futuro con bloque activo)
  FOR rec IN
    SELECT id, row_number() OVER (ORDER BY sku) AS rn
    FROM public.garments
    WHERE organization_id = v_org AND sku LIKE 'DEMO-SEED-%'
  LOOP
    v_garment_id := rec.id;
    v_idx := rec.rn;

    -- Tres reservas pasadas (devueltas o canceladas) con bloque liberado
    FOR j IN 1..3 LOOP
      v_pickup := (CURRENT_DATE - INTERVAL '200 days')::date + (v_idx * 11 + j * 17);
      v_return := v_pickup + 4;
      st := CASE WHEN j = 3 THEN 'cancelled' ELSE 'returned' END;

      v_rent := (1200 + (v_idx * 60) + (j * 40))::numeric;
      v_dep := greatest(300, round(v_rent / 3.0))::numeric;

      SELECT id INTO v_customer_id FROM public.customers
      WHERE organization_id = v_org
      ORDER BY random()
      LIMIT 1;

      INSERT INTO public.reservations (
        organization_id, customer_id, garment_id,
        event_date, pickup_date, return_date, status,
        rental_price, deposit_amount, discount_amount, total_amount,
        mp_preference_id, mp_payment_status
      ) VALUES (
        v_org,
        v_customer_id,
        v_garment_id,
        v_pickup + 2,
        v_pickup,
        v_return,
        st,
        v_rent,
        v_dep,
        0,
        v_rent + v_dep,
        'demo-pref-' || gen_random_uuid()::text,
        CASE WHEN st = 'cancelled' THEN NULL ELSE 'approved' END
      )
      RETURNING id INTO v_res_id;

      INSERT INTO public.garment_blocks (
        organization_id, garment_id, date_from, date_to,
        block_type, source_id, source_type, released_at, release_reason
      ) VALUES (
        v_org,
        v_garment_id,
        v_pickup,
        v_return,
        'reservation',
        v_res_id,
        'reservation',
        v_return + 1,
        CASE WHEN st = 'cancelled' THEN 'cancelled' ELSE 'returned' END
      );
    END LOOP;

    -- Una reserva futura (mezcla de estados operativos para la grilla)
    v_pickup := CURRENT_DATE + (10 + (v_idx % 9));
    v_return := v_pickup + 5;
    st := (ARRAY['pending','confirmed','paid','delivered'])[1 + ((v_idx - 1) % 4)];

    v_rent := (1500 + (v_idx * 50))::numeric;
    v_dep := greatest(300, round(v_rent / 3.0))::numeric;

    SELECT id INTO v_customer_id FROM public.customers
    WHERE organization_id = v_org
    ORDER BY random()
    LIMIT 1;

    INSERT INTO public.reservations (
      organization_id, customer_id, garment_id,
      event_date, pickup_date, return_date, status,
      rental_price, deposit_amount, discount_amount, total_amount,
      mp_preference_id, mp_payment_status
    ) VALUES (
      v_org,
      v_customer_id,
      v_garment_id,
      v_pickup + 1,
      v_pickup,
      v_return,
      st,
      v_rent,
      v_dep,
      0,
      v_rent + v_dep,
      'demo-pref-' || gen_random_uuid()::text,
      CASE WHEN st = 'pending' THEN NULL ELSE 'approved' END
    )
    RETURNING id INTO v_res_id;

    INSERT INTO public.garment_blocks (
      organization_id, garment_id, date_from, date_to,
      block_type, source_id, source_type
    ) VALUES (
      v_org,
      v_garment_id,
      v_pickup,
      v_return,
      'reservation',
      v_res_id,
      'reservation'
    );
  END LOOP;

  -- Lote extra de reservas pasadas sin depender de prendas demo (mezcla clientes)
  FOR j IN 1..22 LOOP
    SELECT id INTO v_garment_id FROM public.garments
    WHERE organization_id = v_org AND sku LIKE 'DEMO-SEED-%'
    ORDER BY random()
    LIMIT 1;

    SELECT id INTO v_customer_id FROM public.customers
    WHERE organization_id = v_org
    ORDER BY random()
    LIMIT 1;

    v_pickup := (CURRENT_DATE - INTERVAL '400 days')::date + (j * 9);
    v_return := v_pickup + 3;

    v_rent := (1100 + (j * 25))::numeric;
    v_dep := greatest(300, round(v_rent / 3.0))::numeric;

    INSERT INTO public.reservations (
      organization_id, customer_id, garment_id,
      pickup_date, return_date, status,
      rental_price, deposit_amount, discount_amount, total_amount,
      mp_payment_status
    ) VALUES (
      v_org,
      v_customer_id,
      v_garment_id,
      v_pickup,
      v_return,
      'returned',
      v_rent,
      v_dep,
      0,
      v_rent + v_dep,
      'approved'
    )
    RETURNING id INTO v_res_id;

    INSERT INTO public.garment_blocks (
      organization_id, garment_id, date_from, date_to,
      block_type, source_id, source_type, released_at, release_reason
    ) VALUES (
      v_org,
      v_garment_id,
      v_pickup,
      v_return,
      'reservation',
      v_res_id,
      'reservation',
      v_return + 2,
      'returned'
    );
  END LOOP;
END $$;

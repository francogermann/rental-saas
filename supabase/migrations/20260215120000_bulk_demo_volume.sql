-- =============================================================================
-- Volumen de prueba: clientas, prendas multi-talle (style_group) y reservas
-- Idempotente: no inserta si ya hay ≥150 reservas en maison-demo o marca BULK-SEED-V1
-- =============================================================================

do $bulk$
declare
  v_org       uuid;
  v_cur       int;
  v_need      int;
  v_loc_mvd   uuid;
  v_loc_col   uuid;
  i           int;
  sg          uuid;
  loc         uuid;
  sz          text;
  sizes       text[] := array['XS', 'M', 'XL'];
  garment_arr uuid[];
  n_g         int;
  cust_arr    uuid[];
  n_c         int;
  seq         int;
  v_garment_id uuid;
  c_id        uuid;
  r_id        uuid;
  pickup_d    date;
  return_d    date;
  v_half      int;
begin
  select o.id into v_org
  from public.organizations o
  where o.slug = 'maison-demo';

  if v_org is null then
    raise notice 'bulk_demo_volume: maison-demo org not found';
    return;
  end if;

  select count(*)::int into v_cur
  from public.reservations r
  where r.organization_id = v_org;

  if v_cur >= 150 then
    raise notice 'bulk_demo_volume: already % reservations, skip', v_cur;
    return;
  end if;

  select l.id into v_loc_mvd
  from public.locations l
  where l.organization_id = v_org
    and l.name = 'Montevideo — Micenas Mall'
  limit 1;

  select l.id into v_loc_col
  from public.locations l
  where l.organization_id = v_org
    and l.name = 'Colonia'
  limit 1;

  if v_loc_mvd is null or v_loc_col is null then
    raise notice 'bulk_demo_volume: expected locations missing';
    return;
  end if;

  if not exists (
    select 1
    from public.garments g
    where g.organization_id = v_org
      and g.sku = 'BULK-001-XS'
  ) then
    for i in 1..120 loop
      insert into public.customers (
        organization_id, first_name, last_name, email, phone
      )
      values (
        v_org,
        'Cliente',
        'Bulk ' || i::text,
        'bulk-seed-v1-' || i::text || '@maison-demo.invalid',
        '099100' || lpad(i::text, 4, '0')
      )
      on conflict (organization_id, email) do nothing;
    end loop;

    for i in 1..40 loop
      sg := gen_random_uuid();
      loc := case when i % 2 = 0 then v_loc_mvd else v_loc_col end;
      foreach sz in array sizes loop
        insert into public.garments (
          organization_id,
          sku,
          name,
          description,
          category,
          size_label,
          chest_cm,
          waist_cm,
          hip_cm,
          length_cm,
          rental_price,
          deposit_amount,
          operative_status,
          photos_urls,
          tags,
          location_id,
          style_group_id,
          notes
        )
        values (
          v_org,
          'BULK-' || lpad(i::text, 3, '0') || '-' || sz,
          'Vestido bulk ' || i::text,
          'Prenda de prueba (migración bulk_demo_volume).',
          'Fiesta',
          sz,
          86 + case sz when 'XS' then -4 when 'M' then 0 when 'XL' then 6 else 0 end,
          68 + case sz when 'XS' then -4 when 'M' then 0 when 'XL' then 6 else 0 end,
          94 + case sz when 'XS' then -4 when 'M' then 0 when 'XL' then 6 else 0 end,
          130,
          (1990 + (i * 13))::numeric,
          500::numeric,
          'available',
          array['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80']::text[],
          array['seed', 'bulk']::text[],
          loc,
          sg,
          'BULK-GARMENT-V1'
        );
      end loop;
    end loop;
  end if;

  select coalesce(array_agg(id order by sku), '{}') into garment_arr
  from public.garments g
  where g.organization_id = v_org
    and g.sku like 'BULK-%';

  n_g := coalesce(array_length(garment_arr, 1), 0);

  select coalesce(array_agg(id order by email), '{}') into cust_arr
  from public.customers c
  where c.organization_id = v_org
    and c.email like 'bulk-seed-v1-%@maison-demo.invalid';

  n_c := coalesce(array_length(cust_arr, 1), 0);

  if n_g = 0 or n_c = 0 then
    raise notice 'bulk_demo_volume: missing bulk garments (%) or customers (%)', n_g, n_c;
    return;
  end if;

  v_need := greatest(0, 150 - v_cur);
  v_half := greatest(1, v_need / 2);

  for seq in 1..v_need loop
    v_garment_id := garment_arr[1 + ((seq - 1) % n_g)];
    c_id := cust_arr[1 + ((seq - 1) % n_c)];

    if seq <= v_half then
      pickup_d := current_date + 14 + (seq * 4);
      return_d := pickup_d + 3;

      insert into public.reservations (
        organization_id,
        customer_id,
        garment_id,
        event_date,
        pickup_date,
        return_date,
        status,
        rental_price,
        deposit_amount,
        discount_amount,
        total_amount,
        notes
      )
      values (
        v_org,
        c_id,
        v_garment_id,
        pickup_d + 1,
        pickup_d,
        return_d,
        case (seq % 5) when 0 then 'pending' else 'confirmed' end,
        2000::numeric,
        500::numeric,
        0::numeric,
        2500::numeric,
        'BULK-SEED-V1|' || seq::text
      )
      returning id into r_id;

      insert into public.garment_blocks (
        organization_id,
        garment_id,
        date_from,
        date_to,
        block_type,
        source_id,
        source_type,
        notes
      )
      values (
        v_org,
        v_garment_id,
        pickup_d,
        return_d,
        'reservation',
        r_id,
        'reservation',
        null
      );
    else
      pickup_d := current_date - 400 + ((seq - v_half) * 5);
      return_d := pickup_d + 3;

      insert into public.reservations (
        organization_id,
        customer_id,
        garment_id,
        event_date,
        pickup_date,
        return_date,
        status,
        rental_price,
        deposit_amount,
        discount_amount,
        total_amount,
        notes
      )
      values (
        v_org,
        c_id,
        v_garment_id,
        pickup_d + 1,
        pickup_d,
        return_d,
        'returned',
        1800::numeric,
        400::numeric,
        0::numeric,
        2200::numeric,
        'BULK-SEED-V1-PAST|' || seq::text
      )
      returning id into r_id;

      insert into public.garment_blocks (
        organization_id,
        garment_id,
        date_from,
        date_to,
        block_type,
        source_id,
        source_type,
        notes,
        released_at,
        release_reason
      )
      values (
        v_org,
        v_garment_id,
        pickup_d,
        return_d,
        'reservation',
        r_id,
        'reservation',
        null,
        now(),
        'bulk_demo_volume past reservation'
      );
    end if;
  end loop;

  raise notice 'bulk_demo_volume: added % reservations (was %)', v_need, v_cur;
end
$bulk$;

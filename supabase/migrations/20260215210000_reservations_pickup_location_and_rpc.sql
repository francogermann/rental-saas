-- Sede de retiro pactada + filtro de catálogo por sede + notas en reserva manual.

alter table public.reservations
  add column if not exists pickup_location_id uuid references public.locations(id) on delete set null;

comment on column public.reservations.pickup_location_id is
  'Sede de retiro pactada; puede diferir de garments.location_id en reservas manuales cross-sede.';

-- Catálogo: una firma (11 args). p_pickup_location_id null = sin filtro extra (compat).
drop function if exists public.get_available_garments(date, date, text, integer, integer, text, numeric, integer, integer, uuid);

create or replace function public.get_available_garments(
  p_pickup_date   date,
  p_return_date   date,
  p_size_label    text    default null,
  p_chest_cm      int     default null,
  p_waist_cm      int     default null,
  p_category      text    default null,
  p_max_price     numeric default null,
  p_limit         int     default 50,
  p_offset        int     default 0,
  p_organization_id uuid default null,
  p_pickup_location_id uuid default null
)
returns table (
  id              uuid,
  name            text,
  sku             text,
  size_label      text,
  category        text,
  rental_price    numeric,
  deposit_amount  numeric,
  photos_urls     text[],
  chest_cm        int,
  waist_cm        int,
  hip_cm          int,
  tags            text[],
  style_group_id  uuid,
  location_id     uuid,
  location_name   text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id,
    g.name,
    g.sku,
    g.size_label,
    g.category,
    g.rental_price,
    g.deposit_amount,
    g.photos_urls,
    g.chest_cm,
    g.waist_cm,
    g.hip_cm,
    g.tags,
    g.style_group_id,
    loc.id as location_id,
    loc.name as location_name
  from garments g
  left join locations loc on loc.id = g.location_id
  where
    g.organization_id = coalesce(auth_organization_id(), p_organization_id)

    and g.operative_status = 'available'

    and (p_pickup_location_id is null or g.location_id = p_pickup_location_id)

    and (p_size_label is null or g.size_label = p_size_label)
    and (p_category   is null or g.category   = p_category)
    and (p_max_price  is null or g.rental_price <= p_max_price)

    and (p_chest_cm   is null or (g.chest_cm is null or (g.chest_cm >= p_chest_cm - 3 and g.chest_cm <= p_chest_cm + 5)))
    and (p_waist_cm   is null or (g.waist_cm is null or (g.waist_cm >= p_waist_cm - 3 and g.waist_cm <= p_waist_cm + 5)))

    and not exists (
      select 1
      from garment_blocks b
      where
        b.garment_id   = g.id
        and b.released_at is null
        and daterange(b.date_from, b.date_to, '[]')
            && daterange(p_pickup_date, p_return_date, '[]')
    )
  order by g.rental_price asc, g.name asc
  limit p_limit
  offset p_offset;
$$;

-- Reserva vía service role: pickup, notas, estado (pending checkout / confirmed manual).
drop function if exists public.create_reservation_with_block_for_org(uuid, uuid, uuid, date, date, date, numeric, numeric);
drop function if exists public.create_reservation_with_block_for_org(uuid, uuid, uuid, date, date, date, numeric, numeric, uuid, text);

create or replace function public.create_reservation_with_block_for_org(
  p_organization_id   uuid,
  p_garment_id        uuid,
  p_customer_id       uuid,
  p_pickup_date       date,
  p_return_date       date,
  p_event_date        date,
  p_rental_price      numeric,
  p_deposit_amount    numeric,
  p_pickup_location_id uuid default null,
  p_notes              text default null,
  p_status             text default 'confirmed'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation   reservations;
  v_block         garment_blocks;
  v_conflict_count int;
  v_garment_loc   uuid;
  v_pickup_loc    uuid;
  v_status        text;
begin
  if p_organization_id is null then
    raise exception 'INVALID_ORG: organización requerida' using errcode = 'P0001';
  end if;

  v_status := coalesce(nullif(trim(p_status), ''), 'confirmed');
  if v_status not in ('pending', 'confirmed') then
    raise exception 'INVALID_STATUS: solo pending o confirmed' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.organizations o where o.id = p_organization_id
  ) then
    raise exception 'FORBIDDEN: organización inexistente' using errcode = 'P0002';
  end if;

  select g.location_id into v_garment_loc
  from public.garments g
  where g.id = p_garment_id and g.organization_id = p_organization_id;

  if not found then
    raise exception 'FORBIDDEN: prenda no pertenece a la organización' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.customers c
    where c.id = p_customer_id and c.organization_id = p_organization_id
  ) then
    raise exception 'FORBIDDEN: cliente no pertenece a la organización' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.customers c
    where c.id = p_customer_id and c.is_blocked = true
  ) then
    raise exception 'BLOCKED_CUSTOMER: el cliente está bloqueado' using errcode = 'P0003';
  end if;

  v_pickup_loc := coalesce(p_pickup_location_id, v_garment_loc);

  if v_pickup_loc is not null and not exists (
    select 1 from public.locations l
    where l.id = v_pickup_loc and l.organization_id = p_organization_id
  ) then
    raise exception 'FORBIDDEN: sede de retiro inválida' using errcode = 'P0002';
  end if;

  select count(*) into v_conflict_count
  from public.garment_blocks b
  where
    b.garment_id = p_garment_id
    and b.released_at is null
    and daterange(b.date_from, b.date_to, '[]') && daterange(p_pickup_date, p_return_date, '[]')
  for update skip locked;

  if v_conflict_count > 0 then
    raise exception 'CONFLICT: la prenda ya tiene un bloqueo activo en ese rango de fechas'
      using errcode = 'P0004';
  end if;

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
    total_amount,
    pickup_location_id,
    notes
  ) values (
    p_organization_id,
    p_customer_id,
    p_garment_id,
    p_event_date,
    p_pickup_date,
    p_return_date,
    v_status,
    p_rental_price,
    p_deposit_amount,
    p_rental_price + p_deposit_amount,
    v_pickup_loc,
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning * into v_reservation;

  insert into public.garment_blocks (
    organization_id,
    garment_id,
    date_from,
    date_to,
    block_type,
    source_id,
    source_type
  ) values (
    p_organization_id,
    p_garment_id,
    p_pickup_date,
    p_return_date,
    'reservation',
    v_reservation.id,
    'reservation'
  )
  returning * into v_block;

  return jsonb_build_object(
    'reservation_id', v_reservation.id,
    'block_id',       v_block.id,
    'status',         v_reservation.status
  );

exception
  when others then
    raise;
end;
$$;

revoke all on function public.create_reservation_with_block_for_org(
  uuid, uuid, uuid, date, date, date, numeric, numeric, uuid, text, text
) from public;

grant execute on function public.create_reservation_with_block_for_org(
  uuid, uuid, uuid, date, date, date, numeric, numeric, uuid, text, text
) to service_role;

-- Checkout autenticado / RPC estándar: persistir sede de retiro (validación estricta si se pasa).
drop function if exists public.create_reservation_with_block(uuid, uuid, date, date, date, numeric, numeric);

create or replace function public.create_reservation_with_block(
  p_garment_id      uuid,
  p_customer_id     uuid,
  p_pickup_date     date,
  p_return_date     date,
  p_event_date      date,
  p_rental_price    numeric,
  p_deposit_amount  numeric,
  p_pickup_location_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id        uuid;
  v_reservation   reservations;
  v_block         garment_blocks;
  v_conflict_count int;
  v_pickup_loc    uuid;
begin
  v_org_id := auth_organization_id();
  if v_org_id is null then
    raise exception 'UNAUTHENTICATED: usuario sin organización' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.garments g
    where g.id = p_garment_id and g.organization_id = v_org_id
  ) then
    raise exception 'FORBIDDEN: prenda no pertenece a la organización' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.customers where id = p_customer_id and organization_id = v_org_id
  ) then
    raise exception 'FORBIDDEN: cliente no pertenece a la organización' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.customers where id = p_customer_id and is_blocked = true
  ) then
    raise exception 'BLOCKED_CUSTOMER: el cliente está bloqueado' using errcode = 'P0003';
  end if;

  v_pickup_loc := coalesce(
    p_pickup_location_id,
    (select g.location_id from public.garments g where g.id = p_garment_id)
  );

  if p_pickup_location_id is not null then
    if not exists (
      select 1 from public.garments g
      where g.id = p_garment_id and g.location_id is not distinct from p_pickup_location_id
    ) then
      raise exception 'PICKUP_MISMATCH: la sede de retiro no coincide con la ubicación del vestido' using errcode = 'P0005';
    end if;
  end if;

  if v_pickup_loc is not null and not exists (
    select 1 from public.locations l where l.id = v_pickup_loc and l.organization_id = v_org_id
  ) then
    raise exception 'FORBIDDEN: sede de retiro inválida' using errcode = 'P0002';
  end if;

  select count(*) into v_conflict_count
  from public.garment_blocks b
  where
    b.garment_id    = p_garment_id
    and b.released_at is null
    and daterange(b.date_from, b.date_to, '[]') && daterange(p_pickup_date, p_return_date, '[]')
  for update skip locked;

  if v_conflict_count > 0 then
    raise exception 'CONFLICT: la prenda ya tiene un bloqueo activo en ese rango de fechas'
      using errcode = 'P0004';
  end if;

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
    total_amount,
    pickup_location_id
  ) values (
    v_org_id,
    p_customer_id,
    p_garment_id,
    p_event_date,
    p_pickup_date,
    p_return_date,
    'pending',
    p_rental_price,
    p_deposit_amount,
    p_rental_price + p_deposit_amount,
    v_pickup_loc
  )
  returning * into v_reservation;

  insert into public.garment_blocks (
    organization_id,
    garment_id,
    date_from,
    date_to,
    block_type,
    source_id,
    source_type
  ) values (
    v_org_id,
    p_garment_id,
    p_pickup_date,
    p_return_date,
    'reservation',
    v_reservation.id,
    'reservation'
  )
  returning * into v_block;

  return jsonb_build_object(
    'reservation_id', v_reservation.id,
    'block_id',       v_block.id,
    'status',         v_reservation.status
  );

exception
  when others then
    raise;
end;
$$;

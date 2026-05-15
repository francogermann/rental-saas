-- Checkout pending: reserva sin bloqueo hasta confirmar pago.
-- confirm_reservation_payment: bloqueo atómico al aprobar pago.
-- cancel_pending_reservation / expire_pending_reservations: limpieza.

drop function if exists public.create_reservation_with_block_for_org(uuid, uuid, uuid, date, date, date, numeric, numeric, uuid, text, text);

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

  if v_status <> 'pending' then
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
  end if;

  return jsonb_build_object(
    'reservation_id', v_reservation.id,
    'block_id',       case when v_status = 'pending' then null else v_block.id end,
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

-- Confirma pago: crea bloqueo + pasa a paid (atómico).
create or replace function public.confirm_reservation_payment(
  p_reservation_id uuid,
  p_mp_payment_id text default null,
  p_mp_payment_status text default 'approved'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res         reservations;
  v_block       garment_blocks;
  v_conflict_count int;
begin
  if p_reservation_id is null then
    raise exception 'INVALID_RESERVATION: id requerido' using errcode = 'P0001';
  end if;

  select * into v_res
  from public.reservations r
  where r.id = p_reservation_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: reserva inexistente' using errcode = 'P0002';
  end if;

  if v_res.status = 'paid' then
    return jsonb_build_object(
      'reservation_id', v_res.id,
      'status', v_res.status,
      'already_confirmed', true
    );
  end if;

  if v_res.status <> 'pending' then
    raise exception 'INVALID_STATUS: solo se confirma pago de reservas pending' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.garment_blocks b
    where b.source_id = v_res.id
      and b.source_type = 'reservation'
      and b.released_at is null
  ) then
    raise exception 'INVALID_STATE: la reserva ya tiene bloqueo activo' using errcode = 'P0001';
  end if;

  select count(*) into v_conflict_count
  from public.garment_blocks b
  where
    b.garment_id = v_res.garment_id
    and b.released_at is null
    and daterange(b.date_from, b.date_to, '[]') && daterange(v_res.pickup_date, v_res.return_date, '[]');

  if v_conflict_count > 0 then
    raise exception 'CONFLICT: la prenda ya tiene un bloqueo activo en ese rango de fechas'
      using errcode = 'P0004';
  end if;

  insert into public.garment_blocks (
    organization_id,
    garment_id,
    date_from,
    date_to,
    block_type,
    source_id,
    source_type
  ) values (
    v_res.organization_id,
    v_res.garment_id,
    v_res.pickup_date,
    v_res.return_date,
    'reservation',
    v_res.id,
    'reservation'
  )
  returning * into v_block;

  update public.reservations
  set
    status = 'paid',
    mp_payment_id = coalesce(nullif(trim(p_mp_payment_id), ''), mp_payment_id),
    mp_payment_status = coalesce(nullif(trim(p_mp_payment_status), ''), 'approved')
  where id = v_res.id
  returning * into v_res;

  return jsonb_build_object(
    'reservation_id', v_res.id,
    'block_id', v_block.id,
    'status', v_res.status
  );
end;
$$;

revoke all on function public.confirm_reservation_payment(uuid, text, text) from public;
grant execute on function public.confirm_reservation_payment(uuid, text, text) to service_role;

-- Cancela reserva pending sin bloqueo (abandono / pago rechazado).
create or replace function public.cancel_pending_reservation(p_reservation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res reservations;
begin
  if p_reservation_id is null then
    raise exception 'INVALID_RESERVATION: id requerido' using errcode = 'P0001';
  end if;

  select * into v_res
  from public.reservations r
  where r.id = p_reservation_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: reserva inexistente' using errcode = 'P0002';
  end if;

  if v_res.status = 'cancelled' then
    return jsonb_build_object('reservation_id', v_res.id, 'status', 'cancelled', 'already_cancelled', true);
  end if;

  if v_res.status <> 'pending' then
    raise exception 'INVALID_STATUS: solo se cancelan reservas pending' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.garment_blocks b
    where b.source_id = v_res.id
      and b.source_type = 'reservation'
      and b.released_at is null
  ) then
    raise exception 'INVALID_STATE: la reserva pending no debe tener bloqueo activo' using errcode = 'P0001';
  end if;

  update public.reservations
  set status = 'cancelled'
  where id = v_res.id
  returning * into v_res;

  return jsonb_build_object('reservation_id', v_res.id, 'status', v_res.status);
end;
$$;

revoke all on function public.cancel_pending_reservation(uuid) from public;
grant execute on function public.cancel_pending_reservation(uuid) to service_role;

-- Cron opcional: pending abandonadas > 24 h.
create or replace function public.expire_pending_reservations(p_older_than interval default interval '24 hours')
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.reservations r
  set status = 'cancelled'
  where r.status = 'pending'
    and r.created_at < now() - p_older_than
    and not exists (
      select 1 from public.garment_blocks b
      where b.source_id = r.id
        and b.source_type = 'reservation'
        and b.released_at is null
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_pending_reservations(interval) from public;
grant execute on function public.expire_pending_reservations(interval) to service_role;

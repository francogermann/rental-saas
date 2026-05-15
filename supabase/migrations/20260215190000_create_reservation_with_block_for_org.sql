-- Reserva + bloqueo fijando organización (uso desde service role / panel admin sin JWT Supabase).
-- Estado confirmed: operativa sin Mercado Pago.

create or replace function public.create_reservation_with_block_for_org(
  p_organization_id   uuid,
  p_garment_id        uuid,
  p_customer_id       uuid,
  p_pickup_date       date,
  p_return_date       date,
  p_event_date        date,
  p_rental_price      numeric,
  p_deposit_amount    numeric
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
begin
  if p_organization_id is null then
    raise exception 'INVALID_ORG: organización requerida' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.organizations o where o.id = p_organization_id
  ) then
    raise exception 'FORBIDDEN: organización inexistente' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.garments g
    where g.id = p_garment_id and g.organization_id = p_organization_id
  ) then
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
    total_amount
  ) values (
    p_organization_id,
    p_customer_id,
    p_garment_id,
    p_event_date,
    p_pickup_date,
    p_return_date,
    'confirmed',
    p_rental_price,
    p_deposit_amount,
    p_rental_price + p_deposit_amount
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
  uuid, uuid, uuid, date, date, date, numeric, numeric
) from public;

grant execute on function public.create_reservation_with_block_for_org(
  uuid, uuid, uuid, date, date, date, numeric, numeric
) to service_role;

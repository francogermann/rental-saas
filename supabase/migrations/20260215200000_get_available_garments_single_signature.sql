-- get_available_garments quedó con varias sobrecargas (p. ej. 9 args sin org + 10 args con uuid,
-- o uuid al inicio vs al final). PostgREST/Supabase resuelve la RPC por nombre y Postgres no puede
-- elegir candidato → "Could not choose the best candidate function".
-- Dejamos una sola firma: la de catálogo con p_organization_id al final (como en availability.ts).

drop function if exists public.get_available_garments(uuid, date, date, text, integer, integer, text, numeric, integer, integer);
drop function if exists public.get_available_garments(date, date, text, integer, integer, text, numeric, integer, integer);
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
  p_organization_id uuid default null
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

-- Prendas sin sede (p. ej. seed antiguo): no aparecían en el catálogo al filtrar por pickupLocationId.
-- 1) Asignar la primera sede de cada org por sort_order/name.
-- 2) Catálogo: incluir prendas con location_id null si aún existieran (red de seguridad).

update public.garments g
set location_id = sub.first_loc_id
from (
  select distinct on (organization_id)
    organization_id,
    id as first_loc_id
  from public.locations
  order by organization_id, sort_order asc, name asc
) sub
where g.location_id is null
  and g.organization_id = sub.organization_id;

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
  from public.garments g
  left join public.locations loc on loc.id = g.location_id
  where
    g.organization_id = coalesce(auth_organization_id(), p_organization_id)

    and g.operative_status = 'available'

    and (
      p_pickup_location_id is null
      or g.location_id = p_pickup_location_id
      or g.location_id is null
    )

    and (p_size_label is null or g.size_label = p_size_label)
    and (p_category   is null or g.category   = p_category)
    and (p_max_price  is null or g.rental_price <= p_max_price)

    and (p_chest_cm   is null or (g.chest_cm is null or (g.chest_cm >= p_chest_cm - 3 and g.chest_cm <= p_chest_cm + 5)))
    and (p_waist_cm   is null or (g.waist_cm is null or (g.waist_cm >= p_waist_cm - 3 and g.waist_cm <= p_waist_cm + 5)))

    and not exists (
      select 1
      from public.garment_blocks b
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

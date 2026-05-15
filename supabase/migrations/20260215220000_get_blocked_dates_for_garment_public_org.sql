-- Calendario storefront (anónimo): auth_organization_id() es null; permitir consultar bloqueos
-- pasando p_organization_id (mismo patrón que get_available_garments).

create or replace function public.get_blocked_dates_for_garment(
  p_garment_id         uuid,
  p_from_date          date default (current_date),
  p_until_date         date default (current_date + interval '12 months'),
  p_organization_id    uuid default null
)
returns table (
  date_from   date,
  date_to     date,
  block_type  text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.date_from,
    b.date_to,
    b.block_type
  from public.garment_blocks b
  inner join public.garments g on g.id = b.garment_id
  where
    b.garment_id = p_garment_id
    and g.organization_id = coalesce(auth_organization_id(), p_organization_id)
    and coalesce(auth_organization_id(), p_organization_id) is not null
    and b.released_at is null
    and b.date_to >= p_from_date
    and b.date_from <= p_until_date
  order by b.date_from asc;
$$;

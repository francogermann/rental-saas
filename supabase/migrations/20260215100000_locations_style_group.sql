-- =============================================================================
-- Sedes del local (Montevideo / Colonia) + ubicación y agrupación por estilo
-- =============================================================================

create table public.locations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  address_line    text not null,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger locations_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

create index idx_locations_org_sort
  on public.locations (organization_id, sort_order, name);

alter table public.locations enable row level security;

create policy "locations_org_all"
  on public.locations for all
  using (organization_id = auth_organization_id());

-- Sedes Carpe Diem (idempotente por nombre + org)
insert into public.locations (organization_id, name, address_line, sort_order)
select o.id, 'Montevideo — Micenas Mall', 'Av Brasil 3072, local 9', 1
from public.organizations o
where o.slug = 'maison-demo'
  and not exists (
    select 1 from public.locations l
    where l.organization_id = o.id and l.name = 'Montevideo — Micenas Mall'
  );

insert into public.locations (organization_id, name, address_line, sort_order)
select o.id, 'Colonia', 'Av Artigas 316', 2
from public.organizations o
where o.slug = 'maison-demo'
  and not exists (
    select 1 from public.locations l
    where l.organization_id = o.id and l.name = 'Colonia'
  );

alter table public.garments
  add column if not exists location_id uuid references public.locations(id) on delete set null;

alter table public.garments
  add column if not exists style_group_id uuid;

create index if not exists idx_garments_org_location
  on public.garments (organization_id, location_id);

create index if not exists idx_garments_style_group
  on public.garments (organization_id, style_group_id)
  where style_group_id is not null;

-- -----------------------------------------------------------------------------
-- RPC catálogo: org explícita para visitantes sin JWT + sede de la prenda
-- -----------------------------------------------------------------------------
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

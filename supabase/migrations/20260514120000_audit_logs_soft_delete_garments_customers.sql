-- HU-047: auditoría general
create table if not exists public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  actor_username   text not null,
  actor_role       text not null,
  action           text not null,
  entity_type      text not null,
  entity_id        uuid,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at
  on public.audit_logs (created_at desc);

create index if not exists idx_audit_logs_entity
  on public.audit_logs (entity_type, entity_id);

comment on table public.audit_logs is 'Historial de acciones del panel admin (service role).';

-- HU-048: borrado lógico prendas / clientes
alter table public.garments add column if not exists deleted_at timestamptz;
alter table public.customers add column if not exists deleted_at timestamptz;

-- SKU único solo entre filas activas (no borradas lógicamente)
alter table public.garments drop constraint if exists garments_sku_org_unique;

create unique index if not exists garments_org_sku_active_uq
  on public.garments (organization_id, sku)
  where deleted_at is null;

-- Email único por org solo entre clientas activas
alter table public.customers drop constraint if exists customers_email_org_unique;

create unique index if not exists customers_org_email_active_uq
  on public.customers (organization_id, email)
  where deleted_at is null;

-- Índice catálogo: excluir borradas lógicamente
drop index if exists idx_garments_org_size;
create index idx_garments_org_size
  on public.garments (organization_id, size_label)
  where operative_status = 'available' and deleted_at is null;

-- Catálogo público: excluir prendas en papelera
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
    and g.deleted_at is null
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

-- Bloqueos: no exponer calendario de prenda en papelera
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
    and g.deleted_at is null
    and g.organization_id = coalesce(auth_organization_id(), p_organization_id)
    and coalesce(auth_organization_id(), p_organization_id) is not null
    and b.released_at is null
    and b.date_to >= p_from_date
    and b.date_from <= p_until_date
  order by b.date_from asc;
$$;

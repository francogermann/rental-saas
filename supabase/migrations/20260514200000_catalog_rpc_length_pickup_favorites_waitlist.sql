-- Catálogo: restaurar filtro por sede de retiro, soft-delete, y exponer length_cm.
-- Postgres no permite cambiar RETURNS TABLE con CREATE OR REPLACE si cambian las columnas;
-- eliminamos todas las firmas conocidas de get_available_garments y recreamos una sola.
drop function if exists public.get_available_garments(date, date, text, integer, integer, text, numeric, integer, integer, uuid, uuid);
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
  length_cm       int,
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
    g.length_cm,
    g.tags,
    g.style_group_id,
    loc.id as location_id,
    loc.name as location_name
  from public.garments g
  left join public.locations loc on loc.id = g.location_id
  where
    g.organization_id = coalesce(auth_organization_id(), p_organization_id)
    and g.deleted_at is null
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

-- HU-014 favoritos (por cuenta Supabase Auth)
create table if not exists public.favorite_garments (
  user_id    uuid not null references auth.users (id) on delete cascade,
  garment_id uuid not null references public.garments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, garment_id)
);

create index if not exists idx_favorite_garments_garment on public.favorite_garments (garment_id);

alter table public.favorite_garments enable row level security;

drop policy if exists "favorite_garments_select_own" on public.favorite_garments;
create policy "favorite_garments_select_own"
  on public.favorite_garments for select
  using (auth.uid() = user_id);

drop policy if exists "favorite_garments_insert_own" on public.favorite_garments;
create policy "favorite_garments_insert_own"
  on public.favorite_garments for insert
  with check (auth.uid() = user_id);

drop policy if exists "favorite_garments_delete_own" on public.favorite_garments;
create policy "favorite_garments_delete_own"
  on public.favorite_garments for delete
  using (auth.uid() = user_id);

-- HU-016 lista de espera
create table if not exists public.garment_waitlist (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  garment_id       uuid not null references public.garments (id) on delete cascade,
  pickup_date      date not null,
  return_date      date not null,
  created_at       timestamptz not null default now(),
  notified_at      timestamptz,
  constraint garment_waitlist_dates check (return_date >= pickup_date),
  constraint garment_waitlist_user_garment_range unique (user_id, garment_id, pickup_date, return_date)
);

create index if not exists idx_garment_waitlist_pending
  on public.garment_waitlist (garment_id)
  where notified_at is null;

alter table public.garment_waitlist enable row level security;

drop policy if exists "garment_waitlist_select_own" on public.garment_waitlist;
create policy "garment_waitlist_select_own"
  on public.garment_waitlist for select
  using (auth.uid() = user_id);

drop policy if exists "garment_waitlist_insert_own" on public.garment_waitlist;
create policy "garment_waitlist_insert_own"
  on public.garment_waitlist for insert
  with check (auth.uid() = user_id);

drop policy if exists "garment_waitlist_delete_own" on public.garment_waitlist;
create policy "garment_waitlist_delete_own"
  on public.garment_waitlist for delete
  using (auth.uid() = user_id);

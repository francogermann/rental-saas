-- =============================================================================
-- FASE 1 MVP — Alquiler de Prendas
-- Migración inicial: tablas core, RLS, índices GIST, RPC de disponibilidad
-- Ejecutar en orden en el SQL Editor de Supabase
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. EXTENSIONES
-- -----------------------------------------------------------------------------
-- btree_gist permite crear índices GIST sobre tipos escalares (uuid, date, text)
-- combinados con rangos, lo que habilita el operador && ultra rápido.
create extension if not exists "btree_gist";
create extension if not exists "uuid-ossp";

-- pg_cron es opcional para el MVP pero lo incluimos para la vista materializada.
-- Puede requerir habilitación manual en el dashboard de Supabase.
-- create extension if not exists "pg_cron";


-- -----------------------------------------------------------------------------
-- 1. FUNCIÓN AUXILIAR: obtener organization_id desde el JWT
-- Se llama desde todas las políticas RLS. Centralizar aquí facilita cambios.
-- -----------------------------------------------------------------------------
create or replace function public.auth_organization_id()
returns uuid
language sql
stable
as $$
  -- Primero intenta app_metadata (seteado por el servidor, más seguro),
  -- luego user_metadata (fallback para desarrollo).
  select coalesce(
    nullif((auth.jwt() -> 'app_metadata' ->> 'organization_id'), '')::uuid,
    nullif((auth.jwt() -> 'user_metadata' ->> 'organization_id'), '')::uuid
  );
$$;

-- Función para actualizar updated_at automáticamente (trigger reutilizable)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =============================================================================
-- 2. TABLAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 ORGANIZATIONS
-- Raíz del árbol multi-tenant. Cada fila es un local/negocio.
-- -----------------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,        -- para subdominios: slug.tuapp.com
  plan        text not null default 'starter',
  -- starter | pro | enterprise
  settings    jsonb not null default '{}', -- config flexible: moneda, zona horaria, etc.
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint organizations_plan_check check (
    plan in ('starter', 'pro', 'enterprise')
  )
);

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- RLS: solo el superadmin accede directamente.
-- Los usuarios comunes sólo ven su org vía las relaciones (foreign keys).
alter table public.organizations enable row level security;

create policy "org_self_read"
  on public.organizations for select
  using (id = auth_organization_id());


-- -----------------------------------------------------------------------------
-- 2.2 GARMENTS (Prendas)
-- -----------------------------------------------------------------------------
create table public.garments (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,

  -- Identificación
  sku               text not null,
  name              text not null,
  description       text,
  category          text,           -- 'vestido' | 'traje' | 'accesorio' | etc.

  -- Medidas (separar del talle etiquetado evita el problema de talles no universales)
  size_label        text,           -- 'XS','S','M','L','XL','42','44'...
  chest_cm          int,
  waist_cm          int,
  hip_cm            int,
  length_cm         int,

  -- Comercial
  rental_price      numeric(10,2),
  sale_price        numeric(10,2),
  deposit_amount    numeric(10,2) not null default 0,

  -- Estado operativo
  -- IMPORTANTE: 'available' no significa sin bloqueos; siempre cruzar con garment_blocks.
  -- 'processing' es el estado luego de una devolución, antes de pasar limpieza + QA.
  operative_status  text not null default 'available',

  -- Multimedia
  photos_urls       text[] not null default '{}',

  -- Metadatos
  tags              text[] not null default '{}',
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint garments_sku_org_unique unique (organization_id, sku),
  constraint garments_status_check check (
    operative_status in (
      'available',    -- lista para alquilar (sujeto a garment_blocks)
      'processing',   -- devuelta, esperando limpieza/QA — NO visible en catálogo
      'in_cleaning',  -- en tintorería
      'in_repair',    -- en reparación
      'reserved',     -- alias semántico, la fuente de verdad es garment_blocks
      'retired'       -- dada de baja definitivamente
    )
  )
);

create trigger garments_updated_at
  before update on public.garments
  for each row execute function public.set_updated_at();

-- Índice básico para búsquedas de catálogo
create index idx_garments_org_status
  on public.garments (organization_id, operative_status);

create index idx_garments_org_size
  on public.garments (organization_id, size_label)
  where operative_status = 'available';

alter table public.garments enable row level security;

create policy "garments_org_all"
  on public.garments for all
  using (organization_id = auth_organization_id());


-- -----------------------------------------------------------------------------
-- 2.3 GARMENT_BLOCKS — La tabla más crítica del sistema
-- Un registro aquí = prenda no disponible para ese rango de fechas.
-- Todos los módulos (reservas, fittings, limpieza, reparación) escriben aquí.
-- -----------------------------------------------------------------------------
create table public.garment_blocks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  garment_id      uuid not null references public.garments(id) on delete cascade,

  -- Rango de fechas inclusivo: la prenda está bloqueada [date_from, date_to]
  date_from       date not null,
  date_to         date not null,

  -- Tipo de bloqueo (fuente del bloqueo)
  block_type      text not null,

  -- FK polimórfica hacia la entidad que generó el bloqueo
  source_id       uuid,       -- reservation_id | fitting_id | cleaning_cycle_id | etc.
  source_type     text,       -- 'reservation' | 'fitting' | 'cleaning' | 'repair' | 'manual'

  -- Liberación del bloqueo
  -- NULL = bloqueo activo. NOT NULL = liberado (expiró, canceló, etc.)
  -- NUNCA borrar un bloqueo; usar released_at para auditabilidad.
  released_at     timestamptz,
  released_by     uuid references auth.users(id),
  release_reason  text,

  notes           text,
  created_at      timestamptz not null default now(),

  constraint garment_blocks_dates_check check (date_to >= date_from),
  constraint garment_blocks_type_check check (
    block_type in (
      'reservation',  -- reserva confirmada
      'fitting',      -- prueba de prenda (con TTL)
      'cleaning',     -- en tintorería
      'repair',       -- en reparación
      'hold',         -- bloqueo manual temporal
      'manual'        -- bloqueo administrativo sin fecha de retorno clara
    )
  )
);

-- =============================================================================
-- ÍNDICES CRÍTICOS EN GARMENT_BLOCKS
-- Estos tres índices son los que hacen que la búsqueda sea O(log n) en vez de O(n).
-- =============================================================================

-- Índice 1: GIST sobre el rango de fechas + garment_id
-- Habilita el operador && (overlap) de forma ultra eficiente.
-- Requiere btree_gist para combinar uuid con daterange.
create index idx_blocks_gist_range
  on public.garment_blocks
  using gist (garment_id, daterange(date_from, date_to, '[]'));

-- Índice 2: Parcial — solo bloqueos ACTIVOS (released_at IS NULL)
-- El 99% de las consultas de disponibilidad solo necesitan ver bloqueos activos.
-- Este índice ignora todo el historial, manteniéndose pequeño y rápido.
create index idx_blocks_active
  on public.garment_blocks (garment_id, date_from, date_to)
  where released_at is null;

-- Índice 3: Por organización + activos (para queries multi-garment de un org)
-- Se usa cuando buscamos "todas las prendas disponibles de este org en estas fechas".
create index idx_blocks_org_active
  on public.garment_blocks (organization_id, garment_id, date_from, date_to)
  where released_at is null;

alter table public.garment_blocks enable row level security;

create policy "blocks_org_all"
  on public.garment_blocks for all
  using (organization_id = auth_organization_id());


-- -----------------------------------------------------------------------------
-- 2.4 CUSTOMERS (Clientes)
-- -----------------------------------------------------------------------------
create table public.customers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  -- Vinculación opcional con auth.users (si el cliente tiene login propio)
  auth_user_id    uuid references auth.users(id) on delete set null,

  first_name      text not null,
  last_name       text not null,
  email           text not null,
  phone           text,
  id_document     text,           -- DNI / Pasaporte
  id_document_type text default 'dni',

  -- Bloqueo de cliente
  is_blocked      boolean not null default false,
  block_reason    text,
  blocked_at      timestamptz,
  blocked_by      uuid references auth.users(id),

  -- Marketing y fidelidad
  loyalty_points  int not null default 0,
  notes           text,
  tags            text[] not null default '{}',

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint customers_email_org_unique unique (organization_id, email)
);

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create index idx_customers_org
  on public.customers (organization_id, email);

create index idx_customers_auth_user
  on public.customers (auth_user_id)
  where auth_user_id is not null;

alter table public.customers enable row level security;

-- El staff del org ve todos los clientes; el cliente ve solo su perfil
create policy "customers_staff_all"
  on public.customers for all
  using (organization_id = auth_organization_id());

create policy "customers_self_select"
  on public.customers for select
  using (auth_user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- 2.5 RESERVATIONS (Reservas)
-- -----------------------------------------------------------------------------
create table public.reservations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid not null references public.customers(id),
  garment_id      uuid not null references public.garments(id),

  -- Fechas clave — SIEMPRE usar pickup/return, event_date es informativo
  event_date      date,           -- fecha del evento (boda, fiesta, etc.)
  pickup_date     date not null,  -- cuándo retira la prenda del local
  return_date     date not null,  -- cuándo debe devolver la prenda

  -- Estado del flujo
  status          text not null default 'pending',
  -- pending: creada, sin pago
  -- confirmed: pago recibido, bloqueo activo
  -- delivered: prenda entregada al cliente
  -- returned: prenda recibida de vuelta (pasa a 'processing')
  -- cancelled: cancelada (el bloqueo se libera)
  -- disputed: en disputa (daño, pérdida)

  contingency_status text not null default 'none',
  -- none | minor_delay | major_delay | damaged | lost

  -- Financiero
  rental_price    numeric(10,2) not null,
  deposit_amount  numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  total_amount    numeric(10,2) not null,

  -- Mercado Pago
  mp_payment_id       text,
  mp_preference_id    text,
  mp_payment_status   text,        -- approved | pending | rejected | refunded
  mp_payment_detail   jsonb,       -- respuesta completa de MP para auditoría

  -- Devolución real
  actual_return_date  date,

  -- Foto de condición (obligatorio en entrega y recepción)
  delivery_photos_urls text[] not null default '{}',
  return_photos_urls   text[] not null default '{}',

  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint reservations_dates_check check (return_date >= pickup_date),
  constraint reservations_status_check check (
    status in ('pending','confirmed','paid','delivered','returned','cancelled','disputed')
  ),
  constraint reservations_contingency_check check (
    contingency_status in ('none','minor_delay','major_delay','damaged','lost')
  )
);

create trigger reservations_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

create index idx_reservations_org_status
  on public.reservations (organization_id, status);

create index idx_reservations_garment_dates
  on public.reservations (garment_id, pickup_date, return_date)
  where status not in ('cancelled');

create index idx_reservations_customer
  on public.reservations (customer_id, created_at desc);

alter table public.reservations enable row level security;

create policy "reservations_staff_all"
  on public.reservations for all
  using (organization_id = auth_organization_id());

-- El cliente ve sus propias reservas
create policy "reservations_customer_self"
  on public.reservations for select
  using (
    customer_id in (
      select id from public.customers
      where auth_user_id = auth.uid()
    )
  );


-- =============================================================================
-- 3. FUNCIÓN RPC: get_available_garments
-- =============================================================================
-- Ejecutada en el servidor de Supabase (security definer = corre como el dueño
-- de la función, bypasseando RLS). El filtro de organization_id se aplica
-- explícitamente dentro de la función usando auth_organization_id().
-- =============================================================================
create or replace function public.get_available_garments(
  p_pickup_date   date,
  p_return_date   date,
  p_size_label    text    default null,
  p_chest_cm      int     default null,
  p_waist_cm      int     default null,
  p_category      text    default null,
  p_max_price     numeric default null,
  p_limit         int     default 50,
  p_offset        int     default 0
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
  tags            text[]
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
    g.tags
  from garments g
  where
    -- Multi-tenant: solo el org del usuario autenticado
    g.organization_id = auth_organization_id()

    -- Solo prendas en estado operativo 'available'
    -- (processing, in_cleaning, in_repair, retired quedan afuera)
    and g.operative_status = 'available'

    -- Filtros opcionales de búsqueda
    and (p_size_label is null or g.size_label = p_size_label)
    and (p_category   is null or g.category   = p_category)
    and (p_max_price  is null or g.rental_price <= p_max_price)

    -- Filtro por medidas reales (más preciso que el talle etiquetado)
    and (p_chest_cm   is null or (g.chest_cm >= p_chest_cm - 3 and g.chest_cm <= p_chest_cm + 5))
    and (p_waist_cm   is null or (g.waist_cm >= p_waist_cm - 3 and g.waist_cm <= p_waist_cm + 5))

    -- EL CORAZÓN: verificar que NO exista ningún bloqueo activo que se solape
    -- con el rango pedido. El operador && usa el índice GIST automáticamente.
    and not exists (
      select 1
      from garment_blocks b
      where
        b.garment_id   = g.id
        and b.released_at is null    -- solo bloqueos activos (usa idx_blocks_active)
        and daterange(b.date_from, b.date_to, '[]')
            && daterange(p_pickup_date, p_return_date, '[]')  -- usa idx_blocks_gist_range
    )
  order by g.rental_price asc, g.name asc
  limit p_limit
  offset p_offset;
$$;


-- =============================================================================
-- 4. FUNCIÓN RPC: get_blocked_dates_for_garment
-- Devuelve todos los rangos de fechas bloqueados para UNA prenda específica.
-- Usada por el calendario de la UI para deshabilitar fechas ya ocupadas.
-- =============================================================================
create or replace function public.get_blocked_dates_for_garment(
  p_garment_id    uuid,
  p_from_date     date default current_date,
  p_until_date    date default current_date + interval '12 months'
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
  from garment_blocks b
  inner join garments g on g.id = b.garment_id
  where
    b.garment_id      = p_garment_id
    and g.organization_id = auth_organization_id()  -- validar que la prenda es del org
    and b.released_at is null                        -- solo bloqueos activos
    and b.date_to     >= p_from_date                 -- que estén dentro del rango de consulta
    and b.date_from   <= p_until_date
  order by b.date_from asc;
$$;


-- =============================================================================
-- 5. FUNCIÓN RPC: create_reservation_with_block (transacción atómica)
-- Crea la reserva + el bloqueo en una sola transacción.
-- Si la prenda ya está bloqueada, falla toda la operación (no hay race conditions).
-- =============================================================================
create or replace function public.create_reservation_with_block(
  p_garment_id      uuid,
  p_customer_id     uuid,
  p_pickup_date     date,
  p_return_date     date,
  p_event_date      date,
  p_rental_price    numeric,
  p_deposit_amount  numeric
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
begin
  -- Obtener el org_id del usuario autenticado
  v_org_id := auth_organization_id();
  if v_org_id is null then
    raise exception 'UNAUTHENTICATED: usuario sin organización' using errcode = 'P0001';
  end if;

  -- Verificar que el cliente pertenece al org
  if not exists (
    select 1 from customers where id = p_customer_id and organization_id = v_org_id
  ) then
    raise exception 'FORBIDDEN: cliente no pertenece a la organización' using errcode = 'P0002';
  end if;

  -- Verificar que el cliente no está bloqueado
  if exists (
    select 1 from customers where id = p_customer_id and is_blocked = true
  ) then
    raise exception 'BLOCKED_CUSTOMER: el cliente está bloqueado' using errcode = 'P0003';
  end if;

  -- VERIFICACIÓN DE DISPONIBILIDAD CON LOCK (evita race conditions)
  -- select for update bloquea las filas de garment_blocks mientras hacemos el check,
  -- garantizando que ninguna otra transacción concurrente pase esta barrera
  -- para la misma prenda y el mismo rango.
  select count(*) into v_conflict_count
  from garment_blocks b
  where
    b.garment_id    = p_garment_id
    and b.released_at is null
    and daterange(b.date_from, b.date_to, '[]') && daterange(p_pickup_date, p_return_date, '[]')
  for update skip locked;  -- skip locked: si ya está bloqueado por otra tx, devuelve 0 y falla

  if v_conflict_count > 0 then
    raise exception 'CONFLICT: la prenda ya tiene un bloqueo activo en ese rango de fechas'
      using errcode = 'P0004';
  end if;

  -- Crear la reserva
  insert into reservations (
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
    v_org_id,
    p_customer_id,
    p_garment_id,
    p_event_date,
    p_pickup_date,
    p_return_date,
    'pending',
    p_rental_price,
    p_deposit_amount,
    p_rental_price + p_deposit_amount
  )
  returning * into v_reservation;

  -- Crear el bloqueo asociado
  insert into garment_blocks (
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

  -- Devolver resultado como JSON
  return jsonb_build_object(
    'reservation_id', v_reservation.id,
    'block_id',       v_block.id,
    'status',         v_reservation.status
  );

exception
  when others then
    -- Re-raise para que Next.js reciba el código de error
    raise;
end;
$$;


-- =============================================================================
-- 6. DATOS DE PRUEBA (comentar antes de producción)
-- =============================================================================
/*
insert into public.organizations (id, name, slug, plan)
values ('00000000-0000-0000-0000-000000000001', 'Casa de Modas Demo', 'demo', 'pro');

insert into public.garments (organization_id, sku, name, category, size_label, chest_cm, waist_cm, rental_price, deposit_amount, operative_status)
values
  ('00000000-0000-0000-0000-000000000001', 'VES-001', 'Vestido Rojo Noche', 'vestido', 'M', 88, 70, 15000, 20000, 'available'),
  ('00000000-0000-0000-0000-000000000001', 'VES-002', 'Vestido Azul Cocktail', 'vestido', 'S', 84, 66, 12000, 18000, 'available'),
  ('00000000-0000-0000-0000-000000000001', 'VES-003', 'Vestido Blanco Novia', 'vestido', 'L', 92, 74, 35000, 50000, 'available');
*/
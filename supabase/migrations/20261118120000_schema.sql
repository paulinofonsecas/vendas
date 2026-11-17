-- Vendaz · core schema
-- Convencoes: dinheiro numeric(12,2) em AOA, segredos nunca em texto claro.

create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;

create type public.product_type as enum ('profile', 'fx', 'design', 'digital');
create type public.order_status as enum ('pending_payment', 'confirmed', 'delivered', 'cancelled');
create type public.payment_method as enum ('transfer', 'cash');
create type public.proof_status as enum ('pending', 'accepted', 'rejected');
create type public.inventory_status as enum ('available', 'assigned', 'expired', 'revoked');

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create sequence public.order_code_seq start 1;

create or replace function private.assign_order_code()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.code is null or new.code = '' then
    new.code := 'VD-' || to_char(now() at time zone 'Africa/Luanda', 'YYYY')
              || '-' || lpad(nextval('public.order_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- catalogo
-- ---------------------------------------------------------------------------

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  type        public.product_type not null,
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  price       numeric(12,2) not null default 0 check (price >= 0),
  currency    text not null default 'AOA',
  config      jsonb not null default '{}'::jsonb,
  active      boolean not null default true,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index products_type_active_idx on public.products (type, active, sort);
create trigger products_touch before update on public.products
  for each row execute function private.touch_updated_at();

create table public.fx_rates (
  id         uuid primary key default gen_random_uuid(),
  base       text not null default 'USD',
  quote      text not null default 'AOA',
  buy        numeric(14,4) not null check (buy > 0),
  sell       numeric(14,4) not null check (sell > 0),
  source     text not null default 'manual',
  active     boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (base, quote)
);

-- perfis com credenciais cifradas (AES-256-GCM, chave so no servidor)
create table public.inventory_items (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id) on delete cascade,
  label             text not null default '',
  secret_ciphertext text not null,
  status            public.inventory_status not null default 'available',
  order_item_id     uuid,
  assigned_at       timestamptz,
  expires_at        timestamptz,
  warranty_until    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index inventory_available_idx on public.inventory_items (product_id, status);
create index inventory_order_item_idx on public.inventory_items (order_item_id);
create trigger inventory_touch before update on public.inventory_items
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- clientes e pedidos
-- ---------------------------------------------------------------------------

create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  whatsapp   text not null,
  email      text,
  created_at timestamptz not null default now()
);
create index customers_whatsapp_idx on public.customers (whatsapp);

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  customer_id    uuid not null references public.customers(id) on delete restrict,
  status         public.order_status not null default 'pending_payment',
  payment_method public.payment_method not null,
  subtotal       numeric(12,2) not null default 0 check (subtotal >= 0),
  delivery_fee   numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total          numeric(12,2) not null default 0 check (total >= 0),
  currency       text not null default 'AOA',
  payload        jsonb not null default '{}'::jsonb,
  internal_notes text,
  confirmed_at   timestamptz,
  delivered_at   timestamptz,
  cancelled_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_customer_idx on public.orders (customer_id);
create trigger orders_assign_code before insert on public.orders
  for each row execute function private.assign_order_code();
create trigger orders_touch before update on public.orders
  for each row execute function private.touch_updated_at();

create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  product_id     uuid not null references public.products(id) on delete restrict,
  description    text not null default '',
  qty            integer not null default 1 check (qty > 0),
  unit_price     numeric(12,2) not null check (unit_price >= 0),
  total          numeric(12,2) not null check (total >= 0),
  payload        jsonb not null default '{}'::jsonb,
  warranty_until timestamptz,
  created_at     timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);

alter table public.inventory_items
  add constraint inventory_items_order_item_fk
  foreign key (order_item_id) references public.order_items(id) on delete set null;

create table public.payment_proofs (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  file_path   text not null,
  mime        text,
  size_bytes  integer,
  status      public.proof_status not null default 'pending',
  note        text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);
create index payment_proofs_order_idx on public.payment_proofs (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- operacao
-- ---------------------------------------------------------------------------

create table public.order_events (
  id         bigserial primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  actor      text not null,
  event      text not null,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at desc);

create table public.outbox (
  id         bigserial primary key,
  order_id   uuid references public.orders(id) on delete set null,
  event      text not null,
  channel    text not null default 'whatsapp',
  payload    jsonb not null default '{}'::jsonb,
  sent_at    timestamptz,
  attempts   integer not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);
create index outbox_pending_idx on public.outbox (sent_at) where sent_at is null;

create table public.settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  is_public  boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.admins (
  email      text primary key check (email = lower(email)),
  name       text,
  created_at timestamptz not null default now()
);

-- contadores de rate limit do checkout anonimo (so service role escreve)
create table public.rate_limits (
  id           text primary key,
  hits         integer not null default 0,
  window_start timestamptz not null default now()
);

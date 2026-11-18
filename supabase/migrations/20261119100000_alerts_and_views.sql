-- Vendaz · etiquetas de alerta, preço promocional e contagem de acessos

-- ---------------------------------------------------------------------------
-- preço antes da promoção (mostra "-X%" quando preenchido)
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists compare_at_price numeric(12,2);

alter table public.products
  drop constraint if exists products_compare_at_price_check;

alter table public.products
  add constraint products_compare_at_price_check
  check (compare_at_price is null or compare_at_price >= 0);

grant select (compare_at_price) on public.products to anon;

-- ---------------------------------------------------------------------------
-- acessos por produto/dia (só service role escreve)
-- ---------------------------------------------------------------------------

create table if not exists public.product_views (
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_on  date not null default ((now() at time zone 'Africa/Luanda')::date),
  views      integer not null default 0 check (views >= 0),
  primary key (product_id, viewed_on)
);

create index if not exists product_views_recent_idx on public.product_views (viewed_on desc);

alter table public.product_views enable row level security;

revoke all on public.product_views from anon, authenticated;

create or replace function public.register_product_view(p_product_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.product_views (product_id, viewed_on, views)
  values (p_product_id, (now() at time zone 'Africa/Luanda')::date, 1)
  on conflict (product_id, viewed_on)
  do update set views = public.product_views.views + 1;
$$;

revoke all on function public.register_product_view(uuid) from public, anon, authenticated;
grant execute on function public.register_product_view(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- produto mais acessado (cacheado na app; aqui é só a query)
-- ---------------------------------------------------------------------------

create or replace function public.top_product_id(p_days integer default 30)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select v.product_id
      from public.product_views v
      join public.products p on p.id = v.product_id
      where p.active
        and v.viewed_on >= (current_date - p_days)
      group by v.product_id
      order by sum(v.views) desc
      limit 1
    ),
    (
      select oi.product_id
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where o.created_at >= now() - interval '90 days'
      group by oi.product_id
      order by count(*) desc
      limit 1
    ),
    (
      select p.id
      from public.products p
      where p.active
      order by p.sort asc
      limit 1
    )
  );
$$;

revoke all on function public.top_product_id(integer) from public;
grant execute on function public.top_product_id(integer) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- view pública do catálogo com os campos de alerta
-- ---------------------------------------------------------------------------

drop view if exists public.catalog;

create view public.catalog
with (security_invoker = true) as
select id, type, slug, name, description, price, compare_at_price, currency, config, sort, created_at
from public.products
where active;

grant select on public.catalog to anon, authenticated;
grant select (created_at) on public.products to anon;

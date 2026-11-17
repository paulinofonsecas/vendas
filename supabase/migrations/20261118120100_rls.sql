-- Vendaz · RLS e permissoes
-- Principio: anon NAO escreve nada. O checkout passa por Server Action com service role.
-- anon le apenas: catalogo (colunas explicitas), fx_rates activas, settings publicas.

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_staff() to anon, authenticated;

alter table public.products        enable row level security;
alter table public.fx_rates        enable row level security;
alter table public.inventory_items enable row level security;
alter table public.customers       enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.payment_proofs  enable row level security;
alter table public.order_events    enable row level security;
alter table public.outbox          enable row level security;
alter table public.settings        enable row level security;
alter table public.admins          enable row level security;
alter table public.rate_limits     enable row level security;

-- ---------------------------------------------------------------------------
-- privilegios: apaga os defaults do Supabase e volta a conceder o minimo
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select (id, type, slug, name, description, price, currency, config, active, sort)
  on public.products to anon;
grant select on public.fx_rates to anon;
grant select on public.settings to anon;

grant select, insert, update, delete on public.products, public.fx_rates, public.inventory_items,
  public.customers, public.orders, public.order_items, public.payment_proofs, public.order_events
  to authenticated;
grant select, update on public.outbox to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant select on public.admins to authenticated;
grant usage on sequence public.order_code_seq to authenticated;
grant usage on sequence public.order_events_id_seq to authenticated;
grant usage on sequence public.outbox_id_seq to authenticated;

-- rate_limits: ninguem, so service role

-- ---------------------------------------------------------------------------
-- politicas de leitura publica
-- ---------------------------------------------------------------------------

create policy products_public_read on public.products
  for select to anon using (active);

create policy products_staff_read on public.products
  for select to authenticated using (active or private.is_staff());

create policy products_staff_write on public.products
  for insert to authenticated with check (private.is_staff());

create policy products_staff_update on public.products
  for update to authenticated using (private.is_staff()) with check (private.is_staff());

create policy products_staff_delete on public.products
  for delete to authenticated using (private.is_staff());

create policy fx_rates_public_read on public.fx_rates
  for select to anon using (active);

create policy fx_rates_staff_all on public.fx_rates
  for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy settings_public_read on public.settings
  for select to anon using (is_public);

create policy settings_staff_all on public.settings
  for all to authenticated using (private.is_staff()) with check (private.is_staff());

-- ---------------------------------------------------------------------------
-- politicas de staff (nada para anon: sem policy = negado)
-- ---------------------------------------------------------------------------

create policy inventory_staff_all on public.inventory_items
  for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy customers_staff_all on public.customers
  for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy orders_staff_all on public.orders
  for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy order_items_staff_all on public.order_items
  for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy payment_proofs_staff_all on public.payment_proofs
  for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy order_events_staff_all on public.order_events
  for all to authenticated using (private.is_staff()) with check (private.is_staff());

create policy outbox_staff_read on public.outbox
  for select to authenticated using (private.is_staff());

create policy outbox_staff_update on public.outbox
  for update to authenticated using (private.is_staff()) with check (private.is_staff());

create policy admins_staff_read on public.admins
  for select to authenticated using (private.is_staff());

-- ---------------------------------------------------------------------------
-- view publica do catalogo (colunas explicitas, RLS do invocador)
-- ---------------------------------------------------------------------------

create or replace view public.catalog
with (security_invoker = true) as
select id, type, slug, name, description, price, currency, config, sort
from public.products
where active;

grant select on public.catalog to anon, authenticated;

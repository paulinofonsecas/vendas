-- Vendaz · banners geridos em tabela, auditoria e telemetria de interacções

-- ---------------------------------------------------------------------------
-- banners (substitui o array em settings.banners)
-- ---------------------------------------------------------------------------

create table if not exists public.banners (
  id         uuid primary key default gen_random_uuid(),
  image      text not null,
  title      text not null default '',
  subtitle   text not null default '',
  cta        text not null default '',
  href       text not null default '/#catalogo',
  sort       integer not null default 0,
  active     boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banners_active_idx on public.banners (active, sort);

drop trigger if exists banners_touch on public.banners;
create trigger banners_touch before update on public.banners
  for each row execute function private.touch_updated_at();

alter table public.banners enable row level security;

revoke all on public.banners from anon, authenticated;
grant select (id, image, title, subtitle, cta, href, sort) on public.banners to anon;
grant select, insert, update, delete on public.banners to authenticated;

drop policy if exists banners_public_read on public.banners;
create policy banners_public_read on public.banners
  for select to anon
  using (
    active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists banners_staff_all on public.banners;
create policy banners_staff_all on public.banners
  for all to authenticated using (private.is_staff()) with check (private.is_staff());

-- migra o que estava em settings.banners (uma vez)
insert into public.banners (image, title, subtitle, cta, href, sort)
select
  entry->>'image',
  coalesce(entry->>'title', ''),
  coalesce(entry->>'subtitle', ''),
  coalesce(entry->>'cta', ''),
  coalesce(entry->>'href', '/#catalogo'),
  (ordinality - 1) * 10
from public.settings s,
     jsonb_array_elements(s.value) with ordinality as t(entry, ordinality)
where s.key = 'banners'
  and coalesce(entry->>'image', '') <> ''
  and not exists (select 1 from public.banners);

delete from public.settings where key = 'banners';

-- ---------------------------------------------------------------------------
-- auditoria de acções do admin
-- ---------------------------------------------------------------------------

create table if not exists public.audit_log (
  id         bigserial primary key,
  actor      text not null,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  diff       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

drop policy if exists audit_log_staff_read on public.audit_log;
create policy audit_log_staff_read on public.audit_log
  for select to authenticated using (private.is_staff());

-- ---------------------------------------------------------------------------
-- telemetria
-- ---------------------------------------------------------------------------

create table if not exists public.analytics_events (
  id         bigserial primary key,
  name       text not null,
  path       text not null default '',
  product_id uuid references public.products(id) on delete set null,
  session_id text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx on public.analytics_events (name, created_at desc);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_product_idx on public.analytics_events (product_id, created_at desc);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
grant select on public.analytics_events to authenticated;

drop policy if exists analytics_staff_read on public.analytics_events;
create policy analytics_staff_read on public.analytics_events
  for select to authenticated using (private.is_staff());

-- configuração: que eventos são medidos (só o servidor lê)
insert into public.settings (key, value, is_public) values
  ('analytics', '{
    "enabled": true,
    "events": {
      "page_view": {"label": "Visitas a páginas", "enabled": true},
      "product_view": {"label": "Produto visto", "enabled": true},
      "search": {"label": "Pesquisas", "enabled": true},
      "banner_click": {"label": "Clique em banner", "enabled": true},
      "share_click": {"label": "Clique em partilhar", "enabled": true},
      "checkout_start": {"label": "Checkout iniciado", "enabled": true},
      "order_created": {"label": "Pedido criado", "enabled": true},
      "proof_uploaded": {"label": "Comprovativo enviado", "enabled": true}
    }
  }'::jsonb, false)
on conflict (key) do nothing;

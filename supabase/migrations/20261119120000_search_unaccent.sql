-- Vendaz · pesquisa sem sensibilidade a maiúsculas nem acentos
-- unaccent + lower: "CÂMBIO", "cambio" e "Câmbio" devolvem o mesmo resultado.

create extension if not exists unaccent with schema extensions;

create or replace function public.search_catalog(p_term text, p_limit integer default 12)
returns setof public.catalog
language sql
stable
set search_path = ''
as $$
  select c.*
  from public.catalog c
  where extensions.unaccent(lower(c.name)) like
        '%' || extensions.unaccent(lower(coalesce(p_term, ''))) || '%'
     or extensions.unaccent(lower(c.description)) like
        '%' || extensions.unaccent(lower(coalesce(p_term, ''))) || '%'
  order by c.sort asc
  limit greatest(1, least(coalesce(p_limit, 12), 50));
$$;

revoke all on function public.search_catalog(text, integer) from public;
grant execute on function public.search_catalog(text, integer) to anon, authenticated;

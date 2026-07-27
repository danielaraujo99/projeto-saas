-- MenuAltas — extensão da tabela restaurants para configurações completas.
-- Rode uma vez no seu Supabase (SQL Editor).

alter table public.restaurants
  add column if not exists description text,
  add column if not exists address text,
  add column if not exists category text,
  add column if not exists logo_url text,
  add column if not exists cover_url text,
  add column if not exists settings jsonb not null default '{}'::jsonb;

-- Grants (idempotente)
grant select, update on public.restaurants to authenticated;
grant select on public.restaurants to anon;

-- MenuAltas — Garçons, Mesas e Comandas (Salão)
-- Rode uma vez no seu Supabase (SQL Editor).

-- Garçons
create table if not exists public.waiters (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  pin text not null,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, pin)
);

grant select, insert, update, delete on public.waiters to authenticated;
grant all on public.waiters to service_role;
alter table public.waiters enable row level security;

drop policy if exists "waiters_member_read" on public.waiters;
create policy "waiters_member_read" on public.waiters for select to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id));
drop policy if exists "waiters_admin_write" on public.waiters;
create policy "waiters_admin_write" on public.waiters for all to authenticated
  using (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'))
  with check (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'));

-- Mesas
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  number int not null,
  seats int not null default 4,
  status text not null default 'free' check (status in ('free','occupied','reserved')),
  pos_x int not null default 0,
  pos_y int not null default 0,
  waiter_id uuid references public.waiters(id) on delete set null,
  opened_at timestamptz,
  reservation_name text,
  reservation_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, number)
);

grant select, insert, update, delete on public.tables to authenticated;
grant all on public.tables to service_role;
alter table public.tables enable row level security;

drop policy if exists "tables_member_read" on public.tables;
create policy "tables_member_read" on public.tables for select to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id));
drop policy if exists "tables_member_write" on public.tables;
create policy "tables_member_write" on public.tables for all to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id))
  with check (public.is_restaurant_member(auth.uid(), restaurant_id));

-- Itens de comanda (uma mesa ocupada acumula itens)
create table if not exists public.table_order_items (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  qty int not null default 1,
  price numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.table_order_items to authenticated;
grant all on public.table_order_items to service_role;
alter table public.table_order_items enable row level security;

drop policy if exists "toi_member_all" on public.table_order_items;
create policy "toi_member_all" on public.table_order_items for all to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id))
  with check (public.is_restaurant_member(auth.uid(), restaurant_id));

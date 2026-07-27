-- MenuAltas — SQL Consolidado (Fase Final)
-- Execute uma vez no Supabase SQL Editor.
-- Adiciona: settings do restaurante, garçons, mesas, comandas,
-- categorias/produtos, estoque e cupons. É idempotente (safe re-run).

------------------------------------------------------------
-- 0) Restaurantes: colunas extras + settings
------------------------------------------------------------
alter table public.restaurants
  add column if not exists description text,
  add column if not exists address     text,
  add column if not exists category    text,
  add column if not exists logo_url    text,
  add column if not exists cover_url   text,
  add column if not exists settings    jsonb not null default '{}'::jsonb;

grant select, update on public.restaurants to authenticated;
grant select on public.restaurants to anon;

------------------------------------------------------------
-- 1) Garçons
------------------------------------------------------------
create table if not exists public.waiters (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  pin  text not null,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, pin)
);
grant select, insert, update, delete on public.waiters to authenticated;
grant all on public.waiters to service_role;
alter table public.waiters enable row level security;
drop policy if exists "waiters_member_read"  on public.waiters;
drop policy if exists "waiters_admin_write"  on public.waiters;
create policy "waiters_member_read"  on public.waiters for select to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id));
create policy "waiters_admin_write"  on public.waiters for all to authenticated
  using (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'))
  with check (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'));

------------------------------------------------------------
-- 2) Mesas
------------------------------------------------------------
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  number int not null,
  seats  int not null default 4,
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
drop policy if exists "tables_member_read"  on public.tables;
drop policy if exists "tables_member_write" on public.tables;
create policy "tables_member_read"  on public.tables for select to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id));
create policy "tables_member_write" on public.tables for all to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id))
  with check (public.is_restaurant_member(auth.uid(), restaurant_id));

------------------------------------------------------------
-- 3) Itens da comanda
------------------------------------------------------------
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

------------------------------------------------------------
-- 4) Categorias e Produtos
------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
grant select on public.categories to anon;
alter table public.categories enable row level security;
drop policy if exists "cat_public_read"  on public.categories;
drop policy if exists "cat_member_write" on public.categories;
create policy "cat_public_read" on public.categories for select using (true);
create policy "cat_member_write" on public.categories for all to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id))
  with check (public.is_restaurant_member(auth.uid(), restaurant_id));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  active boolean not null default true,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
grant select on public.products to anon;
alter table public.products enable row level security;
drop policy if exists "prod_public_read"  on public.products;
drop policy if exists "prod_member_write" on public.products;
create policy "prod_public_read" on public.products for select using (true);
create policy "prod_member_write" on public.products for all to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id))
  with check (public.is_restaurant_member(auth.uid(), restaurant_id));

------------------------------------------------------------
-- 5) Estoque
------------------------------------------------------------
create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  unit text not null default 'un',
  qty numeric(12,3) not null default 0,
  min_qty numeric(12,3) not null default 0,
  cost numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.stock_items to authenticated;
grant all on public.stock_items to service_role;
alter table public.stock_items enable row level security;
drop policy if exists "stock_member_all" on public.stock_items;
create policy "stock_member_all" on public.stock_items for all to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id))
  with check (public.is_restaurant_member(auth.uid(), restaurant_id));

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  item_id uuid not null references public.stock_items(id) on delete cascade,
  kind text not null check (kind in ('in','out','adjust')),
  qty numeric(12,3) not null,
  cost numeric(10,2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.stock_movements to authenticated;
grant all on public.stock_movements to service_role;
alter table public.stock_movements enable row level security;
drop policy if exists "stmov_member_all" on public.stock_movements;
create policy "stmov_member_all" on public.stock_movements for all to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id))
  with check (public.is_restaurant_member(auth.uid(), restaurant_id));

------------------------------------------------------------
-- 6) Cupons
------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  code text not null,
  kind text not null check (kind in ('percent','fixed')),
  value numeric(10,2) not null default 0,
  min_order numeric(10,2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, code)
);
grant select, insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
grant select on public.coupons to anon;
alter table public.coupons enable row level security;
drop policy if exists "coup_public_read"  on public.coupons;
drop policy if exists "coup_member_write" on public.coupons;
create policy "coup_public_read" on public.coupons for select using (active = true);
create policy "coup_member_write" on public.coupons for all to authenticated
  using (public.is_restaurant_member(auth.uid(), restaurant_id))
  with check (public.is_restaurant_member(auth.uid(), restaurant_id));

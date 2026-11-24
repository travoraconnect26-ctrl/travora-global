create extension if not exists pgcrypto;
create table if not exists public.user_trips(
 owner uuid not null references auth.users(id) on delete cascade,
 trip_id text not null,
 trip_data jsonb not null check(jsonb_typeof(trip_data)='object'),
 updated_at timestamptz not null default now(),
 primary key(owner,trip_id)
);
alter table public.user_trips enable row level security;
drop policy if exists "read own trips" on public.user_trips;
create policy "read own trips" on public.user_trips for select to authenticated using((select auth.uid())=owner);
drop policy if exists "insert own trips" on public.user_trips;
create policy "insert own trips" on public.user_trips for insert to authenticated with check((select auth.uid())=owner);
drop policy if exists "update own trips" on public.user_trips;
create policy "update own trips" on public.user_trips for update to authenticated using((select auth.uid())=owner) with check((select auth.uid())=owner);
drop policy if exists "delete own trips" on public.user_trips;
create policy "delete own trips" on public.user_trips for delete to authenticated using((select auth.uid())=owner);
create table if not exists public.affiliate_clicks(
 id uuid primary key default gen_random_uuid(),
 category text not null check(category in('flight','stay','car','activity')),
 destination text,source_page text,created_at timestamptz not null default now()
);
alter table public.affiliate_clicks enable row level security;
-- No client policies: only trusted server-side Edge Functions may write this table.
create table if not exists public.payments(
 id uuid primary key default gen_random_uuid(),
 owner uuid not null references auth.users(id) on delete restrict,
 stripe_session_id text not null unique,
 amount_total integer not null check(amount_total>=0),
 currency text not null,payment_status text not null,created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
drop policy if exists "read own receipts" on public.payments;
create policy "read own receipts" on public.payments for select to authenticated using((select auth.uid())=owner);
-- No client insert/update policy. Payment receipts are written only by verified webhooks.
-- ============================================================
-- SetoTrading Business Dashboard — one-time Supabase setup
-- Paste this whole file into the Supabase SQL Editor and Run.
-- Safe to re-run: everything is idempotent.
-- ============================================================

-- ---------- Business settings (seed money, business name) ----------
create table if not exists public.business_settings (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  business_name text not null default 'SetoTrading',
  seed_money  numeric(12,2) not null default 0,
  updated_at  timestamptz not null default now()
);

-- ---------- Expenses (evals, resets, data fees, software…) ----------
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  date         date not null default current_date,
  firm         text not null,
  expense_type text not null,
  outcome      text,
  amount       numeric(12,2) not null check (amount >= 0),
  notes        text,
  receipt_path text,
  receipt_name text,
  winning_days smallint,
  created_at   timestamptz not null default now()
);
create index if not exists expenses_user_date_idx on public.expenses (user_id, date desc);

-- Migration for tables created before winning_days existed. Safe to re-run.
alter table public.expenses add column if not exists winning_days smallint;

-- ---------- Payouts (gross profit) ----------
create table if not exists public.payouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  date         date not null default current_date,
  firm         text not null,
  amount       numeric(12,2) not null check (amount >= 0),
  method       text,
  status       text not null default 'Received',
  notes        text,
  receipt_path text,
  receipt_name text,
  created_at   timestamptz not null default now()
);
create index if not exists payouts_user_date_idx on public.payouts (user_id, date desc);

-- ---------- Row Level Security: each user sees only their own rows ----------
alter table public.business_settings enable row level security;
alter table public.expenses enable row level security;
alter table public.payouts enable row level security;

drop policy if exists "own settings" on public.business_settings;
create policy "own settings" on public.business_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own expenses" on public.expenses;
create policy "own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own payouts" on public.payouts;
create policy "own payouts" on public.payouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Private storage bucket for receipt PDFs / images ----------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Files live under <user_id>/<filename>; users can only touch their own folder.
drop policy if exists "receipts read own" on storage.objects;
create policy "receipts read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "receipts insert own" on storage.objects;
create policy "receipts insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "receipts update own" on storage.objects;
create policy "receipts update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "receipts delete own" on storage.objects;
create policy "receipts delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

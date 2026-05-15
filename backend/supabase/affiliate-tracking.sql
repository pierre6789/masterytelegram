-- À exécuter dans Supabase → SQL (une fois). Service role côté API : pas besoin de RLS pour le MVP.

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_code text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_affiliate_clicks_code on public.affiliate_clicks(affiliate_code);
create index if not exists idx_affiliate_clicks_created on public.affiliate_clicks(created_at desc);

create table if not exists public.affiliate_sales (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid not null references public.profiles(id) on delete cascade,
  affiliate_code text not null,
  amount_eur numeric(12,2) not null,
  commission_eur numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'validated')),
  stripe_checkout_session_id text unique,
  created_at timestamptz not null default now(),
  validated_at timestamptz
);

create index if not exists idx_affiliate_sales_user on public.affiliate_sales(affiliate_user_id);
create index if not exists idx_affiliate_sales_created on public.affiliate_sales(created_at desc);

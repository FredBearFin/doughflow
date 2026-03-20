-- Migration: create user_subscriptions
-- Manages Stripe subscription state per user.
-- All writes happen via the server-side Prisma client (service role, bypasses RLS).
-- RLS blocks accidental direct client-side reads of other users' rows.

-- ─── Enums ────────────────────────────────────────────────────────────────────

create type public.subscription_tier as enum (
  'free',
  'cottage',
  'baker',
  'artisan'
);

create type public.subscription_status as enum (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete'
);

-- ─── Table ────────────────────────────────────────────────────────────────────

create table public.user_subscriptions (
  id                     text        primary key,
  user_id                text        not null references "User"(id) on delete cascade,
  tier                   public.subscription_tier   not null default 'free',
  status                 public.subscription_status not null default 'active',
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint user_subscriptions_user_id_key unique (user_id)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Fast lookups from Stripe webhook payloads
create index user_subscriptions_stripe_customer_idx
  on public.user_subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;

create index user_subscriptions_stripe_sub_idx
  on public.user_subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

-- ─── Auto-update updated_at ───────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_subscriptions_set_updated_at
  before update on public.user_subscriptions
  for each row execute function public.set_updated_at();

-- ─── Row-Level Security ───────────────────────────────────────────────────────

alter table public.user_subscriptions enable row level security;

-- Users can read only their own subscription row.
-- auth.uid() works when using Supabase Auth JWT; with NextAuth all server writes
-- go through Prisma (service role) and bypass RLS anyway.
create policy "users_read_own_subscription"
  on public.user_subscriptions
  for select
  using (auth.uid()::text = user_id);

-- Service role (Stripe webhook handler, server-side Prisma) has full access.
create policy "service_role_manage_subscriptions"
  on public.user_subscriptions
  for all
  to service_role
  using (true)
  with check (true);

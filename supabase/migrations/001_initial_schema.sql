-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── user_profiles ───────────────────────────────────────────────────────────
create table public.user_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null,
  avatar_url      text,
  tier            text not null default 'free' check (tier in ('free','premium','pro')),
  role            text not null default 'user' check (role in ('user','planner')),
  onboarding_done boolean not null default false,
  stripe_customer_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── events ──────────────────────────────────────────────────────────────────
create table public.events (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references public.user_profiles(id) on delete cascade,
  planner_id            uuid references public.user_profiles(id),
  client_name           text,
  event_type            text not null default 'wedding',
  event_name            text not null,
  event_date            date,
  venue_name            text,
  guest_count_estimate  int,
  total_budget          numeric(12,2),
  budget_allocations    jsonb default '{}'::jsonb,
  currency              text not null default 'USD',
  is_archived           boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── checklist_templates (global seeded data) ────────────────────────────────
create table public.checklist_templates (
  id            uuid primary key default gen_random_uuid(),
  event_type    text not null,
  title         text not null,
  description   text,
  category      text not null,
  months_before int not null,
  sort_order    int not null default 0
);

-- ─── checklist_items ─────────────────────────────────────────────────────────
create table public.checklist_items (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  title         text not null,
  description   text,
  category      text,
  months_before int,
  due_date      date,
  is_completed  boolean not null default false,
  completed_at  timestamptz,
  vendor_id     uuid,
  sort_order    int not null default 0,
  is_custom     boolean not null default false,
  ai_generated  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── vendors ─────────────────────────────────────────────────────────────────
create table public.vendors (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  category        text not null,
  business_name   text not null,
  contact_name    text,
  phone           text,
  email           text,
  website         text,
  instagram       text,
  status          text not null default 'shortlisted' check (status in ('shortlisted','contacted','booked','cancelled')),
  contract_signed boolean not null default false,
  contract_url    text,
  notes           text,
  total_cost      numeric(12,2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Add FK from checklist_items to vendors now that vendors table exists
alter table public.checklist_items
  add constraint checklist_items_vendor_id_fkey
  foreign key (vendor_id) references public.vendors(id) on delete set null;

-- ─── expenses ────────────────────────────────────────────────────────────────
create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  vendor_id     uuid references public.vendors(id) on delete set null,
  category      text not null,
  description   text not null,
  amount        numeric(12,2) not null,
  expense_type  text not null default 'misc' check (expense_type in ('deposit','final_payment','misc')),
  paid_date     date not null default current_date,
  receipt_url   text,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ─── guests ──────────────────────────────────────────────────────────────────
create table public.guests (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  first_name       text not null,
  last_name        text,
  email            text,
  phone            text,
  group_tag        text,
  rsvp_status      text not null default 'no_response' check (rsvp_status in ('attending','declined','no_response','maybe')),
  rsvp_date        date,
  plus_one         boolean not null default false,
  plus_one_name    text,
  dietary_notes    text,
  table_number     int,
  invitation_sent  boolean not null default false,
  thank_you_sent   boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── ai_conversations ────────────────────────────────────────────────────────
create table public.ai_conversations (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.user_profiles(id),
  messages   jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── client_access_codes (Pro tier) ──────────────────────────────────────────
create table public.client_access_codes (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  planner_id    uuid not null references public.user_profiles(id),
  access_code   text not null unique,
  is_active     boolean not null default true,
  last_accessed timestamptz,
  created_at    timestamptz not null default now()
);

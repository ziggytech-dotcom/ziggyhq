-- Run this in Supabase SQL editor or via: supabase db push

create table if not exists public.org_integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.crm_organizations(id) on delete cascade,
  provider text not null, -- 'twilio', 'bland', 'checkr', etc.
  config jsonb not null default '{}', -- encrypted-at-rest by Supabase
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, provider)
);

alter table public.org_integrations enable row level security;

create policy "org members can read their integrations"
  on public.org_integrations for select
  using (org_id in (select org_id from public.crm_users where email = auth.email()));

create policy "org members can insert their integrations"
  on public.org_integrations for insert
  with check (org_id in (select org_id from public.crm_users where email = auth.email()));

create policy "org members can update their integrations"
  on public.org_integrations for update
  using (org_id in (select org_id from public.crm_users where email = auth.email()));

create policy "org members can delete their integrations"
  on public.org_integrations for delete
  using (org_id in (select org_id from public.crm_users where email = auth.email()));

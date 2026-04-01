create table if not exists public.zapier_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.crm_organizations(id) on delete cascade,
  event_type text not null,
  target_url text not null,
  secret text,
  created_at timestamptz default now()
);

create index if not exists zapier_subscriptions_org_event_idx
  on public.zapier_subscriptions(org_id, event_type);

alter table public.zapier_subscriptions enable row level security;

create policy "org members can manage their zapier subscriptions"
  on public.zapier_subscriptions
  using (
    org_id in (
      select org_id from public.crm_users where email = auth.jwt() ->> 'email'
    )
  );

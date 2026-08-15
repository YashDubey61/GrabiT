-- Migration 0013: Additive Operational Alerts & Notification Center Table

create table if not exists public.operational_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_key text not null,
  category text not null check (category in ('ORDERS', 'PAYMENTS', 'WEBHOOKS', 'WALLETS', 'VENDORS', 'CAMPUSES')),
  severity text not null check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  title text not null,
  description text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.users(id),
  resolved_at timestamptz,
  resolved_by uuid references public.users(id)
);

-- Indexing for alert deduplication and fast querying
create index if not exists idx_operational_alerts_key_status on public.operational_alerts(alert_key, status);
create index if not exists idx_operational_alerts_status_created on public.operational_alerts(status, created_at desc);

-- RLS Enforcement
alter table public.operational_alerts enable row level security;

-- Client Policy: Fails closed for anon/student/vendor. Read restricted to Super Admin identity.
create policy "operational_alerts_admin_read"
  on public.operational_alerts
  for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

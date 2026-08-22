-- Migration 0038: Help & Support Tickets
-- Applied live via Supabase MCP; saved here for repo parity/history.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  category text not null check (category in ('ORDERS','PAYMENTS','REFUNDS','GOLD','REWARDS','ACCOUNT','VENDOR','TECHNICAL')),
  issue_type text check (issue_type in ('ORDER_NOT_RECEIVED','WRONG_ITEM','MISSING_ITEM','QUALITY_ISSUE','PAYMENT_ISSUE','REFUND_ISSUE','OTHER')),
  subject text not null,
  description text not null,
  related_order_id uuid references public.orders(id),
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_user on public.support_tickets (user_id);
create index if not exists idx_support_tickets_status on public.support_tickets (status);

alter table public.support_tickets enable row level security;

create policy "Students view their own support tickets" on public.support_tickets
  for select using (auth.uid() = user_id);

create policy "Students create their own support tickets" on public.support_tickets
  for insert with check (auth.uid() = user_id);

create policy "Admins manage all support tickets" on public.support_tickets
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Migration 0037: GrabIt Gold Pass Cashfree Payments
-- Applied live via Supabase MCP; saved here for repo parity/history.
-- Mirrors 0033_wallet_topup_bonus.sql's structure/idempotency pattern.

create table if not exists public.gold_pass_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  plan_type text not null check (plan_type in ('MONTHLY', 'SEMESTER')),
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'INR',
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED')),
  cashfree_order_id text,
  cashfree_payment_id text,
  payment_reference text,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_gold_pass_payments_cashfree_order_id
  on public.gold_pass_payments (cashfree_order_id) where cashfree_order_id is not null;
create index if not exists idx_gold_pass_payments_user on public.gold_pass_payments (user_id);
create index if not exists idx_gold_pass_payments_status on public.gold_pass_payments (status);

alter table public.gold_pass_payments enable row level security;

create policy "Students view their own gold pass payments" on public.gold_pass_payments
  for select using (auth.uid() = user_id);

create policy "Admins manage all gold pass payments" on public.gold_pass_payments
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create or replace function public.create_gold_pass_payment_intent(
  p_user_id uuid,
  p_plan_type text,
  p_amount numeric,
  p_cashfree_order_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_plan_type not in ('MONTHLY', 'SEMESTER') then
    raise exception 'INVALID_PLAN';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  insert into public.gold_pass_payments (
    user_id, plan_type, amount, cashfree_order_id, status
  ) values (
    p_user_id, p_plan_type, p_amount, p_cashfree_order_id, 'PENDING'
  )
  returning id into v_id;

  return jsonb_build_object(
    'paymentId', v_id,
    'planType', p_plan_type,
    'amount', p_amount
  );
end;
$$;

create or replace function public.confirm_gold_pass_payment(
  p_cashfree_order_id text,
  p_cashfree_payment_id text,
  p_status text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_duration_days int;
  v_base timestamptz;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
  v_plan_enum subscription_plan;
  v_latest record;
begin
  select id, user_id, plan_type, amount, status
  into v_row
  from public.gold_pass_payments
  where cashfree_order_id = p_cashfree_order_id
  for update;

  if v_row.id is null then
    raise exception 'GOLD_PASS_PAYMENT_NOT_FOUND';
  end if;

  if v_row.status in ('PAID', 'FAILED', 'CANCELLED', 'EXPIRED') then
    return jsonb_build_object('paymentId', v_row.id, 'status', v_row.status, 'alreadyProcessed', true);
  end if;

  if p_status = 'FAILED' or p_status = 'CANCELLED' then
    update public.gold_pass_payments
    set status = p_status, cashfree_payment_id = p_cashfree_payment_id, updated_at = now()
    where id = v_row.id;
    return jsonb_build_object('paymentId', v_row.id, 'status', p_status, 'alreadyProcessed', false);
  end if;

  if p_status <> 'SUCCESS' then
    raise exception 'INVALID_STATUS';
  end if;

  v_duration_days := case when v_row.plan_type = 'MONTHLY' then 30 else 120 end;
  v_plan_enum := case when v_row.plan_type = 'MONTHLY' then 'gold_monthly' else 'gold_semester' end;

  -- Extend from the student's current active pass expiry if it hasn't
  -- lapsed yet (matches the card's "Extend Pass" UX); otherwise start now.
  select renews_at, status into v_latest
  from public.subscriptions
  where user_id = v_row.user_id
  order by renews_at desc
  limit 1;

  if v_latest.status = 'active' and v_latest.renews_at is not null and v_latest.renews_at > now() then
    v_base := v_latest.renews_at;
  else
    v_base := now();
  end if;

  v_starts_at := now();
  v_expires_at := v_base + (v_duration_days || ' days')::interval;

  insert into public.subscriptions (user_id, plan, status, renews_at)
  values (v_row.user_id, v_plan_enum, 'active', v_expires_at);

  update public.gold_pass_payments
  set status = 'PAID',
      cashfree_payment_id = p_cashfree_payment_id,
      payment_reference = p_cashfree_payment_id,
      starts_at = v_starts_at,
      expires_at = v_expires_at,
      updated_at = now()
  where id = v_row.id;

  return jsonb_build_object(
    'paymentId', v_row.id,
    'status', 'PAID',
    'alreadyProcessed', false,
    'userId', v_row.user_id,
    'planType', v_row.plan_type,
    'expiresAt', v_expires_at
  );
end;
$$;

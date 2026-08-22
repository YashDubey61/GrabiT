-- Migration 0033: Wallet Top-Up & 10% Bonus (>= ₹500 top-ups)
-- Applied live via Supabase MCP; saved here for repo parity/history.

create table if not exists public.wallet_topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  topup_amount numeric(10, 2) not null check (topup_amount > 0),
  bonus_amount numeric(10, 2) not null default 0 check (bonus_amount >= 0),
  total_wallet_credit numeric(10, 2) not null,
  payment_reference text,
  cashfree_order_id text,
  cashfree_payment_id text,
  status text not null default 'PENDING' check (status in ('PENDING', 'SUCCESS', 'FAILED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_wallet_topups_cashfree_order_id
  on public.wallet_topups (cashfree_order_id) where cashfree_order_id is not null;
create index if not exists idx_wallet_topups_user on public.wallet_topups (user_id);
create index if not exists idx_wallet_topups_status on public.wallet_topups (status);

alter table public.wallet_topups enable row level security;

create policy "Students view their own wallet topups" on public.wallet_topups
  for select using (auth.uid() = user_id);

create policy "Admins manage all wallet topups" on public.wallet_topups
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create or replace function public.create_wallet_topup_intent(
  p_user_id uuid,
  p_topup_amount numeric,
  p_cashfree_order_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bonus numeric;
  v_total numeric;
  v_id uuid;
begin
  if p_topup_amount is null or p_topup_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  v_bonus := case when p_topup_amount >= 500 then round(p_topup_amount * 0.10, 2) else 0 end;
  v_total := p_topup_amount + v_bonus;

  insert into public.wallet_topups (
    user_id, topup_amount, bonus_amount, total_wallet_credit, cashfree_order_id, status
  ) values (
    p_user_id, p_topup_amount, v_bonus, v_total, p_cashfree_order_id, 'PENDING'
  )
  returning id into v_id;

  return jsonb_build_object(
    'topupId', v_id,
    'topupAmount', p_topup_amount,
    'bonusAmount', v_bonus,
    'totalWalletCredit', v_total
  );
end;
$$;

create or replace function public.confirm_wallet_topup(
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
  v_wallet_id uuid;
  v_new_balance numeric;
begin
  select id, user_id, topup_amount, bonus_amount, total_wallet_credit, status
  into v_row
  from public.wallet_topups
  where cashfree_order_id = p_cashfree_order_id
  for update;

  if v_row.id is null then
    raise exception 'TOPUP_NOT_FOUND';
  end if;

  if v_row.status in ('SUCCESS', 'FAILED') then
    return jsonb_build_object('topupId', v_row.id, 'status', v_row.status, 'alreadyProcessed', true);
  end if;

  if p_status = 'FAILED' then
    update public.wallet_topups
    set status = 'FAILED', cashfree_payment_id = p_cashfree_payment_id, updated_at = now()
    where id = v_row.id;
    return jsonb_build_object('topupId', v_row.id, 'status', 'FAILED', 'alreadyProcessed', false);
  end if;

  if p_status <> 'SUCCESS' then
    raise exception 'INVALID_STATUS';
  end if;

  insert into public.wallets (user_id, balance)
  values (v_row.user_id, 0)
  on conflict (user_id) do nothing;

  select id into v_wallet_id from public.wallets where user_id = v_row.user_id for update;

  update public.wallets
  set balance = balance + v_row.total_wallet_credit, updated_at = now()
  where id = v_wallet_id
  returning balance into v_new_balance;

  insert into public.wallet_transactions (wallet_id, type, amount)
  values (v_wallet_id, 'topup', v_row.topup_amount);

  if v_row.bonus_amount > 0 then
    insert into public.wallet_transactions (wallet_id, type, amount)
    values (v_wallet_id, 'bonus', v_row.bonus_amount);
  end if;

  update public.wallet_topups
  set status = 'SUCCESS',
      cashfree_payment_id = p_cashfree_payment_id,
      payment_reference = p_cashfree_payment_id,
      updated_at = now()
  where id = v_row.id;

  return jsonb_build_object(
    'topupId', v_row.id,
    'status', 'SUCCESS',
    'alreadyProcessed', false,
    'newBalance', v_new_balance,
    'userId', v_row.user_id,
    'topupAmount', v_row.topup_amount,
    'bonusAmount', v_row.bonus_amount
  );
end;
$$;

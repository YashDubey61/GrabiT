-- GrabIt — Day 18.1: Wallet Security Hardening & Ledger Integrity Migration
-- Source of truth: TRD §8 Security Architecture & TRD §4 Data Model

-- 1. Remove permissive RLS update & transaction insert policies
drop policy if exists "students update own wallet" on wallets;
drop policy if exists "students insert own wallet transactions" on wallet_transactions;
drop policy if exists "students insert own wallet" on wallets;

-- 2. Restrict wallet initialization to zero balance only
create policy "students insert zero balance wallet" on wallets
  for insert with check (auth.uid() = user_id and balance = 0);

-- 3. Atomic PostgreSQL RPC function for wallet debits with row locking
create or replace function debit_student_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_order_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_wallet wallets%rowtype;
  v_new_balance numeric;
begin
  if p_amount <= 0 then
    return json_build_object('ok', false, 'error', 'Invalid debit amount');
  end if;

  -- Lock wallet row FOR UPDATE to prevent race conditions and double-spending
  select * into v_wallet
  from wallets
  where user_id = p_user_id
  for update;

  if not found then
    return json_build_object('ok', false, 'error', 'Student wallet not found');
  end if;

  if v_wallet.balance < p_amount then
    return json_build_object(
      'ok', false,
      'error', format('Insufficient wallet balance (Available: ₹%s, Required: ₹%s). Please top up your wallet.', v_wallet.balance, p_amount)
    );
  end if;

  v_new_balance := v_wallet.balance - p_amount;

  -- Deduct balance atomically
  update wallets
  set balance = v_new_balance,
      updated_at = now()
  where id = v_wallet.id;

  -- Insert transaction into append-only ledger
  insert into wallet_transactions (
    wallet_id,
    type,
    amount,
    related_order_id
  ) values (
    v_wallet.id,
    'spend',
    p_amount,
    p_order_id
  );

  return json_build_object('ok', true, 'new_balance', v_new_balance);
end;
$$;

-- Migration 0039: Rewards business rules — ₹10 spent = 1 point earned,
-- points can only be sent in multiples of 100 (min 100).
-- Applied live via Supabase MCP; saved here for repo parity/history.

-- 1) Update the seeded points config: earning divisor is now fixed at
--    ₹10/point (pointsPerRupee kept only for back-compat readability —
--    award_order_points() below no longer reads it), and the transfer
--    minimum matches the new 100-point-multiple rule.
update public.platform_settings
set value = value || jsonb_build_object('pointsPerRupee', 0.1, 'minTransfer', 100)
where key = 'points_config';

-- 2) Earning — ₹10 spent = 1 point, calculated server-side from the
--    order's authoritative total_amount. Idempotency (pre-check +
--    idempotency_key unique index) is unchanged from migration 0030;
--    hardened below with an explicit unique index on related_order_id.
create or replace function public.award_order_points(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_points integer;
  v_new_balance integer;
  v_existing_tx uuid;
begin
  select id, student_id, total_amount, status into v_order from public.orders where id = p_order_id;
  if v_order.id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status <> 'completed' then
    raise exception 'ORDER_NOT_COMPLETED';
  end if;

  select id into v_existing_tx from public.point_transactions
    where related_order_id = p_order_id and type = 'EARN' limit 1;
  if v_existing_tx is not null then
    return jsonb_build_object('alreadyAwarded', true);
  end if;

  -- Core business rule: ₹10 spent = 1 point. Uses the order's
  -- authoritative total_amount — the same qualifying amount column the
  -- rest of the rewards system already treats as the order's final
  -- amount (see 0030's award_order_points, unchanged in this respect).
  v_points := floor(v_order.total_amount / 10);

  if v_points <= 0 then
    return jsonb_build_object('awarded', 0);
  end if;

  insert into public.reward_accounts (user_id) values (v_order.student_id)
  on conflict (user_id) do nothing;

  update public.reward_accounts
  set points_balance = points_balance + v_points,
      lifetime_earned = lifetime_earned + v_points,
      updated_at = now()
  where user_id = v_order.student_id
  returning points_balance into v_new_balance;

  insert into public.point_transactions
    (user_id, type, amount, balance_after, description, related_order_id, idempotency_key)
  values
    (v_order.student_id, 'EARN', v_points, v_new_balance, 'Order points earned', p_order_id, 'order_points:' || p_order_id);

  return jsonb_build_object('awarded', v_points, 'balance', v_new_balance);
end;
$$;

-- Defense-in-depth: even if the pre-check + idempotency_key uniqueness
-- were ever bypassed, this makes a second EARN row for the same order a
-- hard constraint violation, not just an application-level convention.
create unique index if not exists idx_point_tx_earn_per_order
  on public.point_transactions (related_order_id)
  where type = 'EARN' and related_order_id is not null;

-- 3) Sending — points can only be transferred in multiples of 100
--    (minimum 100). Everything else (self-transfer check, balance check,
--    daily limit, bonus-pair logic, row locking) is unchanged from 0030.
create or replace function public.transfer_points(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_amount integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_balance integer;
  v_recipient_balance integer;
  v_config jsonb;
  v_min integer;
  v_max integer;
  v_daily_limit integer;
  v_sender_bonus_pct numeric;
  v_recipient_bonus_pct numeric;
  v_sender_bonus integer;
  v_recipient_bonus integer;
  v_today_sent integer;
  v_pair_transfers_today integer;
  v_max_bonus_pairs_per_day integer;
  v_new_sender_balance integer;
  v_new_recipient_balance integer;
  v_transfer_id uuid;
  v_lock_first uuid;
  v_lock_second uuid;
begin
  if p_sender_id = p_recipient_id then
    raise exception 'SELF_TRANSFER';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  -- Core business rule: points can only be sent in multiples of 100.
  if p_amount % 100 <> 0 then
    raise exception 'NOT_MULTIPLE_OF_100';
  end if;

  select value into v_config from public.platform_settings where key = 'points_config';
  v_min := coalesce((v_config ->> 'minTransfer')::integer, 100);
  v_max := coalesce((v_config ->> 'maxTransfer')::integer, 500);
  v_daily_limit := coalesce((v_config ->> 'dailyTransferLimit')::integer, 1000);
  v_sender_bonus_pct := coalesce((v_config ->> 'senderBonusPercent')::numeric, 10);
  v_recipient_bonus_pct := coalesce((v_config ->> 'recipientBonusPercent')::numeric, 5);
  v_max_bonus_pairs_per_day := coalesce((v_config ->> 'maxBonusTransfersPerPairPerDay')::integer, 1);

  if p_amount < v_min then
    raise exception 'BELOW_MINIMUM';
  end if;
  if p_amount > v_max then
    raise exception 'ABOVE_MAXIMUM';
  end if;

  -- Lock both accounts in a fixed order (by id) regardless of who is
  -- sender/recipient, so two concurrent transfers between the same
  -- pair can never deadlock against each other.
  v_lock_first := least(p_sender_id, p_recipient_id);
  v_lock_second := greatest(p_sender_id, p_recipient_id);
  perform 1 from public.reward_accounts where user_id = v_lock_first for update;
  perform 1 from public.reward_accounts where user_id = v_lock_second for update;

  select points_balance into v_sender_balance from public.reward_accounts where user_id = p_sender_id;
  select points_balance into v_recipient_balance from public.reward_accounts where user_id = p_recipient_id;

  if v_sender_balance is null then
    raise exception 'SENDER_ACCOUNT_NOT_FOUND';
  end if;
  if v_recipient_balance is null then
    raise exception 'RECIPIENT_ACCOUNT_NOT_FOUND';
  end if;
  if v_sender_balance < p_amount then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  select coalesce(sum(amount), 0) into v_today_sent
  from public.point_transfers
  where sender_id = p_sender_id and created_at >= date_trunc('day', now());

  if v_today_sent + p_amount > v_daily_limit then
    raise exception 'DAILY_LIMIT_EXCEEDED';
  end if;

  select count(*) into v_pair_transfers_today
  from public.point_transfers
  where sender_id = p_sender_id and recipient_id = p_recipient_id
    and created_at >= date_trunc('day', now());

  if v_pair_transfers_today < v_max_bonus_pairs_per_day then
    v_sender_bonus := floor(p_amount * v_sender_bonus_pct / 100);
    v_recipient_bonus := floor(p_amount * v_recipient_bonus_pct / 100);
  else
    v_sender_bonus := 0;
    v_recipient_bonus := 0;
  end if;

  v_new_sender_balance := v_sender_balance - p_amount + v_sender_bonus;
  v_new_recipient_balance := v_recipient_balance + p_amount + v_recipient_bonus;

  update public.reward_accounts set points_balance = v_new_sender_balance, updated_at = now()
    where user_id = p_sender_id;
  update public.reward_accounts set points_balance = v_new_recipient_balance, updated_at = now()
    where user_id = p_recipient_id;

  insert into public.point_transfers (sender_id, recipient_id, amount, sender_bonus, recipient_bonus)
  values (p_sender_id, p_recipient_id, p_amount, v_sender_bonus, v_recipient_bonus)
  returning id into v_transfer_id;

  insert into public.point_transactions (user_id, type, amount, balance_after, description, related_user_id, idempotency_key)
  values (p_sender_id, 'SEND', -p_amount, v_sender_balance - p_amount, 'Sent points', p_recipient_id, 'transfer:' || v_transfer_id || ':send');

  if v_sender_bonus > 0 then
    insert into public.point_transactions (user_id, type, amount, balance_after, description, related_user_id, idempotency_key)
    values (p_sender_id, 'GIFT_BONUS', v_sender_bonus, v_new_sender_balance, 'Gift bonus for sending points', p_recipient_id, 'transfer:' || v_transfer_id || ':sender_bonus');
  end if;

  insert into public.point_transactions (user_id, type, amount, balance_after, description, related_user_id, idempotency_key)
  values (p_recipient_id, 'RECEIVE', p_amount, v_recipient_balance + p_amount, 'Received points', p_sender_id, 'transfer:' || v_transfer_id || ':receive');

  if v_recipient_bonus > 0 then
    insert into public.point_transactions (user_id, type, amount, balance_after, description, related_user_id, idempotency_key)
    values (p_recipient_id, 'GIFT_BONUS', v_recipient_bonus, v_new_recipient_balance, 'Gift bonus for receiving points', p_sender_id, 'transfer:' || v_transfer_id || ':recipient_bonus');
  end if;

  return jsonb_build_object(
    'transferId', v_transfer_id,
    'senderBalance', v_new_sender_balance,
    'recipientBalance', v_new_recipient_balance,
    'senderBonus', v_sender_bonus,
    'recipientBonus', v_recipient_bonus
  );
end;
$$;

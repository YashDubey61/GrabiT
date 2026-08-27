-- Migration 0060: Allow transfer_points in multiples of 10 with minimum 10 points

-- 1. Update platform settings points_config minTransfer to 10
update public.platform_settings
set value = value || jsonb_build_object('minTransfer', 10)
where key = 'points_config';

-- 2. Update transfer_points function to allow multiples of 10 and min 10
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

  -- Core business rule: points can only be sent in multiples of 10.
  if p_amount % 10 <> 0 then
    raise exception 'NOT_MULTIPLE_OF_10';
  end if;

  select value into v_config from public.platform_settings where key = 'points_config';
  v_min := coalesce((v_config ->> 'minTransfer')::integer, 10);
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
  if p_sender_id < p_recipient_id then
    v_lock_first := p_sender_id;
    v_lock_second := p_recipient_id;
  else
    v_lock_first := p_recipient_id;
    v_lock_second := p_sender_id;
  end if;

  perform pg_advisory_xact_lock(
    ('x' || substr(md5(v_lock_first::text), 1, 8))::bit(32)::bigint
  );
  perform pg_advisory_xact_lock(
    ('x' || substr(md5(v_lock_second::text), 1, 8))::bit(32)::bigint
  );

  insert into public.reward_accounts (user_id, balance_points, lifetime_earned_points, lifetime_spent_points)
  values (p_sender_id, 0, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.reward_accounts (user_id, balance_points, lifetime_earned_points, lifetime_spent_points)
  values (p_recipient_id, 0, 0, 0)
  on conflict (user_id) do nothing;

  select balance_points into v_sender_balance
  from public.reward_accounts
  where user_id = p_sender_id
  for update;

  select balance_points into v_recipient_balance
  from public.reward_accounts
  where user_id = p_recipient_id
  for update;

  if v_sender_balance < p_amount then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  select coalesce(sum(amount), 0) into v_today_sent
  from public.point_transactions
  where user_id = p_sender_id
    and type = 'SEND'
    and created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata');

  if (v_today_sent + p_amount) > v_daily_limit then
    raise exception 'DAILY_LIMIT_EXCEEDED';
  end if;

  select count(*) into v_pair_transfers_today
  from public.point_transactions
  where user_id = p_sender_id
    and counterparty_id = p_recipient_id
    and type = 'SEND'
    and created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata');

  if v_pair_transfers_today < v_max_bonus_pairs_per_day then
    v_sender_bonus := floor(p_amount * (v_sender_bonus_pct / 100.0));
    v_recipient_bonus := floor(p_amount * (v_recipient_bonus_pct / 100.0));
  else
    v_sender_bonus := 0;
    v_recipient_bonus := 0;
  end if;

  v_transfer_id := gen_random_uuid();

  -- 1. Debit sender
  v_new_sender_balance := v_sender_balance - p_amount;
  update public.reward_accounts
  set balance_points = v_new_sender_balance,
      lifetime_spent_points = lifetime_spent_points + p_amount,
      updated_at = now()
  where user_id = p_sender_id;

  insert into public.point_transactions (
    user_id,
    counterparty_id,
    type,
    amount,
    balance_after,
    description,
    idempotency_key,
    metadata
  ) values (
    p_sender_id,
    p_recipient_id,
    'SEND',
    p_amount,
    v_new_sender_balance,
    'Points transfer sent',
    'send_' || v_transfer_id::text,
    jsonb_build_object('transfer_id', v_transfer_id, 'recipient_id', p_recipient_id)
  );

  -- 2. Credit recipient
  v_new_recipient_balance := v_recipient_balance + p_amount;
  update public.reward_accounts
  set balance_points = v_new_recipient_balance,
      lifetime_earned_points = lifetime_earned_points + p_amount,
      updated_at = now()
  where user_id = p_recipient_id;

  insert into public.point_transactions (
    user_id,
    counterparty_id,
    type,
    amount,
    balance_after,
    description,
    idempotency_key,
    metadata
  ) values (
    p_recipient_id,
    p_sender_id,
    'RECEIVE',
    p_amount,
    v_new_recipient_balance,
    'Points transfer received',
    'recv_' || v_transfer_id::text,
    jsonb_build_object('transfer_id', v_transfer_id, 'sender_id', p_sender_id)
  );

  -- 3. Sender bonus
  if v_sender_bonus > 0 then
    v_new_sender_balance := v_new_sender_balance + v_sender_bonus;
    update public.reward_accounts
    set balance_points = v_new_sender_balance,
        lifetime_earned_points = lifetime_earned_points + v_sender_bonus,
        updated_at = now()
    where user_id = p_sender_id;

    insert into public.point_transactions (
      user_id,
      counterparty_id,
      type,
      amount,
      balance_after,
      description,
      idempotency_key,
      metadata
    ) values (
      p_sender_id,
      p_recipient_id,
      'GIFT_BONUS',
      v_sender_bonus,
      v_new_sender_balance,
      'Sender gift bonus',
      'sndbonus_' || v_transfer_id::text,
      jsonb_build_object('transfer_id', v_transfer_id, 'percent', v_sender_bonus_pct)
    );
  end if;

  -- 4. Recipient bonus
  if v_recipient_bonus > 0 then
    v_new_recipient_balance := v_new_recipient_balance + v_recipient_bonus;
    update public.reward_accounts
    set balance_points = v_new_recipient_balance,
        lifetime_earned_points = lifetime_earned_points + v_recipient_bonus,
        updated_at = now()
    where user_id = p_recipient_id;

    insert into public.point_transactions (
      user_id,
      counterparty_id,
      type,
      amount,
      balance_after,
      description,
      idempotency_key,
      metadata
    ) values (
      p_recipient_id,
      p_sender_id,
      'GIFT_BONUS',
      v_recipient_bonus,
      v_new_recipient_balance,
      'Recipient gift bonus',
      'rcpbonus_' || v_transfer_id::text,
      jsonb_build_object('transfer_id', v_transfer_id, 'percent', v_recipient_bonus_pct)
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'transferId', v_transfer_id,
    'amount', p_amount,
    'senderBalance', v_new_sender_balance,
    'recipientBalance', v_new_recipient_balance,
    'senderBonus', v_sender_bonus,
    'recipientBonus', v_recipient_bonus
  );
end;
$$;

revoke execute on function public.transfer_points(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.transfer_points(uuid, uuid, integer) to service_role;

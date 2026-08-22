-- GRABIT Rewards & Social Points System
-- Reuses: public.users (identity/campus/role), public.orders (points
-- source + gift-food fulfillment), public.canteens/menu_items (reward
-- catalog), public.platform_settings (points/transfer config, same
-- table the delivery-charge feature already uses — no new settings
-- table), lib/notifications/student_notifications.ts (no second
-- notification system).

create table if not exists public.reward_accounts (
  user_id uuid primary key references public.users(id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  lifetime_earned integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('EARN', 'REDEEM', 'SEND', 'RECEIVE', 'GIFT_BONUS', 'ADJUST')),
  amount integer not null, -- signed: positive = credit, negative = debit
  balance_after integer not null,
  description text not null,
  related_order_id uuid references public.orders(id),
  related_user_id uuid references public.users(id),
  related_reward_id uuid,
  idempotency_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_point_tx_idempotency
  on public.point_transactions (idempotency_key) where idempotency_key is not null;
create index if not exists idx_point_tx_user on public.point_transactions (user_id, created_at desc);
create index if not exists idx_point_tx_earn_leaderboard on public.point_transactions (type, created_at) where type = 'EARN';

create table if not exists public.point_transfers (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id),
  recipient_id uuid not null references public.users(id),
  amount integer not null check (amount > 0),
  sender_bonus integer not null default 0,
  recipient_bonus integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_point_transfers_sender_day on public.point_transfers (sender_id, created_at);
create index if not exists idx_point_transfers_pair_day on public.point_transfers (sender_id, recipient_id, created_at);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  canteen_id uuid references public.canteens(id), -- null = platform-wide
  name text not null,
  description text,
  image_url text,
  points_cost integer not null check (points_cost > 0),
  reward_type text not null check (reward_type in ('FOOD_ITEM', 'DISCOUNT', 'PERK')),
  menu_item_id uuid references public.menu_items(id),
  discount_amount numeric,
  is_giftable boolean not null default true,
  is_active boolean not null default true,
  stock_remaining integer,
  max_redemptions_per_user integer,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  reward_id uuid not null references public.rewards(id),
  gifted_to_user_id uuid references public.users(id),
  order_id uuid references public.orders(id),
  points_spent integer not null,
  status text not null default 'COMPLETED' check (status in ('COMPLETED', 'CANCELLED')),
  created_at timestamptz not null default now()
);
create index if not exists idx_reward_redemptions_user on public.reward_redemptions (user_id, created_at desc);
create index if not exists idx_reward_redemptions_gift on public.reward_redemptions (gifted_to_user_id, created_at desc);

-- Gift-food orders reuse the real orders table so they flow through the
-- existing vendor kitchen/QR-pickup pipeline untouched; this just
-- records who sent the gift for attribution + notifications.
alter table public.orders add column if not exists gifted_by_id uuid references public.users(id);

alter table public.reward_accounts enable row level security;
alter table public.point_transactions enable row level security;
alter table public.point_transfers enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;

create policy "Users read own reward account" on public.reward_accounts
  for select to authenticated using (user_id = auth.uid());
create policy "Users read own point transactions" on public.point_transactions
  for select to authenticated using (user_id = auth.uid());
create policy "Users read own transfers" on public.point_transfers
  for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "Everyone reads active rewards" on public.rewards
  for select using (is_active = true);
create policy "Users read own redemptions" on public.reward_redemptions
  for select to authenticated using (user_id = auth.uid() or gifted_to_user_id = auth.uid());

-- All writes happen server-side (service role, after auth + validation
-- in the API routes) via the atomic functions below — no direct client
-- INSERT/UPDATE policies, matching this project's existing pattern for
-- money-adjacent tables (wallets, orders).

insert into public.platform_settings (key, value)
values (
  'points_config',
  jsonb_build_object(
    'pointsPerRupee', 1,
    'minTransfer', 10,
    'maxTransfer', 500,
    'dailyTransferLimit', 1000,
    'senderBonusPercent', 10,
    'recipientBonusPercent', 5,
    'maxBonusTransfersPerPairPerDay', 1
  )
)
on conflict (key) do nothing;

-- ============================================================
-- Atomic operations (Postgres functions run in one transaction —
-- any raised exception rolls back every change made so far).
-- ============================================================

create or replace function public.award_order_points(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_config jsonb;
  v_points_per_rupee numeric;
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

  select value into v_config from public.platform_settings where key = 'points_config';
  v_points_per_rupee := coalesce((v_config ->> 'pointsPerRupee')::numeric, 1);
  v_points := floor(v_order.total_amount * v_points_per_rupee);

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

create or replace function public.redeem_reward(
  p_user_id uuid,
  p_reward_id uuid,
  p_gift_to_user_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward record;
  v_balance integer;
  v_new_balance integer;
  v_redemption_id uuid;
  v_already_redeemed integer;
  v_recipient uuid;
begin
  if p_gift_to_user_id is not null and p_gift_to_user_id = p_user_id then
    raise exception 'SELF_GIFT';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id for update;
  if v_reward.id is null then
    raise exception 'REWARD_NOT_FOUND';
  end if;
  if not v_reward.is_active then
    raise exception 'REWARD_INACTIVE';
  end if;
  if v_reward.starts_at is not null and now() < v_reward.starts_at then
    raise exception 'REWARD_NOT_YET_AVAILABLE';
  end if;
  if v_reward.ends_at is not null and now() > v_reward.ends_at then
    raise exception 'REWARD_EXPIRED';
  end if;
  if p_gift_to_user_id is not null and not v_reward.is_giftable then
    raise exception 'REWARD_NOT_GIFTABLE';
  end if;
  if v_reward.stock_remaining is not null and v_reward.stock_remaining <= 0 then
    raise exception 'OUT_OF_STOCK';
  end if;

  if v_reward.max_redemptions_per_user is not null then
    select count(*) into v_already_redeemed from public.reward_redemptions
      where user_id = p_user_id and reward_id = p_reward_id and status = 'COMPLETED';
    if v_already_redeemed >= v_reward.max_redemptions_per_user then
      raise exception 'REDEMPTION_LIMIT_REACHED';
    end if;
  end if;

  perform 1 from public.reward_accounts where user_id = p_user_id for update;
  select points_balance into v_balance from public.reward_accounts where user_id = p_user_id;
  if v_balance is null or v_balance < v_reward.points_cost then
    raise exception 'INSUFFICIENT_POINTS';
  end if;

  v_new_balance := v_balance - v_reward.points_cost;
  update public.reward_accounts set points_balance = v_new_balance, updated_at = now() where user_id = p_user_id;

  if v_reward.stock_remaining is not null then
    update public.rewards set stock_remaining = stock_remaining - 1 where id = p_reward_id;
  end if;

  v_recipient := coalesce(p_gift_to_user_id, p_user_id);

  insert into public.reward_redemptions (user_id, reward_id, gifted_to_user_id, points_spent)
  values (p_user_id, p_reward_id, p_gift_to_user_id, v_reward.points_cost)
  returning id into v_redemption_id;

  insert into public.point_transactions (user_id, type, amount, balance_after, description, related_reward_id, related_user_id, idempotency_key)
  values (
    p_user_id, 'REDEEM', -v_reward.points_cost, v_new_balance,
    case when p_gift_to_user_id is not null then 'Gifted: ' || v_reward.name else 'Redeemed: ' || v_reward.name end,
    p_reward_id, p_gift_to_user_id, 'redemption:' || v_redemption_id
  );

  return jsonb_build_object(
    'redemptionId', v_redemption_id,
    'balance', v_new_balance,
    'rewardType', v_reward.reward_type,
    'menuItemId', v_reward.menu_item_id,
    'canteenId', v_reward.canteen_id,
    'rewardName', v_reward.name,
    'recipientId', v_recipient,
    'isGift', p_gift_to_user_id is not null
  );
end;
$$;

-- Seed a starter catalog so the page isn't empty on first load —
-- vendor/admin management of this table is future work per spec §17.
insert into public.rewards (name, description, points_cost, reward_type, is_giftable, image_url)
select * from (values
  ('Free Cold Coffee', 'Redeem for one Cold Coffee at any GRABIT canteen.', 250, 'FOOD_ITEM', true, null::text),
  ('Free Sandwich', 'Redeem for one Veg Sandwich.', 500, 'FOOD_ITEM', true, null::text),
  ('₹20 OFF', '₹20 off your next order.', 300, 'DISCOUNT', true, null::text),
  ('₹50 OFF', '₹50 off your next order.', 600, 'DISCOUNT', true, null::text),
  ('₹100 OFF', '₹100 off your next order.', 1000, 'DISCOUNT', false, null::text),
  ('Free Delivery', 'Waives the delivery charge on your next order.', 400, 'PERK', false, null::text)
) as seed(name, description, points_cost, reward_type, is_giftable, image_url)
where not exists (select 1 from public.rewards);

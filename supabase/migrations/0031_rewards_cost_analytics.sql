-- Rewards Cost & ROI Analytics — smallest additive schema needed.
-- Reuses: rewards, reward_redemptions, point_transactions,
-- point_transfers, orders, canteens (commission_rate as the existing
-- platform-economics proxy for contribution profit), platform_settings
-- (config, same table already used by delivery-charge + points_config),
-- product_analytics_events (existing event log — "rewards_viewed" is
-- just a new event_name value, no schema change needed there).

alter table public.rewards
  add column if not exists funding_type text not null default 'GRABIT'
    check (funding_type in ('GRABIT', 'VENDOR', 'SPONSORED', 'SHARED')),
  add column if not exists grabit_cost numeric, -- null = derive from points_cost/discount at report time
  add column if not exists vendor_cost numeric not null default 0;

create index if not exists idx_reward_redemptions_created_at on public.reward_redemptions (created_at);
create index if not exists idx_point_transactions_type_created on public.point_transactions (type, created_at);
create index if not exists idx_orders_completed_at on public.orders (completed_at) where status = 'completed';
create index if not exists idx_orders_student_completed on public.orders (student_id, completed_at) where status = 'completed';

insert into public.platform_settings (key, value)
values (
  'rewards_analytics_config',
  jsonb_build_object(
    'attributionWindowDays', 7,
    'marginThresholds', jsonb_build_object('watch', 20, 'high', 30, 'critical', 50)
  )
)
on conflict (key) do nothing;

-- ============================================================
-- Server-side aggregation — all financial math happens here, not in
-- the browser. SECURITY DEFINER + explicit admin-role check inside
-- every function (never trust the caller's claimed role).
-- ============================================================

create or replace function public.get_rewards_kpis(
  p_start timestamptz,
  p_end timestamptz,
  p_canteen_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_config jsonb;
  v_attribution_days integer;
  v_orders_count integer;
  v_points_issued integer;
  v_points_redeemed integer;
  v_points_transferred integer;
  v_points_received integer;
  v_gift_bonus_points integer;
  v_outstanding_points integer;
  v_reward_cost numeric;
  v_vendor_cost numeric;
  v_avg_contribution numeric;
  v_repeat_with_reward integer;
  v_repeat_without_reward integer;
  v_users_earned integer;
  v_users_viewed integer;
  v_users_redeemed integer;
  v_repeat_purchasers integer;
  v_incremental_contribution numeric;
  v_estimated_roi numeric;
begin
  select role into v_caller_role from public.users where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  select value into v_config from public.platform_settings where key = 'rewards_analytics_config';
  v_attribution_days := coalesce((v_config ->> 'attributionWindowDays')::integer, 7);

  -- Eligible orders in period (completed only — never counts
  -- cancelled/refunded orders as reward-eligible activity).
  select count(*) into v_orders_count
  from public.orders o
  where o.status = 'completed'
    and o.completed_at between p_start and p_end
    and (p_canteen_id is null or o.canteen_id = p_canteen_id);

  -- Points issued = EARN only. Transfers/receives/bonuses are NOT new
  -- issuance — they move or top up existing points, so counting them
  -- here would double-count the same points.
  select coalesce(sum(pt.amount), 0) into v_points_issued
  from public.point_transactions pt
  join public.orders o on o.id = pt.related_order_id
  where pt.type = 'EARN'
    and pt.created_at between p_start and p_end
    and (p_canteen_id is null or o.canteen_id = p_canteen_id);

  -- Points redeemed — read straight from reward_redemptions (the
  -- authoritative record of successful, points-debited redemptions)
  -- rather than re-deriving it from point_transactions.
  select coalesce(sum(rr.points_spent), 0) into v_points_redeemed
  from public.reward_redemptions rr
  join public.rewards rw on rw.id = rr.reward_id
  where rr.status = 'COMPLETED'
    and rr.created_at between p_start and p_end
    and (p_canteen_id is null or rw.canteen_id = p_canteen_id);

  select coalesce(sum(amount), 0) into v_points_transferred
  from public.point_transfers where created_at between p_start and p_end;

  select coalesce(sum(amount), 0) into v_points_received
  from public.point_transactions
  where type = 'RECEIVE' and created_at between p_start and p_end;

  select coalesce(sum(amount), 0) into v_gift_bonus_points
  from public.point_transactions
  where type = 'GIFT_BONUS' and created_at between p_start and p_end;

  -- Outstanding points liability = the actual current ledger balance
  -- (sum of every account's points_balance), not "issued - redeemed"
  -- for the period — that formula would ignore prior-period balances
  -- and transfer/bonus movements.
  select coalesce(sum(points_balance), 0) into v_outstanding_points from public.reward_accounts;

  -- Reward cost = actual GRABIT-funded/vendor-funded cost of completed
  -- redemptions in the period, per-reward (grabit_cost when the admin
  -- has set one; otherwise a reasoned default: DISCOUNT falls back to
  -- discount_amount, everything else falls back to 0 rather than an
  -- invented points->₹ conversion).
  select
    coalesce(sum(case when rw.funding_type in ('GRABIT', 'SHARED')
      then coalesce(rw.grabit_cost, rw.discount_amount, 0) else 0 end), 0),
    coalesce(sum(case when rw.funding_type in ('VENDOR', 'SHARED')
      then coalesce(rw.vendor_cost, 0) else 0 end), 0)
  into v_reward_cost, v_vendor_cost
  from public.reward_redemptions rr
  join public.rewards rw on rw.id = rr.reward_id
  where rr.status = 'COMPLETED'
    and rr.created_at between p_start and p_end
    and (p_canteen_id is null or rw.canteen_id = p_canteen_id);

  -- Contribution profit proxy = GRABIT's own existing platform
  -- economics (canteens.commission_rate), not an invented margin.
  select coalesce(avg(o.total_amount * c.commission_rate / 100), 0) into v_avg_contribution
  from public.orders o join public.canteens c on c.id = o.canteen_id
  where o.status = 'completed' and o.completed_at between p_start and p_end
    and (p_canteen_id is null or o.canteen_id = p_canteen_id);

  -- Reward-driven repeat orders: a completed order is "reward-driven"
  -- if the same student had a reward interaction (redemption, gift
  -- received, or points earned) within the attribution window
  -- immediately before it.
  with reward_touch as (
    select user_id, created_at from public.reward_redemptions where status = 'COMPLETED'
    union all
    select gifted_to_user_id, created_at from public.reward_redemptions
      where gifted_to_user_id is not null and status = 'COMPLETED'
  ),
  eligible_orders as (
    select o.id, o.student_id, o.completed_at
    from public.orders o
    where o.status = 'completed' and o.completed_at between p_start and p_end
      and (p_canteen_id is null or o.canteen_id = p_canteen_id)
  )
  select
    count(*) filter (where exists (
      select 1 from reward_touch rt
      where rt.user_id = eo.student_id
        and rt.created_at < eo.completed_at
        and rt.created_at >= eo.completed_at - (v_attribution_days || ' days')::interval
    )),
    count(*) filter (where not exists (
      select 1 from reward_touch rt
      where rt.user_id = eo.student_id
        and rt.created_at < eo.completed_at
        and rt.created_at >= eo.completed_at - (v_attribution_days || ' days')::interval
    ))
  into v_repeat_with_reward, v_repeat_without_reward
  from eligible_orders eo;

  -- Engagement funnel
  select count(distinct pt.user_id) into v_users_earned
  from public.point_transactions pt
  where pt.type = 'EARN' and pt.created_at between p_start and p_end;

  select count(distinct user_id) into v_users_viewed
  from public.product_analytics_events
  where event_name = 'rewards_viewed' and created_at between p_start and p_end;

  select count(distinct user_id) into v_users_redeemed
  from public.reward_redemptions
  where status = 'COMPLETED' and created_at between p_start and p_end;

  select count(distinct o.student_id) into v_repeat_purchasers
  from public.orders o
  where o.status = 'completed' and o.completed_at between p_start and p_end
    and exists (
      select 1 from public.orders o2
      where o2.student_id = o.student_id and o2.status = 'completed'
        and o2.completed_at < o.completed_at
    );

  v_incremental_contribution := v_repeat_with_reward * v_avg_contribution;
  v_estimated_roi := case when v_reward_cost > 0
    then round(((v_incremental_contribution - v_reward_cost) / v_reward_cost) * 100, 1)
    else null end;

  return jsonb_build_object(
    'ordersCount', v_orders_count,
    'pointsIssued', v_points_issued,
    'pointsRedeemed', v_points_redeemed,
    'pointsTransferred', v_points_transferred,
    'pointsReceived', v_points_received,
    'giftBonusPoints', v_gift_bonus_points,
    'outstandingPoints', v_outstanding_points,
    'rewardCostGrabit', v_reward_cost,
    'rewardCostVendor', v_vendor_cost,
    'avgContributionProfitPerOrder', round(v_avg_contribution, 2),
    'repeatOrdersWithReward', v_repeat_with_reward,
    'repeatOrdersWithoutReward', v_repeat_without_reward,
    'attributionWindowDays', v_attribution_days,
    'usersEarned', v_users_earned,
    'usersViewed', v_users_viewed,
    'usersRedeemed', v_users_redeemed,
    'repeatPurchasers', v_repeat_purchasers,
    'incrementalContribution', round(v_incremental_contribution, 2),
    'estimatedRoiPercent', v_estimated_roi
  );
end;
$$;

create or replace function public.get_reward_cost_breakdown(
  p_start timestamptz,
  p_end timestamptz,
  p_canteen_id uuid default null
) returns table (
  reward_id uuid,
  reward_name text,
  funding_type text,
  redemptions bigint,
  points_used bigint,
  customer_value numeric,
  grabit_cost numeric,
  vendor_cost numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role from public.users where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select
    rw.id,
    rw.name,
    rw.funding_type,
    count(rr.id),
    coalesce(sum(rr.points_spent), 0),
    coalesce(sum(rr.points_spent), 0)::numeric, -- customer value in points (no invented ₹ conversion)
    coalesce(sum(case when rw.funding_type in ('GRABIT', 'SHARED')
      then coalesce(rw.grabit_cost, rw.discount_amount, 0) else 0 end), 0),
    coalesce(sum(case when rw.funding_type in ('VENDOR', 'SHARED')
      then coalesce(rw.vendor_cost, 0) else 0 end), 0)
  from public.reward_redemptions rr
  join public.rewards rw on rw.id = rr.reward_id
  where rr.status = 'COMPLETED'
    and rr.created_at between p_start and p_end
    and (p_canteen_id is null or rw.canteen_id = p_canteen_id)
  group by rw.id, rw.name, rw.funding_type
  order by count(rr.id) desc;
end;
$$;

create or replace function public.get_vendor_rewards_performance(
  p_start timestamptz,
  p_end timestamptz
) returns table (
  canteen_id uuid,
  canteen_name text,
  orders bigint,
  points_issued bigint,
  redemptions bigint,
  grabit_cost numeric,
  vendor_cost numeric,
  repeat_orders bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role from public.users where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  return query
  with vendor_orders as (
    select o.canteen_id, o.id, o.student_id
    from public.orders o
    where o.status = 'completed' and o.completed_at between p_start and p_end
  ),
  vendor_points as (
    select o.canteen_id, sum(pt.amount) as pts
    from public.point_transactions pt
    join public.orders o on o.id = pt.related_order_id
    where pt.type = 'EARN' and pt.created_at between p_start and p_end
    group by o.canteen_id
  ),
  vendor_redemptions as (
    select rw.canteen_id, count(*) as redemptions,
      sum(case when rw.funding_type in ('GRABIT', 'SHARED') then coalesce(rw.grabit_cost, rw.discount_amount, 0) else 0 end) as grabit_cost,
      sum(case when rw.funding_type in ('VENDOR', 'SHARED') then coalesce(rw.vendor_cost, 0) else 0 end) as vendor_cost
    from public.reward_redemptions rr
    join public.rewards rw on rw.id = rr.reward_id
    where rr.status = 'COMPLETED' and rr.created_at between p_start and p_end
    group by rw.canteen_id
  ),
  vendor_repeats as (
    select vo.canteen_id, count(*) as repeat_orders
    from vendor_orders vo
    where exists (
      select 1 from public.orders o2
      where o2.student_id = vo.student_id and o2.status = 'completed'
        and o2.id <> vo.id and o2.completed_at < (select completed_at from public.orders where id = vo.id)
    )
    group by vo.canteen_id
  )
  select
    c.id,
    c.name,
    coalesce((select count(*) from vendor_orders vo where vo.canteen_id = c.id), 0),
    coalesce((select pts from vendor_points vp where vp.canteen_id = c.id), 0),
    coalesce((select redemptions from vendor_redemptions vr where vr.canteen_id = c.id), 0),
    coalesce((select grabit_cost from vendor_redemptions vr where vr.canteen_id = c.id), 0),
    coalesce((select vendor_cost from vendor_redemptions vr where vr.canteen_id = c.id), 0),
    coalesce((select repeat_orders from vendor_repeats vrp where vrp.canteen_id = c.id), 0)
  from public.canteens c
  where exists (select 1 from vendor_orders vo where vo.canteen_id = c.id)
  order by 3 desc;
end;
$$;

create or replace function public.get_rewards_timeseries(
  p_start timestamptz,
  p_end timestamptz,
  p_canteen_id uuid default null
) returns table (
  day date,
  points_issued bigint,
  points_redeemed bigint,
  reward_cost numeric,
  redemptions bigint,
  reward_driven_orders bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_attribution_days integer;
  v_config jsonb;
begin
  select role into v_caller_role from public.users where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  select value into v_config from public.platform_settings where key = 'rewards_analytics_config';
  v_attribution_days := coalesce((v_config ->> 'attributionWindowDays')::integer, 7);

  return query
  with days as (
    select generate_series(date_trunc('day', p_start), date_trunc('day', p_end), interval '1 day')::date as day
  ),
  issued as (
    select date_trunc('day', pt.created_at)::date as day, sum(pt.amount) as pts
    from public.point_transactions pt
    join public.orders o on o.id = pt.related_order_id
    where pt.type = 'EARN' and pt.created_at between p_start and p_end
      and (p_canteen_id is null or o.canteen_id = p_canteen_id)
    group by 1
  ),
  redeemed as (
    select date_trunc('day', rr.created_at)::date as day, sum(rr.points_spent) as pts, count(*) as cnt,
      sum(case when rw.funding_type in ('GRABIT', 'SHARED') then coalesce(rw.grabit_cost, rw.discount_amount, 0) else 0 end) as cost
    from public.reward_redemptions rr
    join public.rewards rw on rw.id = rr.reward_id
    where rr.status = 'COMPLETED' and rr.created_at between p_start and p_end
      and (p_canteen_id is null or rw.canteen_id = p_canteen_id)
    group by 1
  ),
  reward_touch as (
    select user_id, created_at from public.reward_redemptions where status = 'COMPLETED'
  ),
  eligible_orders as (
    select o.id, o.student_id, o.completed_at
    from public.orders o
    where o.status = 'completed' and o.completed_at between p_start and p_end
      and (p_canteen_id is null or o.canteen_id = p_canteen_id)
  ),
  driven as (
    select date_trunc('day', eo.completed_at)::date as day, count(*) as cnt
    from eligible_orders eo
    where exists (
      select 1 from reward_touch rt
      where rt.user_id = eo.student_id
        and rt.created_at < eo.completed_at
        and rt.created_at >= eo.completed_at - (v_attribution_days || ' days')::interval
    )
    group by 1
  )
  select
    d.day,
    coalesce(i.pts, 0),
    coalesce(r.pts, 0),
    coalesce(r.cost, 0),
    coalesce(r.cnt, 0),
    coalesce(dr.cnt, 0)
  from days d
  left join issued i on i.day = d.day
  left join redeemed r on r.day = d.day
  left join driven dr on dr.day = d.day
  order by d.day;
end;
$$;

create or replace function public.get_gifting_analytics(
  p_start timestamptz,
  p_end timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_config jsonb;
  v_attribution_days integer;
  v_points_sent integer;
  v_senders integer;
  v_recipients integer;
  v_food_gifts integer;
  v_reward_gifts integer;
  v_gift_bonus integer;
  v_recipients_ordered integer;
begin
  select role into v_caller_role from public.users where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  select value into v_config from public.platform_settings where key = 'rewards_analytics_config';
  v_attribution_days := coalesce((v_config ->> 'attributionWindowDays')::integer, 7);

  select coalesce(sum(amount), 0), count(distinct sender_id), count(distinct recipient_id)
    into v_points_sent, v_senders, v_recipients
  from public.point_transfers where created_at between p_start and p_end;

  select count(*) filter (where rw.reward_type = 'FOOD_ITEM'),
         count(*) filter (where rw.reward_type <> 'FOOD_ITEM')
    into v_food_gifts, v_reward_gifts
  from public.reward_redemptions rr
  join public.rewards rw on rw.id = rr.reward_id
  where rr.gifted_to_user_id is not null and rr.status = 'COMPLETED'
    and rr.created_at between p_start and p_end;

  select coalesce(sum(amount), 0) into v_gift_bonus
  from public.point_transactions where type = 'GIFT_BONUS' and created_at between p_start and p_end;

  select count(distinct rr.gifted_to_user_id) into v_recipients_ordered
  from public.reward_redemptions rr
  where rr.gifted_to_user_id is not null and rr.status = 'COMPLETED'
    and rr.created_at between p_start and p_end
    and exists (
      select 1 from public.orders o
      where o.student_id = rr.gifted_to_user_id and o.status = 'completed'
        and o.completed_at > rr.created_at
        and o.completed_at <= rr.created_at + (v_attribution_days || ' days')::interval
    );

  return jsonb_build_object(
    'pointsSent', v_points_sent,
    'senders', v_senders,
    'recipients', v_recipients,
    'foodGifts', v_food_gifts,
    'rewardGifts', v_reward_gifts,
    'giftBonusPoints', v_gift_bonus,
    'recipientsWhoOrdered', v_recipients_ordered,
    'attributionWindowDays', v_attribution_days
  );
end;
$$;

create or replace function public.get_points_liability_breakdown()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_active_balance integer;
  v_gifted_unredeemed integer;
  v_aging jsonb;
begin
  select role into v_caller_role from public.users where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  select coalesce(sum(points_balance), 0) into v_active_balance from public.reward_accounts;

  -- "Unredeemed gifted points" = points currently sitting in a
  -- recipient's balance that arrived via a transfer (approximated as
  -- lifetime RECEIVE+GIFT_BONUS credits minus what that same user has
  -- since spent — a reasoned estimate, not a separate ledger).
  select coalesce(sum(greatest(0, received.amt - spent.amt)), 0) into v_gifted_unredeemed
  from (
    select user_id, sum(amount) as amt from public.point_transactions
    where type in ('RECEIVE', 'GIFT_BONUS') group by user_id
  ) received
  left join (
    select user_id, sum(-amount) as amt from public.point_transactions
    where type = 'REDEEM' group by user_id
  ) spent on spent.user_id = received.user_id;

  select jsonb_build_object(
    'days0to7', coalesce(sum(amount) filter (where created_at >= now() - interval '7 days'), 0),
    'days8to30', coalesce(sum(amount) filter (where created_at < now() - interval '7 days' and created_at >= now() - interval '30 days'), 0),
    'days31to90', coalesce(sum(amount) filter (where created_at < now() - interval '30 days' and created_at >= now() - interval '90 days'), 0),
    'days90plus', coalesce(sum(amount) filter (where created_at < now() - interval '90 days'), 0)
  ) into v_aging
  from public.point_transactions
  where type in ('EARN', 'RECEIVE', 'GIFT_BONUS');

  return jsonb_build_object(
    'outstandingPoints', v_active_balance,
    'giftedUnredeemedEstimate', v_gifted_unredeemed,
    'aging', v_aging
  );
end;
$$;

create or replace function public.get_leaderboard_economics(
  p_start timestamptz,
  p_end timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
  v_top10 uuid[];
  v_top10_points integer;
  v_top10_orders numeric;
  v_top10_repeat_rate numeric;
  v_top10_reward_cost numeric;
  v_rest_orders numeric;
begin
  select role into v_caller_role from public.users where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  select array_agg(user_id) into v_top10 from (
    select user_id, sum(amount) as pts
    from public.point_transactions
    where type = 'EARN' and created_at between p_start and p_end
    group by user_id
    order by pts desc
    limit 10
  ) t;

  if v_top10 is null then
    return jsonb_build_object(
      'top10Points', 0, 'top10AvgOrders', 0, 'top10RepeatRate', 0,
      'top10RewardCost', 0, 'restAvgOrders', 0
    );
  end if;

  select coalesce(sum(amount), 0) into v_top10_points
  from public.point_transactions where type = 'EARN' and user_id = any(v_top10) and created_at between p_start and p_end;

  select coalesce(avg(cnt), 0) into v_top10_orders from (
    select student_id, count(*) as cnt from public.orders
    where status = 'completed' and completed_at between p_start and p_end and student_id = any(v_top10)
    group by student_id
  ) t;

  select coalesce(
    count(*) filter (where cnt > 1)::numeric / nullif(count(*), 0) * 100, 0
  ) into v_top10_repeat_rate from (
    select student_id, count(*) as cnt from public.orders
    where status = 'completed' and completed_at between p_start and p_end and student_id = any(v_top10)
    group by student_id
  ) t;

  select coalesce(sum(case when rw.funding_type in ('GRABIT', 'SHARED') then coalesce(rw.grabit_cost, rw.discount_amount, 0) else 0 end), 0)
    into v_top10_reward_cost
  from public.reward_redemptions rr
  join public.rewards rw on rw.id = rr.reward_id
  where rr.user_id = any(v_top10) and rr.status = 'COMPLETED' and rr.created_at between p_start and p_end;

  select coalesce(avg(cnt), 0) into v_rest_orders from (
    select student_id, count(*) as cnt from public.orders
    where status = 'completed' and completed_at between p_start and p_end
      and not (student_id = any(v_top10))
    group by student_id
  ) t;

  return jsonb_build_object(
    'top10Points', v_top10_points,
    'top10AvgOrders', round(v_top10_orders, 1),
    'top10RepeatRate', round(v_top10_repeat_rate, 1),
    'top10RewardCost', v_top10_reward_cost,
    'restAvgOrders', round(v_rest_orders, 1)
  );
end;
$$;

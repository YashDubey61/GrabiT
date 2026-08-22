-- Migration 0036: Reward Redemption Codes usable at Checkout
-- Applied live via Supabase MCP; saved here for repo parity/history.

alter table public.orders
  add column if not exists reward_redemption_id uuid references public.reward_redemptions(id),
  add column if not exists reward_code text;

create or replace function public.preview_reward_code(
  p_code text,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  if p_code is null or length(p_code) <> 16 or p_code !~ '^[0-9]{16}$' then
    raise exception 'INVALID_CODE_FORMAT';
  end if;

  select rr.id, rr.user_id, rr.gifted_to_user_id, rr.code_status, rr.expires_at, rr.order_id,
         rw.id as reward_id, rw.name as reward_name, rw.reward_type, rw.menu_item_id,
         rw.discount_amount, rw.canteen_id
  into v_row
  from public.reward_redemptions rr
  join public.rewards rw on rw.id = rr.reward_id
  where rr.redemption_code = p_code;

  if v_row.id is null then
    raise exception 'INVALID_CODE';
  end if;

  if v_row.user_id is distinct from p_user_id and v_row.gifted_to_user_id is distinct from p_user_id then
    raise exception 'NOT_YOUR_CODE';
  end if;

  if v_row.code_status = 'GENERATED' and v_row.expires_at is not null and now() > v_row.expires_at then
    update public.reward_redemptions set code_status = 'EXPIRED' where id = v_row.id;
    raise exception 'CODE_EXPIRED';
  end if;

  if v_row.code_status = 'USED' then
    raise exception 'CODE_ALREADY_USED';
  end if;
  if v_row.code_status = 'EXPIRED' then
    raise exception 'CODE_EXPIRED';
  end if;
  if v_row.code_status in ('CANCELLED', 'REJECTED') then
    raise exception 'CODE_NOT_VALID';
  end if;
  if v_row.order_id is not null then
    raise exception 'CODE_NOT_APPLICABLE_AT_CHECKOUT';
  end if;
  if v_row.reward_type = 'PERK' then
    raise exception 'CODE_NOT_APPLICABLE_AT_CHECKOUT';
  end if;

  return jsonb_build_object(
    'redemptionId', v_row.id,
    'rewardId', v_row.reward_id,
    'rewardName', v_row.reward_name,
    'rewardType', v_row.reward_type,
    'menuItemId', v_row.menu_item_id,
    'discountAmount', v_row.discount_amount,
    'canteenId', v_row.canteen_id
  );
end;
$$;

create or replace function public.consume_reward_code(
  p_code text,
  p_user_id uuid,
  p_order_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  if p_code is null or length(p_code) <> 16 or p_code !~ '^[0-9]{16}$' then
    raise exception 'INVALID_CODE_FORMAT';
  end if;

  select rr.id, rr.user_id, rr.gifted_to_user_id, rr.code_status, rr.expires_at, rr.order_id,
         rw.id as reward_id, rw.name as reward_name, rw.reward_type, rw.menu_item_id,
         rw.discount_amount, rw.canteen_id
  into v_row
  from public.reward_redemptions rr
  join public.rewards rw on rw.id = rr.reward_id
  where rr.redemption_code = p_code
  for update of rr;

  if v_row.id is null then
    raise exception 'INVALID_CODE';
  end if;

  if v_row.user_id is distinct from p_user_id and v_row.gifted_to_user_id is distinct from p_user_id then
    raise exception 'NOT_YOUR_CODE';
  end if;

  if v_row.code_status = 'GENERATED' and v_row.expires_at is not null and now() > v_row.expires_at then
    update public.reward_redemptions set code_status = 'EXPIRED' where id = v_row.id;
    raise exception 'CODE_EXPIRED';
  end if;

  if v_row.code_status = 'USED' then
    raise exception 'CODE_ALREADY_USED';
  end if;
  if v_row.code_status = 'EXPIRED' then
    raise exception 'CODE_EXPIRED';
  end if;
  if v_row.code_status in ('CANCELLED', 'REJECTED') then
    raise exception 'CODE_NOT_VALID';
  end if;
  if v_row.order_id is not null then
    raise exception 'CODE_NOT_APPLICABLE_AT_CHECKOUT';
  end if;
  if v_row.reward_type = 'PERK' then
    raise exception 'CODE_NOT_APPLICABLE_AT_CHECKOUT';
  end if;

  update public.reward_redemptions
  set code_status = 'USED',
      redeemed_at = now(),
      order_id = p_order_id
  where id = v_row.id;

  update public.orders
  set reward_redemption_id = v_row.id,
      reward_code = p_code
  where id = p_order_id;

  return jsonb_build_object(
    'redemptionId', v_row.id,
    'rewardId', v_row.reward_id,
    'rewardName', v_row.reward_name,
    'rewardType', v_row.reward_type,
    'menuItemId', v_row.menu_item_id,
    'discountAmount', v_row.discount_amount,
    'canteenId', v_row.canteen_id
  );
end;
$$;

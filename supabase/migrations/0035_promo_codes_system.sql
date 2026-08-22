-- Migration 0035: Promo Code / Coupon System
-- Applied live via Supabase MCP; saved here for repo parity/history.

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('PERCENTAGE', 'FLAT')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  max_discount numeric(10, 2),
  min_order_value numeric(10, 2) not null default 0 check (min_order_value >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  is_published boolean not null default true,
  campus_id uuid references public.campuses(id),
  canteen_id uuid references public.canteens(id),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_promo_codes_code on public.promo_codes (upper(code));
create index if not exists idx_promo_codes_active_published on public.promo_codes (is_active, is_published);
create index if not exists idx_promo_codes_campus on public.promo_codes (campus_id);

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id),
  user_id uuid not null references public.users(id),
  order_id uuid references public.orders(id),
  discount_amount numeric(10, 2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_promo_redemptions_order on public.promo_code_redemptions (order_id) where order_id is not null;
create index if not exists idx_promo_redemptions_promo on public.promo_code_redemptions (promo_code_id);
create index if not exists idx_promo_redemptions_user on public.promo_code_redemptions (user_id);

alter table public.orders
  add column if not exists promo_code_id uuid references public.promo_codes(id),
  add column if not exists promo_code text,
  add column if not exists promo_discount numeric(10, 2) not null default 0;

alter table public.promo_codes enable row level security;
alter table public.promo_code_redemptions enable row level security;

create policy "Admins manage promo codes" on public.promo_codes
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Students read published active promo codes" on public.promo_codes
  for select using (is_published = true and is_active = true);

create policy "Admins view all redemptions" on public.promo_code_redemptions
  for select using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Students view their own redemptions" on public.promo_code_redemptions
  for select using (auth.uid() = user_id);

create or replace function public.preview_promo_code(
  p_code text,
  p_user_id uuid,
  p_subtotal numeric,
  p_campus_id uuid default null,
  p_canteen_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo record;
  v_used_count integer;
  v_user_used_count integer;
  v_discount numeric;
begin
  select * into v_promo from public.promo_codes where upper(code) = upper(p_code);

  if v_promo.id is null then
    raise exception 'INVALID_CODE';
  end if;
  if not v_promo.is_published or not v_promo.is_active then
    raise exception 'CODE_UNAVAILABLE';
  end if;
  if v_promo.starts_at is not null and now() < v_promo.starts_at then
    raise exception 'CODE_NOT_YET_ACTIVE';
  end if;
  if v_promo.expires_at is not null and now() > v_promo.expires_at then
    raise exception 'CODE_EXPIRED';
  end if;
  if v_promo.campus_id is not null and v_promo.campus_id is distinct from p_campus_id then
    raise exception 'CODE_NOT_VALID_FOR_CAMPUS';
  end if;
  if v_promo.canteen_id is not null and v_promo.canteen_id is distinct from p_canteen_id then
    raise exception 'CODE_NOT_VALID_FOR_VENDOR';
  end if;
  if p_subtotal < v_promo.min_order_value then
    raise exception 'BELOW_MINIMUM_ORDER';
  end if;

  if v_promo.usage_limit is not null then
    select count(*) into v_used_count from public.promo_code_redemptions where promo_code_id = v_promo.id;
    if v_used_count >= v_promo.usage_limit then
      raise exception 'USAGE_LIMIT_REACHED';
    end if;
  end if;

  select count(*) into v_user_used_count from public.promo_code_redemptions
    where promo_code_id = v_promo.id and user_id = p_user_id;
  if v_user_used_count >= v_promo.per_user_limit then
    raise exception 'PER_USER_LIMIT_REACHED';
  end if;

  if v_promo.discount_type = 'PERCENTAGE' then
    v_discount := p_subtotal * v_promo.discount_value / 100;
    if v_promo.max_discount is not null then
      v_discount := least(v_discount, v_promo.max_discount);
    end if;
  else
    v_discount := v_promo.discount_value;
  end if;

  v_discount := least(v_discount, p_subtotal);
  v_discount := round(v_discount, 2);

  return jsonb_build_object(
    'promoCodeId', v_promo.id,
    'code', v_promo.code,
    'description', v_promo.description,
    'discountType', v_promo.discount_type,
    'discountValue', v_promo.discount_value,
    'discountAmount', v_discount
  );
end;
$$;

create or replace function public.redeem_promo_code(
  p_code text,
  p_user_id uuid,
  p_order_id uuid,
  p_subtotal numeric,
  p_campus_id uuid default null,
  p_canteen_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo record;
  v_used_count integer;
  v_user_used_count integer;
  v_discount numeric;
  v_redemption_id uuid;
begin
  select * into v_promo from public.promo_codes where upper(code) = upper(p_code) for update;

  if v_promo.id is null then
    raise exception 'INVALID_CODE';
  end if;
  if not v_promo.is_published or not v_promo.is_active then
    raise exception 'CODE_UNAVAILABLE';
  end if;
  if v_promo.starts_at is not null and now() < v_promo.starts_at then
    raise exception 'CODE_NOT_YET_ACTIVE';
  end if;
  if v_promo.expires_at is not null and now() > v_promo.expires_at then
    raise exception 'CODE_EXPIRED';
  end if;
  if v_promo.campus_id is not null and v_promo.campus_id is distinct from p_campus_id then
    raise exception 'CODE_NOT_VALID_FOR_CAMPUS';
  end if;
  if v_promo.canteen_id is not null and v_promo.canteen_id is distinct from p_canteen_id then
    raise exception 'CODE_NOT_VALID_FOR_VENDOR';
  end if;
  if p_subtotal < v_promo.min_order_value then
    raise exception 'BELOW_MINIMUM_ORDER';
  end if;

  if v_promo.usage_limit is not null then
    select count(*) into v_used_count from public.promo_code_redemptions where promo_code_id = v_promo.id;
    if v_used_count >= v_promo.usage_limit then
      raise exception 'USAGE_LIMIT_REACHED';
    end if;
  end if;

  select count(*) into v_user_used_count from public.promo_code_redemptions
    where promo_code_id = v_promo.id and user_id = p_user_id;
  if v_user_used_count >= v_promo.per_user_limit then
    raise exception 'PER_USER_LIMIT_REACHED';
  end if;

  if v_promo.discount_type = 'PERCENTAGE' then
    v_discount := p_subtotal * v_promo.discount_value / 100;
    if v_promo.max_discount is not null then
      v_discount := least(v_discount, v_promo.max_discount);
    end if;
  else
    v_discount := v_promo.discount_value;
  end if;

  v_discount := least(v_discount, p_subtotal);
  v_discount := round(v_discount, 2);

  insert into public.promo_code_redemptions (promo_code_id, user_id, order_id, discount_amount)
  values (v_promo.id, p_user_id, p_order_id, v_discount)
  returning id into v_redemption_id;

  update public.orders
  set promo_code_id = v_promo.id, promo_code = v_promo.code, promo_discount = v_discount
  where id = p_order_id;

  return jsonb_build_object(
    'redemptionId', v_redemption_id,
    'promoCodeId', v_promo.id,
    'code', v_promo.code,
    'discountAmount', v_discount
  );
end;
$$;

create or replace function public.get_active_promo_codes(
  p_campus_id uuid default null
) returns setof public.promo_codes
language sql
security definer
set search_path = public
as $$
  select * from public.promo_codes
  where is_published = true and is_active = true
    and (starts_at is null or now() >= starts_at)
    and (expires_at is null or now() <= expires_at)
    and (campus_id is null or campus_id = p_campus_id)
  order by created_at desc;
$$;

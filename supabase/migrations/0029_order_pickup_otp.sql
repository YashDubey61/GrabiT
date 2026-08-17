-- Manual OTP fallback for pickup verification. Reuses the QR flow's
-- "used" marker (pickup_qr_used_at) as the single completion guard for
-- BOTH methods, so QR and OTP can never produce diverging order state.
alter table public.orders
  add column if not exists pickup_otp_code text;

-- Backfill existing orders with a random 4-digit code, retrying on the
-- rare collision so the unique index below can be created safely.
do $$
declare
  r record;
  candidate text;
begin
  for r in select id from public.orders where pickup_otp_code is null loop
    loop
      candidate := lpad((floor(random() * 10000))::int::text, 4, '0');
      exit when not exists (
        select 1 from public.orders where pickup_otp_code = candidate
      );
    end loop;
    update public.orders set pickup_otp_code = candidate where id = r.id;
  end loop;
end $$;

create unique index if not exists idx_orders_pickup_otp_code
  on public.orders (pickup_otp_code) where pickup_otp_code is not null;

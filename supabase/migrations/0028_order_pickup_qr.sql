-- Day 62: Unique per-order pickup QR verification token.
-- One order = exactly one active token. The token is the credential the
-- vendor scans; ownership/state are always re-derived server-side from
-- it, never trusted from the client.

alter table public.orders
  add column if not exists pickup_qr_token text,
  add column if not exists pickup_qr_created_at timestamptz,
  add column if not exists pickup_qr_used_at timestamptz;

-- Backfill any pre-existing orders so every order has a token.
-- 32 bytes of pgcrypto randomness -> 64 hex chars (unpredictable).
update public.orders
set
  pickup_qr_token = encode(gen_random_bytes(32), 'hex'),
  pickup_qr_created_at = coalesce(pickup_qr_created_at, now())
where pickup_qr_token is null;

-- One order = one active token, enforced at the DB level.
create unique index if not exists idx_orders_pickup_qr_token
  on public.orders (pickup_qr_token)
  where pickup_qr_token is not null;

comment on column public.orders.pickup_qr_token is
  'Cryptographically random pickup-verification token encoded in the order QR. Unique per order; consumed once at vendor scan.';
comment on column public.orders.pickup_qr_used_at is
  'Set atomically when a vendor successfully completes the order via QR scan. Non-null means the token is spent and cannot be reused.';

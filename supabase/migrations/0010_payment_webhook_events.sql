-- GrabIt — Day 24: Payment Webhook Events & Audit Log Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Payment Auditability & Idempotency)

create table if not exists payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  status text not null default 'processed',
  payload_summary jsonb,
  processed_at timestamptz not null default now()
);

-- Enable RLS on payment_webhook_events (restricted server-side access only)
alter table payment_webhook_events enable row level security;

-- GrabIt — Day 23: Subscription Payments & Razorpay Integration Schema
-- Source of truth: TRD §4 Data Model (payments table) & TRD §8 Security Architecture

-- 1. Make order_id nullable so non-food subscription payments can be recorded
alter table payments alter column order_id drop not null;

-- 2. Add user_id and razorpay_order_id columns to payments
alter table payments add column if not exists user_id uuid references users (id);
alter table payments add column if not exists razorpay_order_id text unique;

-- 3. Enforce unique constraint on razorpay_payment_id for payment idempotency
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payments_razorpay_payment_id_key'
  ) then
    alter table payments add constraint payments_razorpay_payment_id_key unique (razorpay_payment_id);
  end if;
end $$;

-- 4. Enable students to read their own payment records (food orders + subscriptions)
drop policy if exists "students read own payments" on payments;

create policy "students read own payments" on payments
  for select using (
    auth.uid() = user_id or
    exists (
      select 1 from orders
      where orders.id = payments.order_id
      and orders.student_id = auth.uid()
    )
  );

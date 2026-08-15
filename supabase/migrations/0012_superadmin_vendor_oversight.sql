-- GrabIt — Day 27: Super Admin Vendor Oversight Schema Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture

-- 1. Add commission_rate, tier, and category to canteens
alter table canteens add column if not exists commission_rate numeric(5,2) not null default 7.00;
alter table canteens add column if not exists tier text not null default 'STD';
alter table canteens add column if not exists category text not null default 'Fast Food & Snacks';

-- 2. Create vendor_approval_requests table for vendor verification queues
create table if not exists vendor_approval_requests (
  id uuid primary key default gen_random_uuid(),
  canteen_id uuid references canteens(id),
  vendor_name text not null,
  type_text text not null,
  badge_tag text not null,
  badge_type text not null default 'primary',
  description text,
  price_changes jsonb,
  status text not null default 'PENDING',
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enable RLS on vendor_approval_requests
alter table vendor_approval_requests enable row level security;

-- Public/Authenticated read policy for vendor approval requests
drop policy if exists "vendor_approval_requests read access" on vendor_approval_requests;
create policy "vendor_approval_requests read access" on vendor_approval_requests
  for select using (true);

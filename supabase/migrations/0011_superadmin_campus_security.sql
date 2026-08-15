-- GrabIt — Day 26: Super Admin Campus Security & Management Schema Migration
-- Source of truth: TRD §4 Data Model (campuses table) & TRD §8 Security Architecture

-- 1. Add status, logistics_lead, and image_url columns to campuses
alter table campuses add column if not exists status text not null default 'ACTIVE';
alter table campuses add column if not exists logistics_lead text;
alter table campuses add column if not exists image_url text;

-- 2. Public read access policy for campuses (student canteen discovery)
drop policy if exists "campuses read access" on campuses;

create policy "campuses read access" on campuses
  for select using (true);

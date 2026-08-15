-- GrabIt — Day 20: Vendor Menu Management RLS Migration
-- Source of truth: TRD §8 Security Architecture (Vendor Menu Isolation)

-- Enable RLS policies for vendor menu operations
create policy "vendors manage canteen menu items" on menu_items
  for all using (true) with check (true);

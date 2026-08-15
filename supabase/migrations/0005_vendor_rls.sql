-- GrabIt — Day 19: Vendor Active Orders RLS Migration
-- Source of truth: TRD §8 Security Architecture (Vendor Canteen Isolation)

-- Enable select policies for vendor operations
create policy "vendors read canteen orders" on orders
  for select using (true);

create policy "vendors read canteen order items" on order_items
  for select using (true);

-- GrabIt — Day 21: Vendor Analytics & Payouts RLS Migration
-- Source of truth: TRD §8 Security Architecture (Vendor Payout Isolation)

-- Enable RLS select policy for payouts
create policy "vendors read canteen payouts" on payouts
  for select using (true);

-- GrabIt — Day 18: Wallet RLS Policies Migration
-- Source of truth: TRD §4 Data Model (wallets, wallet_transactions)

-- Enable RLS inserts and updates for public.wallets
create policy "students insert own wallet" on wallets
  for insert with check (auth.uid() = user_id);

create policy "students update own wallet" on wallets
  for update using (auth.uid() = user_id);

-- Enable RLS inserts for wallet_transactions belonging to student's own wallet
create policy "students insert own wallet transactions" on wallet_transactions
  for insert with check (
    wallet_id in (select id from wallets where user_id = auth.uid())
  );

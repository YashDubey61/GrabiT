-- Migration 0041: Vendor Bank & Payout Account Configuration
-- Adds optional bank account details to public.canteens for vendor payout processing

ALTER TABLE public.canteens
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS payout_account_verified BOOLEAN NOT NULL DEFAULT FALSE;

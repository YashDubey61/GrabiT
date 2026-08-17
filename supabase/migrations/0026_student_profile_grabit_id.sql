-- Migration: 0026_student_profile_grabit_id.sql
-- Add permanent GRABIT User ID, customer profile fields, and addresses table with RLS security policies.

-- 1. Add customer profile columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS grabit_user_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index on grabit_user_id
CREATE INDEX IF NOT EXISTS idx_users_grabit_user_id ON users(grabit_user_id);

-- 2. Function to generate a unique GRB-XXXXXX identifier
CREATE OR REPLACE FUNCTION generate_grabit_user_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result TEXT := 'GRB-';
  i INTEGER;
  candidate TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    result := 'GRB-';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END FOR;

    candidate := result;

    SELECT count(*) INTO exists_count FROM users WHERE grabit_user_id = candidate;
    IF exists_count = 0 THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$;

-- 3. Trigger function to auto-assign grabit_user_id on new user creation
CREATE OR REPLACE FUNCTION set_grabit_user_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.grabit_user_id IS NULL OR NEW.grabit_user_id = '' THEN
    NEW.grabit_user_id := generate_grabit_user_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_grabit_user_id ON users;
CREATE TRIGGER trg_set_grabit_user_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_grabit_user_id_on_insert();

-- 4. Backfill grabit_user_id for any existing users lacking one
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM users WHERE grabit_user_id IS NULL OR grabit_user_id = '' LOOP
    UPDATE users SET grabit_user_id = generate_grabit_user_id() WHERE id = r.id;
  END LOOP;
END;
$$;

-- 5. Create customer addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Hostel',
  address_line TEXT NOT NULL,
  city TEXT DEFAULT 'Kanpur',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for addresses lookup
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Enable RLS on addresses table
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Security Policies for addresses table
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

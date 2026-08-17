-- Day 59: Add missing users.canteen_id column (vendor identity association)
-- vendor_auth.ts and multiple RLS policies (0016, 0023) already assume this
-- column exists; it was never added by any prior migration.

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_canteen_id ON public.users(canteen_id);

-- A vendor user should be associated with exactly one canteen at a time;
-- students/admins leave this null.
COMMENT ON COLUMN public.users.canteen_id IS
    'Canteen a vendor user manages. Null for students and admins.';

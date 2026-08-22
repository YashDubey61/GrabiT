-- GrabIt — Security Hardening: Fix unscoped vendor orders RLS policies
--
-- 0005_vendor_rls.sql created "vendors read canteen orders" / "vendors read
-- canteen order items" as `for select using (true)` with NO ownership
-- restriction at all. Since Postgres OR's multiple permissive policies for
-- the same command together, this silently granted every authenticated (and
-- possibly anonymous) caller SELECT access to every row in `orders` and
-- `order_items` — full read access to every student's order history, items,
-- and totals across the whole platform, regardless of the correctly-scoped
-- "students read own orders" policy from 0001_init.sql.
--
-- Replaces both policies with the intended vendor-canteen-scoped versions:
-- a vendor may read only orders (and their items) belonging to their own
-- canteen. Super Admin routes are unaffected — they read through the
-- service-role client, which bypasses RLS entirely.

drop policy if exists "vendors read canteen orders" on orders;
create policy "vendors read canteen orders" on orders
  for select using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.role = 'vendor'
        and users.canteen_id = orders.canteen_id
    )
  );

drop policy if exists "vendors read canteen order items" on order_items;
create policy "vendors read canteen order items" on order_items
  for select using (
    exists (
      select 1 from orders
      join users on users.id = auth.uid()
      where orders.id = order_items.order_id
        and users.role = 'vendor'
        and users.canteen_id = orders.canteen_id
    )
  );

-- vendor_approval_requests (0012_superadmin_vendor_oversight.sql) was also
-- `for select using (true)` — this table (vendor names, price change
-- proposals, approval status) is read only through the Super Admin
-- service-role client (lib/supabase/superadmin_vendors.ts); there is no
-- legitimate student/vendor/anon consumer, so tighten it to admin-only.
drop policy if exists "vendor_approval_requests read access" on vendor_approval_requests;
create policy "admins read vendor approval requests" on vendor_approval_requests
  for select using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.role = 'admin'
    )
  );

-- superadmin_feature_flags (0050_superadmin_feature_flags.sql) had a
-- "Public and authenticated read feature flags" `using (true)` policy —
-- exposes rollout percentages, target user/vendor/campus id lists, and
-- unreleased flag config to anyone. All real consumers are Super Admin
-- pages/routes reading via the service-role client; tighten to admin-only.
-- Guarded: this table has not been applied to every environment yet, so
-- skip cleanly rather than failing the whole migration where it's absent.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'superadmin_feature_flags'
  ) then
    execute 'drop policy if exists "Public and authenticated read feature flags" on public.superadmin_feature_flags';
    execute $policy$
      create policy "Admins read feature flags" on public.superadmin_feature_flags
        for select using (
          exists (
            select 1 from public.users
            where public.users.id = auth.uid()
              and public.users.role = 'admin'
          )
        )
    $policy$;
  end if;
end;
$$;

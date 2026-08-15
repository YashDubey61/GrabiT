-- GrabIt — Day 17: Auth & RLS Policies Migration
-- Source of truth: TRD §8 Security Architecture (RLS + Auth)

-- Enable RLS inserts/updates for public.users
create policy "users insert own profile" on users
  for insert with check (auth.uid() = id);

create policy "users update own profile" on users
  for update using (auth.uid() = id);

-- Enable RLS inserts for orders owned by the authenticated student
create policy "students insert own orders" on orders
  for insert with check (auth.uid() = student_id);

-- Enable RLS inserts for order items belonging to student's own orders
create policy "students insert own order items" on order_items
  for insert with check (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.student_id = auth.uid()
    )
  );

-- Enable RLS inserts for payments belonging to student's own orders
create policy "students insert own payments" on payments
  for insert with check (
    exists (
      select 1 from orders
      where orders.id = payments.order_id
      and orders.student_id = auth.uid()
    )
  );

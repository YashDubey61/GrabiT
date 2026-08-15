-- GrabIt — Day 22: Subscriptions & Profile Security RLS Migration
-- Source of truth: TRD §8 Security Architecture (RLS + Auth)

-- Enable student RLS read policy for own subscriptions
create policy "students read own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- Harden users RLS update policy so students cannot alter their role
drop policy if exists "users update own profile" on users;

create policy "users update own profile" on users
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = 'student');

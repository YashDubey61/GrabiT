-- Seed data for GrabIt Campus Canteen OS

-- Campuses
insert into campuses (id, name, city) values
  ('11111111-1111-1111-1111-111111111111', 'PSIT Kanpur', 'Kanpur, UP'),
  ('22222222-2222-2222-2222-222222222222', 'Galgotias University', 'Greater Noida, Delhi NCR'),
  ('33333333-3333-3333-3333-333333333333', 'SRM KTR', 'Chennai, Tamil Nadu'),
  ('44444444-4444-4444-4444-444444444444', 'LPU Punjab', 'Phagwara, Punjab')
on conflict (id) do nothing;

-- Demo Student Auth User & Profile
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'demo_student@grabit.in', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated')
on conflict (id) do nothing;

insert into users (id, phone, role, campus_id) values
  ('00000000-0000-0000-0000-000000000000', '+919999999999', 'student', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

-- Canteens
insert into canteens (id, campus_id, name, status, qr_code_id) values
  ('ca000001-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Central Food Court', 'active', 'QR_PSIT_01'),
  ('ca000002-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'South Block Canteen', 'active', 'QR_PSIT_02'),
  ('ca000003-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Galgotias Main Mess', 'active', 'QR_GALG_01')
on conflict (id) do nothing;

-- Menu Items
insert into menu_items (id, canteen_id, name, price, availability, is_sponsored) values
  ('de000001-1111-1111-1111-111111111111', 'ca000001-1111-1111-1111-111111111111', 'Butter Paneer Meal Box', 140.00, 'available', true),
  ('de000002-1111-1111-1111-111111111111', 'ca000001-1111-1111-1111-111111111111', 'Cold Coffee Float', 60.00, 'available', false),
  ('de000003-1111-1111-1111-111111111111', 'ca000001-1111-1111-1111-111111111111', 'Special Masala Dosa', 80.00, 'available', false),
  ('de000004-2222-2222-2222-222222222222', 'ca000002-1111-1111-1111-111111111111', 'Veg Cheese Grilled Sandwich', 75.00, 'available', false),
  ('de000005-2222-2222-2222-222222222222', 'ca000002-1111-1111-1111-111111111111', 'Desi Chai (Kulhad)', 20.00, 'available', true)
on conflict (id) do nothing;

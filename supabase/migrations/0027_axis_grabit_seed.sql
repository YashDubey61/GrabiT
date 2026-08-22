-- Day 61: Replace sample PSIT/Galgotias/SRM/LPU demo data with the single
-- real initial college (Axis Institute of Technology and Management) and
-- its single vendor (GRABIT Campus Vendor) + starter menu.
-- Idempotent: safe to run multiple times (upserts by natural key, guarded
-- deletes that only match the known sample rows).

-- 1. Schema: canteens/menu_items need DB-owned display fields so the app
--    layer no longer needs name-keyed hardcoded image/description maps.
alter table public.canteens
  add column if not exists image_url text,
  add column if not exists description text,
  add column if not exists cuisine_tags text;

alter table public.menu_items
  add column if not exists image_url text,
  add column if not exists description text,
  add column if not exists category text;

-- 2. The one real college.
insert into public.campuses (id, name, city, status, latitude, longitude, radius_meters, short_name, address, state)
values (
  'a1000000-0000-0000-0000-000000000001',
  'Axis Institute of Technology and Management',
  'Kanpur, UP',
  'ACTIVE',
  26.3768,
  80.4475,
  2000,
  'Axis',
  'Hathipur, Rooma, NH-19',
  'Uttar Pradesh'
)
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  status = excluded.status,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  radius_meters = excluded.radius_meters,
  short_name = excluded.short_name,
  address = excluded.address,
  state = excluded.state;

-- 3. The one real vendor, linked to that college.
insert into public.canteens (
  id, campus_id, name, status, qr_code_id, category, cuisine_tags, description, image_url
)
values (
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'GRABIT Campus Vendor',
  'active',
  'QR-GRABIT-CAMPUS-001',
  'Quick Snacks & Beverages',
  'Snacks • Beverages • Meals',
  'The official campus vendor for Axis Institute of Technology and Management.',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'
)
on conflict (id) do update set
  campus_id = excluded.campus_id,
  name = excluded.name,
  status = excluded.status,
  category = excluded.category,
  cuisine_tags = excluded.cuisine_tags,
  description = excluded.description,
  image_url = excluded.image_url;

-- 4. Four starter products for that vendor.
insert into public.menu_items (id, canteen_id, name, price, availability, category, description, image_url)
values
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'Aloo Samosa', 20, 'available', 'Quick Snacks',
   'Crispy potato-filled samosa served hot.',
   'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80'),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001',
   'Veg Sandwich', 60, 'available', 'Quick Snacks',
   'Fresh vegetable sandwich with delicious seasoning.',
   'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=600&q=80'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001',
   'Masala Maggi', 50, 'available', 'Meal / Snacks',
   'Hot Maggi noodles prepared with vegetables and Indian spices.',
   'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&q=80'),
  ('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001',
   'Cold Coffee', 70, 'available', 'Beverages',
   'Chilled creamy cold coffee.',
   'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&q=80')
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  availability = excluded.availability,
  category = excluded.category,
  description = excluded.description,
  image_url = excluded.image_url;

-- 5. Re-home any users still pointed at the old sample campus/canteen so
--    nothing is left dangling once the sample rows are removed below.
update public.users
  set campus_id = 'a1000000-0000-0000-0000-000000000001'
  where campus_id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  );

update public.users
  set canteen_id = 'b1000000-0000-0000-0000-000000000001'
  where canteen_id in (
    'ca000001-1111-1111-1111-111111111111',
    'ca000002-1111-1111-1111-111111111111',
    'ca000003-2222-2222-2222-222222222222'
  );

-- 6. Remove dev/demo data tied to the old sample canteens (test orders
--    created during development against the PSIT/Galgotias seed canteens).
delete from public.wallet_transactions
  where related_order_id in (
    select id from public.orders where canteen_id in (
      'ca000001-1111-1111-1111-111111111111',
      'ca000002-1111-1111-1111-111111111111',
      'ca000003-2222-2222-2222-222222222222'
    )
  );

delete from public.payments
  where order_id in (
    select id from public.orders where canteen_id in (
      'ca000001-1111-1111-1111-111111111111',
      'ca000002-1111-1111-1111-111111111111',
      'ca000003-2222-2222-2222-222222222222'
    )
  );

delete from public.orders
  where canteen_id in (
    'ca000001-1111-1111-1111-111111111111',
    'ca000002-1111-1111-1111-111111111111',
    'ca000003-2222-2222-2222-222222222222'
  );

delete from public.menu_items
  where canteen_id in (
    'ca000001-1111-1111-1111-111111111111',
    'ca000002-1111-1111-1111-111111111111',
    'ca000003-2222-2222-2222-222222222222'
  );

delete from public.canteens
  where id in (
    'ca000001-1111-1111-1111-111111111111',
    'ca000002-1111-1111-1111-111111111111',
    'ca000003-2222-2222-2222-222222222222'
  );

delete from public.campuses
  where id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  );

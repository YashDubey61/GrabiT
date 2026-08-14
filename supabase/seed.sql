-- GrabIt: Seed Data
-- 1 campus, 3 canteens, 3 vendors, ~30 menu items, 3 students, time slots, wallet bonus config

-- ══════════════════════════════════════════════════════
-- CAMPUS
-- ══════════════════════════════════════════════════════
INSERT INTO campuses (id, name, city) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'IIT Bombay', 'Mumbai');

-- ══════════════════════════════════════════════════════
-- CANTEENS
-- ══════════════════════════════════════════════════════
INSERT INTO canteens (id, campus_id, name, location_desc, is_open, opening_time, closing_time) VALUES
  ('ca000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Café Central', 'Main Building, Ground Floor', true, '08:00', '20:00'),
  ('ca000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   'South Side Bites', 'Hostel 4 Basement', true, '09:00', '22:00'),
  ('ca000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001',
   'Quick Bites Corner', 'Near Library', false, '10:00', '18:00');

-- ══════════════════════════════════════════════════════
-- VENDORS (password_hash = bcrypt of "vendor123")
-- ══════════════════════════════════════════════════════
INSERT INTO vendors (id, canteen_id, name, email, phone, password_hash) VALUES
  ('v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Rajan Kumar', 'rajan@cafecentral.in', '9876500001',
   '$2b$10$placeholder_hash_for_vendor123_cafecentral'),
  ('v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Meena Devi', 'meena@southside.in', '9876500002',
   '$2b$10$placeholder_hash_for_vendor123_southside'),
  ('v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'Amit Sharma', 'amit@quickbites.in', '9876500003',
   '$2b$10$placeholder_hash_for_vendor123_quickbites');

-- ══════════════════════════════════════════════════════
-- TIME SLOTS (2 per canteen)
-- ══════════════════════════════════════════════════════
INSERT INTO time_slots (id, canteen_id, name, start_time, end_time, max_orders) VALUES
  -- Café Central
  ('ts000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Short Break', '10:00', '10:30', 40),
  ('ts000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000001',
   'Lunch Slot', '12:30', '13:30', 80),
  -- South Side Bites
  ('ts000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000002',
   'Short Break', '10:00', '10:30', 30),
  ('ts000000-0000-0000-0000-000000000004', 'ca000000-0000-0000-0000-000000000002',
   'Lunch Slot', '12:30', '13:30', 60),
  -- Quick Bites Corner
  ('ts000000-0000-0000-0000-000000000005', 'ca000000-0000-0000-0000-000000000003',
   'Short Break', '10:00', '10:30', 20),
  ('ts000000-0000-0000-0000-000000000006', 'ca000000-0000-0000-0000-000000000003',
   'Lunch Slot', '12:30', '13:30', 40);

-- ══════════════════════════════════════════════════════
-- MENU ITEMS — Café Central
-- ══════════════════════════════════════════════════════
INSERT INTO menu_items (id, vendor_id, canteen_id, name, description, price, category, in_stock, sort_order) VALUES
  ('mi000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Samosa', 'Crispy potato-filled pastry', 1500, 'Snacks', true, 1),
  ('mi000000-0000-0000-0000-000000000002', 'v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Masala Dosa', 'South Indian crepe with spiced potato filling', 4000, 'Main Course', true, 2),
  ('mi000000-0000-0000-0000-000000000003', 'v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Filter Coffee', 'Traditional South Indian filter coffee', 2000, 'Beverages', true, 3),
  ('mi000000-0000-0000-0000-000000000004', 'v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Veg Biryani', 'Fragrant basmati rice with mixed vegetables', 7000, 'Main Course', true, 4),
  ('mi000000-0000-0000-0000-000000000005', 'v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Cold Coffee', 'Chilled coffee with ice cream', 3500, 'Beverages', true, 5),
  ('mi000000-0000-0000-0000-000000000006', 'v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Paneer Tikka', 'Grilled cottage cheese with spices', 6000, 'Snacks', true, 6),
  ('mi000000-0000-0000-0000-000000000007', 'v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Chai', 'Masala chai brewed fresh', 1500, 'Beverages', true, 7),
  ('mi000000-0000-0000-0000-000000000008', 'v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Aloo Paratha', 'Stuffed flatbread with potato filling', 3500, 'Main Course', true, 8),
  ('mi000000-0000-0000-0000-000000000009', 'v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Vada Pav', 'Mumbai-style potato fritter in bun', 2000, 'Snacks', true, 9),
  ('mi000000-0000-0000-0000-000000000010', 'v0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001',
   'Gulab Jamun', 'Sweet milk dumplings in sugar syrup', 2500, 'Desserts', false, 10);

-- ══════════════════════════════════════════════════════
-- MENU ITEMS — South Side Bites
-- ══════════════════════════════════════════════════════
INSERT INTO menu_items (id, vendor_id, canteen_id, name, description, price, category, in_stock, sort_order) VALUES
  ('mi000000-0000-0000-0000-000000000011', 'v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Chicken Biryani', 'Hyderabadi-style dum biryani', 9000, 'Main Course', true, 1),
  ('mi000000-0000-0000-0000-000000000012', 'v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Egg Roll', 'Kolkata-style egg roll with chutney', 3500, 'Snacks', true, 2),
  ('mi000000-0000-0000-0000-000000000013', 'v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Butter Chicken', 'Creamy tomato-based chicken curry', 10000, 'Main Course', true, 3),
  ('mi000000-0000-0000-0000-000000000014', 'v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Mango Lassi', 'Sweet yogurt drink with mango', 3000, 'Beverages', true, 4),
  ('mi000000-0000-0000-0000-000000000015', 'v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Pav Bhaji', 'Spiced mashed vegetable curry with bread', 5000, 'Main Course', true, 5),
  ('mi000000-0000-0000-0000-000000000016', 'v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Chicken Momos', 'Steamed dumplings with spicy chutney', 4500, 'Snacks', true, 6),
  ('mi000000-0000-0000-0000-000000000017', 'v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Lemon Soda', 'Fresh lime soda, sweet or salted', 2000, 'Beverages', true, 7),
  ('mi000000-0000-0000-0000-000000000018', 'v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Spring Roll', 'Crispy vegetable spring rolls', 3000, 'Snacks', false, 8),
  ('mi000000-0000-0000-0000-000000000019', 'v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Dal Makhani', 'Creamy black lentil curry', 6000, 'Main Course', true, 9),
  ('mi000000-0000-0000-0000-000000000020', 'v0000000-0000-0000-0000-000000000002', 'ca000000-0000-0000-0000-000000000002',
   'Rasgulla', 'Soft cheese balls in sugar syrup', 2500, 'Desserts', true, 10);

-- ══════════════════════════════════════════════════════
-- MENU ITEMS — Quick Bites Corner
-- ══════════════════════════════════════════════════════
INSERT INTO menu_items (id, vendor_id, canteen_id, name, description, price, category, in_stock, sort_order) VALUES
  ('mi000000-0000-0000-0000-000000000021', 'v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'Maggi Noodles', 'Classic 2-minute noodles with veggies', 2500, 'Snacks', true, 1),
  ('mi000000-0000-0000-0000-000000000022', 'v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'Bread Omelette', 'Fluffy egg omelette with toast', 3000, 'Snacks', true, 2),
  ('mi000000-0000-0000-0000-000000000023', 'v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'Grilled Sandwich', 'Cheese and vegetable grilled sandwich', 3500, 'Snacks', true, 3),
  ('mi000000-0000-0000-0000-000000000024', 'v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'Milkshake', 'Thick chocolate or vanilla milkshake', 4000, 'Beverages', true, 4),
  ('mi000000-0000-0000-0000-000000000025', 'v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'French Fries', 'Crispy golden fries with ketchup', 2000, 'Snacks', true, 5),
  ('mi000000-0000-0000-0000-000000000026', 'v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'Iced Tea', 'Refreshing peach iced tea', 2500, 'Beverages', true, 6),
  ('mi000000-0000-0000-0000-000000000027', 'v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'Paneer Roll', 'Tandoori paneer wrapped in roti', 4500, 'Snacks', true, 7),
  ('mi000000-0000-0000-0000-000000000028', 'v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'Brownie', 'Rich chocolate brownie', 3500, 'Desserts', true, 8),
  ('mi000000-0000-0000-0000-000000000029', 'v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'Chole Bhature', 'Spiced chickpea curry with fried bread', 5500, 'Main Course', true, 9),
  ('mi000000-0000-0000-0000-000000000030', 'v0000000-0000-0000-0000-000000000003', 'ca000000-0000-0000-0000-000000000003',
   'Mineral Water', 'Packaged drinking water 500ml', 1000, 'Beverages', true, 10);

-- ══════════════════════════════════════════════════════
-- STUDENTS
-- ══════════════════════════════════════════════════════
INSERT INTO students (id, name, phone, email, campus_id, is_gold_subscriber) VALUES
  ('st000000-0000-0000-0000-000000000001', 'Arjun Mehta',   '9876543001', 'arjun@iitb.ac.in',
   'c0000000-0000-0000-0000-000000000001', false),
  ('st000000-0000-0000-0000-000000000002', 'Priya Sharma',  '9876543002', 'priya@iitb.ac.in',
   'c0000000-0000-0000-0000-000000000001', true),
  ('st000000-0000-0000-0000-000000000003', 'Rohan Gupta',   '9876543003', 'rohan@iitb.ac.in',
   'c0000000-0000-0000-0000-000000000001', false);

-- ══════════════════════════════════════════════════════
-- WALLETS
-- ══════════════════════════════════════════════════════
INSERT INTO wallets (id, student_id, balance) VALUES
  ('w0000000-0000-0000-0000-000000000001', 'st000000-0000-0000-0000-000000000001', 25000),  -- ₹250
  ('w0000000-0000-0000-0000-000000000002', 'st000000-0000-0000-0000-000000000002', 55000),  -- ₹550
  ('w0000000-0000-0000-0000-000000000003', 'st000000-0000-0000-0000-000000000003', 10000);  -- ₹100

-- ══════════════════════════════════════════════════════
-- SUBSCRIPTIONS (Priya has Gold)
-- ══════════════════════════════════════════════════════
INSERT INTO subscriptions (student_id, plan, starts_at, expires_at, is_active) VALUES
  ('st000000-0000-0000-0000-000000000002', 'gold', now(), now() + interval '30 days', true);

-- ══════════════════════════════════════════════════════
-- WALLET BONUS CONFIG
-- ══════════════════════════════════════════════════════
INSERT INTO wallet_bonus_config (min_amount, bonus_amount, is_active) VALUES
  (20000,  1000,  true),   -- ₹200 → +₹10
  (50000,  5000,  true),   -- ₹500 → +₹50
  (100000, 10000, true);   -- ₹1000 → +₹100

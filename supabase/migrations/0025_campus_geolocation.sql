-- GrabIt — Day 57: Campus Geolocation & Geofencing Migration
-- Adds GPS coordinates, geofence radius, and location metadata to campuses table

alter table campuses add column if not exists latitude double precision;
alter table campuses add column if not exists longitude double precision;
alter table campuses add column if not exists radius_meters numeric default 2000;
alter table campuses add column if not exists short_name text;
alter table campuses add column if not exists address text;
alter table campuses add column if not exists state text;

-- Index for campus geolocation queries
create index if not exists idx_campuses_lat_lon on campuses(latitude, longitude);
create index if not exists idx_canteens_campus_status on canteens(campus_id, status);

-- Seed verified geolocation coordinates for default active campuses
update campuses set
  latitude = 26.8378,
  longitude = 80.3275,
  radius_meters = 2000,
  short_name = 'PSIT',
  address = 'Bhauti, National Highway 19',
  state = 'Uttar Pradesh'
where id = '11111111-1111-1111-1111-111111111111' or name like '%PSIT%';

update campuses set
  latitude = 28.3640,
  longitude = 77.5360,
  radius_meters = 2500,
  short_name = 'Galgotias',
  address = 'Plot No.2, Sector 17-A, Yamuna Expressway',
  state = 'Delhi NCR'
where id = '22222222-2222-2222-2222-222222222222' or name like '%Galgotias%';

update campuses set
  latitude = 12.8231,
  longitude = 80.0442,
  radius_meters = 3000,
  short_name = 'SRM',
  address = 'Kattankulathur, Chengalpattu',
  state = 'Tamil Nadu'
where id = '33333333-3333-3333-3333-333333333333' or name like '%SRM%';

update campuses set
  latitude = 31.2536,
  longitude = 75.7037,
  radius_meters = 3500,
  short_name = 'LPU',
  address = 'Jalandhar - Delhi G.T. Road',
  state = 'Punjab'
where id = '44444444-4444-4444-4444-444444444444' or name like '%LPU%';

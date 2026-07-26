-- ============================================================
-- EPIC ARENA PREMIER LEAGUE MEGA AUCTION - Demo Seed Data
-- Run AFTER schema.sql + rpc_functions.sql.
-- Replace names, PINs, and photo_url values with the real roster
-- before your event.
-- ============================================================

insert into teams (name, short_code, pin, captain_name, purse_total, purse_remaining, roster_count, color_hex) values
('Chennai Chargers',      'CHC', '1111', 'A. Sharma', 10000, 10000, 1, '#F5A623'),
('Mumbai Marauders',      'MUM', '2222', 'R. Iyer',   10000, 10000, 1, '#1F7A4D'),
('Delhi Dynamos',         'DEL', '3333', 'V. Kapoor', 10000, 10000, 1, '#E5484D'),
('Bengaluru Blazers',     'BLR', '4444', 'S. Rao',    10000, 10000, 1, '#3A7BD5'),
('Kolkata Krakens',       'KOL', '5555', 'P. Das',    10000, 10000, 1, '#9B5DE5'),
('Hyderabad Hawks',       'HYD', '6666', 'N. Reddy',  10000, 10000, 1, '#F15BB5'),
('Punjab Panthers',       'PUN', '7777', 'G. Singh',  10000, 10000, 1, '#00BBF9'),
('Rajasthan Royals XI',   'RAJ', '8888', 'K. Meena',  10000, 10000, 1, '#FEE440');

-- 48 placeholder players, roles cycled, base prices varied 100/150/200.
-- queue_order 1..48 is the order they come up for auction.
insert into players (name, role, base_price, queue_order)
select
  'Player ' || i,
  (array['Batsman','Bowler','All-Rounder','Wicket-Keeper'])[1 + (i % 4)],
  (array[100, 150, 200])[1 + (i % 3)],
  i
from generate_series(1, 48) as i;

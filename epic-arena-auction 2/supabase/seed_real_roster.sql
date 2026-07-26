-- ============================================================
-- EPIC ARENA PREMIER LEAGUE MEGA AUCTION - Real Roster Seed
-- Transcribed from the organizer's registration sheet.
-- Run AFTER schema.sql + rpc_functions.sql.
--
-- IMPORTANT ASSUMPTIONS MADE DURING IMPORT (please verify / fix
-- via the new Admin -> Manage screens after this runs):
--
--   1. The sheet's "Team" labels (Old School, Vivek Team, Trivorn,
--      Bhai Team, Ellapalayam, LGB, Epic Arena) were sign-up/friend
--      groups, NOT the final auction franchises - per your
--      instruction, all 53 of those players are pooled together
--      into ONE shared auction list with no pre-assigned team.
--      Each player's original group is preserved in the
--      `source_group` column as a historical note only.
--
--   2. The 8 names under "Captain" (Vikram, Gokul, Rahoof, Nandhu,
--      Dhanapalan, Arun Balaji, Ganesh, Achu) ARE the 8 auction
--      franchises. Team names below are placeholders like
--      "Team Vikram" - rename them (and add sponsor names) from
--      Admin -> Manage -> Teams before the event.
--
--   3. Two names overlap between the captain list and the player
--      pool ("Gokul" under Ellapalayam, "Achu" under Vivek Team).
--      They were imported as SEPARATE people (a captain and a
--      pool player who happen to share a first name) since that's
--      the more common real-world case. If they're actually the
--      same person, delete that duplicate player row from
--      Admin -> Manage -> Players.
--
--   4. No player "Role" (Batsman/Bowler/etc.) was on the sheet, so
--      every player imports as role = NULL ("Unassigned"). The
--      Manage screen flags how many players still need a role
--      assigned - classify them before auction day.
--
--   5. Base price defaults to 100 + 25 per star rating (100 / 125
--      / 150) as a starting point - adjust freely, every field is
--      editable post-import.
--
--   6. Mobile numbers were hand-transcribed from a photo of the
--      sheet - please double check a few against your source before
--      texting anyone a PIN.
-- ============================================================

delete from bid_history;
delete from players;
delete from teams;
update auction_state set current_player_id = null, current_highest_bid = 0,
  current_highest_team_id = null, status = 'idle', timer_started_at = null where id = 1;

-- ---------------------------------------------------------------
-- 8 FRANCHISES, one per captain. PINs are sequential placeholders -
-- change them (and text owners the real ones) from Admin -> Manage.
-- ---------------------------------------------------------------
insert into teams (name, short_code, sponsor_name, pin, captain_name, captain_mobile, purse_total, purse_remaining, roster_count, color_hex)
values
  ('Team Vikram',      'VIK', '', '1111', 'Vikram',      '6381756337', 10000, 10000, 1, '#F39C12'),
  ('Team Gokul',       'GOK', '', '2222', 'Gokul',       null,         10000, 10000, 1, '#E74C3C'),
  ('Team Rahoof',      'RAH', '', '3333', 'Rahoof',      '9092833986', 10000, 10000, 1, '#3498DB'),
  ('Team Nandhu',      'NAN', '', '4444', 'Nandhu',      '9524248000', 10000, 10000, 1, '#E67E22'),
  ('Team Dhanapalan',  'DHA', '', '5555', 'Dhanapalan',  '9578025587', 10000, 10000, 1, '#9B59B6'),
  ('Team Arun Balaji', 'ARB', '', '6666', 'Arun Balaji', '6382986807', 10000, 10000, 1, '#1ABC9C'),
  ('Team Ganesh',      'GAN', '', '7777', 'Ganesh',      null,         10000, 10000, 1, '#F1C40F'),
  ('Team Achu',        'ACH', '', '8888', 'Achu',        '7010032701', 10000, 10000, 1, '#27AE60');

-- ---------------------------------------------------------------
-- 53 PLAYERS - one shared auction pool, no pre-assigned team.
-- role is left NULL (Unassigned) - classify from Admin -> Manage.
-- rating: 0 = unrated, 1 = *, 2 = **
-- base_price = 100 + (rating * 25)
-- source_group preserves the sheet's original sign-up group.
-- ---------------------------------------------------------------
insert into players (name, role, base_price, mobile, rating, entry_fee, source_group, queue_order)
values
  -- Old School
  ('Gowtham',      null, 100, null,         0, null, 'Old School', 1),
  ('Surya',        null, 100, null,         0, null, 'Old School', 2),
  ('Lingesh',      null, 150, null,         2, null, 'Old School', 3),
  ('Dhanraj',      null, 100, null,         0, null, 'Old School', 4),
  ('Sasi',         null, 100, null,         0, null, 'Old School', 5),
  ('Karan',        null, 150, null,         2, null, 'Old School', 6),
  ('Mohan',        null, 125, null,         1, null, 'Old School', 7),
  ('Balaji',       null, 100, null,         0, null, 'Old School', 8),

  -- Vivek Team
  ('Vivek',        null, 100, null,         0, null, 'Vivek Team', 9),
  ('Achu',         null, 100, null,         0, null, 'Vivek Team', 10),
  ('Naveen',       null, 100, null,         0, null, 'Vivek Team', 11),

  -- Trivorn
  ('Surya',        null, 100, '969801490',  0, null, 'Trivorn', 12),
  ('Gowtham',      null, 125, '979060101',  1, null, 'Trivorn', 13),
  ('Vicky',        null, 100, null,         0, null, 'Trivorn', 14),
  ('Vishnu',       null, 100, null,         0, null, 'Trivorn', 15),

  -- Bhai Team
  ('Samshu',       null, 150, '8682859263', 2, null, 'Bhai Team', 16),
  ('Badhusha',     null, 125, '9629780190', 1, null, 'Bhai Team', 17),
  ('Arshath',      null, 100, '7010103926', 0, null, 'Bhai Team', 18),
  ('Sadham',       null, 100, '9952784330', 0, null, 'Bhai Team', 19),
  ('farook',       null, 100, '8438782533', 0, null, 'Bhai Team', 20),
  ('Saleem',       null, 100, '9994312113', 0, null, 'Bhai Team', 21),
  ('Yashin',       null, 100, '9597888350', 0, null, 'Bhai Team', 22),
  ('Jamal',        null, 150, '9345115694', 2, null, 'Bhai Team', 23),
  ('Abban',        null, 100, '9942775446', 0, null, 'Bhai Team', 24),
  ('Aship',        null, 100, '7904977013', 0, null, 'Bhai Team', 25),
  ('Azhar',        null, 100, '9361277975', 0, 400,  'Bhai Team', 26),

  -- Ellapalayam
  ('Gokul',        null, 100, '6381190930', 0, null, 'Ellapalayam', 27),
  ('Arjun',        null, 100, '9566869535', 0, null, 'Ellapalayam', 28),
  ('Vinith',       null, 125, '8870852263', 1, null, 'Ellapalayam', 29),
  ('Nivash',       null, 150, '9597652073', 2, null, 'Ellapalayam', 30),
  ('Shiva',        null, 100, '8489370953', 0, null, 'Ellapalayam', 31),
  ('Mohith',       null, 100, '9597224647', 0, null, 'Ellapalayam', 32),
  ('Elavarasan',   null, 100, '9789071357', 0, null, 'Ellapalayam', 33),

  -- LGB
  ('Pandi',        null, 125, '7639626814', 1, null, 'LGB', 34),
  ('Veera',        null, 100, '8778966570', 0, null, 'LGB', 35),
  ('Sathish',      null, 100, '6369706578', 0, null, 'LGB', 36),
  ('Dhamu',        null, 100, '9789799248', 0, null, 'LGB', 37),
  ('Niranjan',     null, 100, null,         0, null, 'LGB', 38),
  ('Guna',         null, 100, '9843938371', 0, null, 'LGB', 39),

  -- Epic Arena
  ('SP',           null, 125, '8825890722', 1, null, 'Epic Arena', 40),
  ('MP',           null, 100, '9944562453', 0, null, 'Epic Arena', 41),
  ('PK',           null, 150, '7904099144', 2, null, 'Epic Arena', 42),
  ('Dinesh',       null, 150, '9698207173', 2, null, 'Epic Arena', 43),
  ('Das',          null, 125, '8760596092', 1, null, 'Epic Arena', 44),
  ('Sivu',         null, 100, '6381835889', 0, null, 'Epic Arena', 45),
  ('Sri',          null, 150, '9677845872', 2, null, 'Epic Arena', 46),
  ('Oop',          null, 100, '9003811746', 0, null, 'Epic Arena', 47),
  ('Udhaya',       null, 100, '9944356435', 0, null, 'Epic Arena', 48),
  ('Kishor Anna',  null, 100, '9597228160', 0, null, 'Epic Arena', 49),
  ('Suzzy',        null, 100, '9944709552', 0, null, 'Epic Arena', 50),
  ('Narean',       null, 100, null,         0, null, 'Epic Arena', 51),
  ('Selva',        null, 100, null,         0, null, 'Epic Arena', 52),
  ('Hemanth',      null, 125, null,         1, null, 'Epic Arena', 53);

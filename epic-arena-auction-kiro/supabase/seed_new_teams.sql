-- Seed 8 new franchise teams with updated identities
-- Run this after schema.sql to replace default teams

DELETE FROM teams;

INSERT INTO teams (name, short_code, sponsor_name, captain_name, pin, purse_total, purse_remaining, color_hex, logo_url)
VALUES
  ('Raksha', 'RAK', 'Raksha Capital', 'Achu', '1111', 10000, 10000, '#E63946', NULL),
  ('Singapore Sixers', 'SGS', 'Singapore Trading', 'Rahoof', '2222', 10000, 10000, '#1D3557', NULL),
  ('Habiba Hunters', 'HBH', 'Habiba Holdings', 'Sathya', '3333', 10000, 10000, '#F77F00', NULL),
  ('Annur Falcons', 'ANF', 'Annur Industries', 'Ganesh', '4444', 10000, 10000, '#06A77D', NULL),
  ('Trivorn Strikers', 'TRV', 'Trivorn Corp', 'Surya', '5555', 10000, 10000, '#8B5A8E', NULL),
  ('Thunder Wolves', 'THW', 'Thunder Energy', 'Dheetchith', '6666', 10000, 10000, '#FF006E', NULL),
  ('Garuda Warriors', 'GRD', 'Garuda Group', 'Dhanapalan', '7777', 10000, 10000, '#2A9D8F', NULL),
  ('Ellai Spartans', 'ELS', 'Ellai Enterprises', 'Nandhu', '8888', 10000, 10000, '#264653', NULL)
ON CONFLICT DO NOTHING;

-- Reset serial (sequence) for proper team IDs
SELECT setval(pg_get_serial_sequence('teams', 'id'), (SELECT MAX(id) FROM teams));

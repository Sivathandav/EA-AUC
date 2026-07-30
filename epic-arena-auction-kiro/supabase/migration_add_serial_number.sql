-- Migration: Add serial_number and queue_order to players table
-- This enables deduplication and auctioneer-controlled player selection

ALTER TABLE players ADD COLUMN IF NOT EXISTS serial_number INTEGER UNIQUE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS queue_order INTEGER UNIQUE;

-- Create index for efficient search by serial_number and name
CREATE INDEX IF NOT EXISTS idx_players_serial_number ON players(serial_number);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_queue_order ON players(queue_order);

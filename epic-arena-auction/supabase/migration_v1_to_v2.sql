-- ============================================================
-- EPIC ARENA PREMIER LEAGUE MEGA AUCTION - Migration v1 -> v2
--
-- Only run this if you already executed the ORIGINAL schema.sql +
-- rpc_functions.sql and have data in your project you want to keep.
-- If you're starting fresh, just run the current schema.sql +
-- rpc_functions.sql + seed_real_roster.sql instead - skip this file.
--
-- This script is additive/idempotent-ish: it uses
-- "add column if not exists" and "create or replace function" so
-- it's safe to run more than once. It does NOT drop or rewrite any
-- existing team/player rows.
--
-- After running this, also re-run the (now v2) rpc_functions.sql
-- in full - the function *signatures* changed (admin PIN was added
-- as a new first parameter to several functions), so old function
-- versions must be replaced, not merged.
-- ============================================================

-- ---------------------------------------------------------------
-- 1. New app_config table (admin PIN store)
-- ---------------------------------------------------------------
create table if not exists app_config (
  id         integer primary key default 1 check (id = 1),
  admin_pin  text not null default '9999'
);

insert into app_config (id) values (1) on conflict (id) do nothing;

alter table app_config enable row level security;
-- Intentionally no read policy - admin_pin is only ever checked,
-- never selected, via the verify_admin_pin() RPC.

-- ---------------------------------------------------------------
-- 2. New columns on teams
-- ---------------------------------------------------------------
alter table teams add column if not exists sponsor_name text default '';
alter table teams add column if not exists captain_mobile text;
alter table teams add column if not exists captain_photo_url text;

-- Re-grant the public column list to include the new columns
-- (pin stays excluded).
revoke select on teams from anon, authenticated;
grant select (
  id, name, short_code, sponsor_name, captain_name, captain_mobile,
  captain_photo_url, purse_total, purse_remaining, roster_count,
  color_hex, logo_url, created_at
) on teams to anon, authenticated;

-- ---------------------------------------------------------------
-- 3. New columns on players + relax the role constraint to allow
--    NULL ("Unassigned") for players imported without a position.
-- ---------------------------------------------------------------
alter table players add column if not exists mobile text;
alter table players add column if not exists rating smallint not null default 0;
alter table players add column if not exists entry_fee integer;
alter table players add column if not exists source_group text;

alter table players drop constraint if exists players_rating_check;
alter table players add constraint players_rating_check check (rating between 0 and 2);

alter table players drop constraint if exists players_role_check;
alter table players add constraint players_role_check
  check (role is null or role in ('Batsman','Bowler','All-Rounder','Wicket-Keeper'));

alter table players alter column role drop not null;

-- ============================================================
-- 4. Now go run the current rpc_functions.sql in full - it will
--    CREATE OR REPLACE every function with the new admin/team PIN
--    signatures and add the new CRUD functions.
-- ============================================================

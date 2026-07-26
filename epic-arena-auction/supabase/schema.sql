-- ============================================================
-- EPIC ARENA PREMIER LEAGUE MEGA AUCTION - Database Schema (v2)
-- Run this FIRST in the Supabase SQL Editor, then rpc_functions.sql,
-- then seed_real_roster.sql (or your own seed).
--
-- v2 adds: sponsor names, captain mobile/photo, player mobile/
-- rating/entry_fee/source_group, and an app_config table that
-- backs the new admin-PIN gate for CRUD operations.
--
-- Upgrading an existing v1 project? Use migration_v1_to_v2.sql
-- instead of this file - it ALTERs your existing tables in place
-- without touching data you already have.
-- ============================================================

-- Dev-only reset. Comment out once you have real data in prod.
-- drop table if exists bid_history, auction_state, players, teams, app_config cascade;

-- ---------------------------------------------------------------
-- app_config: singleton row holding the admin PIN. Every write
-- (team/player CRUD, auction flow controls) is gated by this PIN,
-- checked server-side inside the RPC functions - not just hidden
-- in the UI - so it's real enforcement, not just a locked door
-- with an open window.
-- ---------------------------------------------------------------
create table app_config (
  id         integer primary key default 1 check (id = 1),
  admin_pin  text not null default '9999'
);

insert into app_config (id) values (1);

-- ---------------------------------------------------------------
-- teams: 8 franchises. `pin` is the frictionless owner ("user")
-- login. `sponsor_name`, `captain_name`, `captain_mobile`,
-- `captain_photo_url` are all editable via the admin CRUD screens.
-- ---------------------------------------------------------------
create table teams (
  id                  serial primary key,
  name                text not null,
  short_code          text not null unique,
  sponsor_name        text default '',
  pin                 char(4) not null unique,      -- 4-digit owner login PIN
  captain_name        text,
  captain_mobile      text,
  captain_photo_url   text,
  purse_total         integer not null default 10000,
  purse_remaining     integer not null default 10000,
  roster_count        integer not null default 1,    -- captain already occupies 1 of 7 slots
  color_hex           text default '#F5A623',
  logo_url            text,
  created_at          timestamptz default now(),
  constraint roster_within_bounds check (roster_count >= 0 and roster_count <= 7),
  constraint purse_not_negative check (purse_remaining >= 0)
);

-- ---------------------------------------------------------------
-- players: the auction pool. `role` is nullable - real-world
-- registration sheets often don't capture position, so players
-- can be imported as "Unassigned" and classified later from the
-- admin Manage screen before auction day.
-- `rating` is the sheet's star system: 0 = none, 1 = *, 2 = **.
-- `source_group` preserves the original sign-up group label
-- (e.g. "Bhai Team") purely as a historical note - it has no
-- effect on auction logic.
-- ---------------------------------------------------------------
create table players (
  id                serial primary key,
  name              text not null,
  role              text check (role is null or role in ('Batsman','Bowler','All-Rounder','Wicket-Keeper')),
  base_price        integer not null default 100,
  mobile            text,
  rating            smallint not null default 0 check (rating between 0 and 2),
  entry_fee         integer,
  source_group      text,
  photo_url         text,
  queue_order       integer not null,
  status            text not null default 'pending'
                      check (status in ('pending','in_auction','sold','unsold')),
  sold_to_team_id   integer references teams(id),
  sold_price        integer,
  created_at        timestamptz default now()
);

create unique index players_queue_order_idx on players (queue_order);

-- ---------------------------------------------------------------
-- auction_state: SINGLETON row (id is always 1) - the live state
-- every screen subscribes to.
-- ---------------------------------------------------------------
create table auction_state (
  id                        integer primary key default 1 check (id = 1),
  current_player_id         integer references players(id),
  current_highest_bid       integer not null default 0,
  current_highest_team_id   integer references teams(id),
  min_increment             integer not null default 100,
  timer_seconds             integer not null default 15,
  timer_started_at          timestamptz,
  status                    text not null default 'idle'
                              check (status in ('idle','bidding','sold','unsold')),
  updated_at                timestamptz default now()
);

insert into auction_state (id) values (1);

-- ---------------------------------------------------------------
-- bid_history: append-only audit trail. Powers the Admin UNDO button.
-- ---------------------------------------------------------------
create table bid_history (
  id           bigserial primary key,
  player_id    integer references players(id),
  team_id      integer references teams(id),
  bid_amount   integer not null,
  action       text not null default 'bid' check (action in ('bid','sold','unsold')),
  created_at   timestamptz default now()
);

create index bid_history_player_idx on bid_history (player_id, id desc);

-- ---------------------------------------------------------------
-- Realtime: broadcast row changes to every connected screen
-- ---------------------------------------------------------------
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table auction_state;
alter publication supabase_realtime add table bid_history;

-- ---------------------------------------------------------------
-- Row Level Security
-- Reads are public (Big Screen/Admin/Owner all need live state).
-- Writes are NEVER done directly against these tables - only
-- through the SECURITY DEFINER RPC functions in rpc_functions.sql,
-- which enforce every business rule AND the admin/team PIN checks
-- atomically. There are no INSERT/UPDATE/DELETE policies below on
-- purpose - that's what forces all writes through the RPC layer.
-- ---------------------------------------------------------------
alter table teams enable row level security;
alter table players enable row level security;
alter table auction_state enable row level security;
alter table bid_history enable row level security;
alter table app_config enable row level security;

create policy "public read teams" on teams for select using (true);
create policy "public read players" on players for select using (true);
create policy "public read auction_state" on auction_state for select using (true);
create policy "public read bid_history" on bid_history for select using (true);
-- app_config has NO read policy at all - the admin_pin can only ever
-- be checked (never read) via the verify_admin_pin() RPC.

-- Column-level lockdown: nobody can SELECT the `pin` column directly,
-- even though the row-level policy above allows reading the row.
-- The only legal way to check a PIN is the verify_team_pin() RPC,
-- which runs as the table owner and bypasses this grant.
revoke select on teams from anon, authenticated;
grant select (
  id, name, short_code, sponsor_name, captain_name, captain_mobile,
  captain_photo_url, purse_total, purse_remaining, roster_count,
  color_hex, logo_url, created_at
) on teams to anon, authenticated;

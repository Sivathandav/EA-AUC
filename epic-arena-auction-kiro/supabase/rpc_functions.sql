-- ============================================================
-- EPIC ARENA PREMIER LEAGUE MEGA AUCTION - RPC Functions (v2)
-- Run AFTER schema.sql. Every function is SECURITY DEFINER so it
-- runs with owner privileges (bypassing RLS/column grants) while
-- still being callable by the anon/authenticated roles below.
--
-- v2 auth model - two tiers, both enforced INSIDE these functions
-- (not just hidden in the UI, so it can't be bypassed by calling
-- the RPC directly with dev tools):
--   ADMIN  - a single shared 4-digit admin_pin (app_config table).
--            Gates: all auction-flow controls (timer, sold, unsold,
--            undo, next player) AND all team/player CRUD.
--   USER   - each team's existing 4-digit pin. Gates: placing bids
--            as that team. Verified once at login (verify_team_pin),
--            then the pin itself travels with the client and is
--            re-checked on every place_bid call - no repeated typing,
--            but no ability to bid as a team without its PIN either.
--
-- Concurrency strategy is unchanged from v1: every mutating function
-- opens with `select ... from auction_state where id = 1 for update`,
-- taking a row lock on the singleton state row so concurrent bids
-- are serialized by Postgres itself.
-- ============================================================

-- ---------------------------------------------------------------
-- assert_admin: shared guard used by every admin-gated function
-- below. Raises and aborts the whole transaction if the PIN is wrong.
-- ---------------------------------------------------------------
create or replace function assert_admin(p_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin is null or not exists (select 1 from app_config where id = 1 and admin_pin = p_pin) then
    raise exception 'Invalid admin PIN';
  end if;
end;
$$;

grant execute on function assert_admin(text) to anon, authenticated;


-- ---------------------------------------------------------------
-- verify_admin_pin: called once at admin login. Returns true/false
-- rather than throwing, since a wrong PIN here is an expected user
-- event (typo), not an exceptional one.
-- ---------------------------------------------------------------
create or replace function verify_admin_pin(p_pin text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from app_config where id = 1 and admin_pin = p_pin);
$$;

grant execute on function verify_admin_pin(text) to anon, authenticated;


-- ---------------------------------------------------------------
-- admin_change_pin: rotate the admin PIN. Requires the current one.
-- ---------------------------------------------------------------
create or replace function admin_change_pin(p_current_pin text, p_new_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_current_pin);

  if p_new_pin is null or length(p_new_pin) <> 4 or p_new_pin !~ '^[0-9]{4}$' then
    raise exception 'New admin PIN must be exactly 4 digits';
  end if;

  update app_config set admin_pin = p_new_pin where id = 1;
  return json_build_object('ok', true);
end;
$$;

grant execute on function admin_change_pin(text, text) to anon, authenticated;


-- ---------------------------------------------------------------
-- verify_team_pin: frictionless owner ("user") login. Never exposes
-- other teams' PINs (only the row matching the given pin is
-- returned, and the pin column itself is never selected out).
-- ---------------------------------------------------------------
create or replace function verify_team_pin(p_pin text)
returns table (
  id integer, name text, short_code text, sponsor_name text,
  captain_name text, captain_mobile text, captain_photo_url text,
  purse_total integer, purse_remaining integer, roster_count integer,
  color_hex text, logo_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select t.id, t.name, t.short_code, t.sponsor_name, t.captain_name,
           t.captain_mobile, t.captain_photo_url, t.purse_total,
           t.purse_remaining, t.roster_count, t.color_hex, t.logo_url
    from teams t
    where t.pin = p_pin;
end;
$$;

grant execute on function verify_team_pin(text) to anon, authenticated;


-- ---------------------------------------------------------------
-- _place_bid_internal: the atomic bidding transaction, shared by
-- both public entry points below. Deliberately NOT granted to
-- anon/authenticated - it has no credential check of its own, so
-- it must only ever be reached through place_bid() or
-- admin_place_bid(), which each perform their own auth check
-- BEFORE calling in. (A function owner can always call its own
-- other functions regardless of grants, so this still works
-- correctly when invoked from those two wrappers.)
--
-- Enforces:
--   1) player is actually the live auction item
--   2) team roster isn't already full (7/7)
--   3) bid clears current highest + minimum increment (or base price)
--   4) team isn't already the highest bidder
--   5) Purse Margin Check:
--      Max Allowable Bid = Remaining Budget
--                         - ((Remaining Empty Slots - 1) * Minimum Base Price)
-- ---------------------------------------------------------------
create or replace function _place_bid_internal(p_player_id integer, p_team_id integer, p_bid_amount integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state           auction_state%rowtype;
  v_team            teams%rowtype;
  v_min_base        integer;
  v_remaining_slots integer;
  v_max_allowable   integer;
  v_min_next_bid    integer;
begin
  -- Lock the singleton state row FIRST - this is what serializes
  -- every concurrent bid on this player into a strict queue.
  select * into v_state from auction_state where id = 1 for update;

  if v_state.status <> 'bidding' then
    raise exception 'Auction is not currently accepting bids';
  end if;

  if v_state.current_player_id is distinct from p_player_id then
    raise exception 'This player is no longer the active lot';
  end if;

  select * into v_team from teams where id = p_team_id for update;
  if not found then
    raise exception 'Unknown team';
  end if;

  if v_team.roster_count >= 7 then
    raise exception '% squad is already full (7/7) - bidding disabled', v_team.name;
  end if;

  if v_state.current_highest_team_id = p_team_id then
    raise exception '% already holds the highest bid', v_team.name;
  end if;

  if v_state.current_highest_bid = 0 then
    select base_price into v_min_next_bid from players where id = p_player_id;
  else
    v_min_next_bid := v_state.current_highest_bid + v_state.min_increment;
  end if;

  if p_bid_amount < v_min_next_bid then
    raise exception 'Bid must be at least % points', v_min_next_bid;
  end if;

  -- Purse Margin Check
  select min(base_price) into v_min_base from players;
  v_remaining_slots := 7 - v_team.roster_count;          -- includes the slot being bid on now
  v_max_allowable := v_team.purse_remaining - ((v_remaining_slots - 1) * v_min_base);

  if p_bid_amount > v_max_allowable then
    raise exception
      'Bid exceeds max allowable bid of % points - % point(s) must stay reserved for % remaining empty slot(s)',
      v_max_allowable, (v_remaining_slots - 1) * v_min_base, v_remaining_slots - 1;
  end if;

  update auction_state
    set current_highest_bid = p_bid_amount,
        current_highest_team_id = p_team_id,
        timer_started_at = now(),   -- a fresh bid resets the countdown
        updated_at = now()
    where id = 1;

  insert into bid_history (player_id, team_id, bid_amount, action)
    values (p_player_id, p_team_id, p_bid_amount, 'bid');

  return json_build_object('ok', true, 'highest_bid', p_bid_amount, 'team_id', p_team_id);
end;
$$;

-- Intentionally no grant here - see comment above.


-- ---------------------------------------------------------------
-- place_bid: the Franchise Owner Dashboard entry point. Requires
-- the bidding team's own PIN (checked server-side) so a bid can't
-- be placed "as" another team just by knowing its numeric id.
-- ---------------------------------------------------------------
create or replace function place_bid(p_player_id integer, p_team_id integer, p_team_pin text, p_bid_amount integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team teams%rowtype;
begin
  select * into v_team from teams where id = p_team_id;
  if not found or v_team.pin is distinct from p_team_pin then
    raise exception 'Invalid team credentials';
  end if;

  return _place_bid_internal(p_player_id, p_team_id, p_bid_amount);
end;
$$;

grant execute on function place_bid(integer, integer, text, integer) to anon, authenticated;


-- ---------------------------------------------------------------
-- admin_place_bid: the Auctioneer Console entry point. During a
-- live oral auction the admin records each verbal bid on the
-- relevant team's behalf, so this authorizes via the admin PIN
-- instead of requiring every team's individual PIN at the podium.
-- ---------------------------------------------------------------
create or replace function admin_place_bid(p_admin_pin text, p_player_id integer, p_team_id integer, p_bid_amount integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_admin_pin);
  return _place_bid_internal(p_player_id, p_team_id, p_bid_amount);
end;
$$;

grant execute on function admin_place_bid(text, integer, integer, integer) to anon, authenticated;


-- ---------------------------------------------------------------
-- start_timer: admin presses Space to start/restart the countdown.
-- ---------------------------------------------------------------
create or replace function start_timer(p_admin_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_admin_pin);
  update auction_state set timer_started_at = now(), updated_at = now() where id = 1;
end;
$$;

grant execute on function start_timer(text) to anon, authenticated;


-- ---------------------------------------------------------------
-- load_next_player: pulls the next pending player into the hot seat.
-- ---------------------------------------------------------------
create or replace function load_next_player(p_admin_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock_dummy integer;
  v_next       players%rowtype;
begin
  perform assert_admin(p_admin_pin);

  select id into v_lock_dummy from auction_state where id = 1 for update;

  select * into v_next from players
    where status = 'pending'
    order by queue_order asc
    limit 1;

  if not found then
    update auction_state
      set status = 'idle', current_player_id = null, current_highest_bid = 0,
          current_highest_team_id = null, timer_started_at = null, updated_at = now()
      where id = 1;
    return json_build_object('ok', true, 'done', true);
  end if;

  update players set status = 'in_auction' where id = v_next.id;

  update auction_state
    set current_player_id = v_next.id,
        current_highest_bid = 0,
        current_highest_team_id = null,
        status = 'bidding',
        timer_started_at = null,
        updated_at = now()
    where id = 1;

  return json_build_object('ok', true, 'player_id', v_next.id);
end;
$$;

grant execute on function load_next_player(text) to anon, authenticated;


-- ---------------------------------------------------------------
-- mark_sold: finalizes the sale to the current highest bidder.
-- ---------------------------------------------------------------
create or replace function mark_sold(p_admin_pin text, p_player_id integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state auction_state%rowtype;
  v_team  teams%rowtype;
begin
  perform assert_admin(p_admin_pin);

  select * into v_state from auction_state where id = 1 for update;

  if v_state.current_player_id is distinct from p_player_id then
    raise exception 'This is not the active lot';
  end if;

  if v_state.current_highest_team_id is null then
    raise exception 'No bids placed on this player - use mark_unsold instead';
  end if;

  select * into v_team from teams where id = v_state.current_highest_team_id for update;

  update teams
    set purse_remaining = purse_remaining - v_state.current_highest_bid,
        roster_count = roster_count + 1
    where id = v_team.id;

  update players
    set status = 'sold', sold_to_team_id = v_team.id, sold_price = v_state.current_highest_bid
    where id = p_player_id;

  insert into bid_history (player_id, team_id, bid_amount, action)
    values (p_player_id, v_team.id, v_state.current_highest_bid, 'sold');

  -- Status flips to 'sold' as a transient flag the Big Screen watches
  -- to fire the hammer-drop animation. load_next_player() moves on.
  update auction_state set status = 'sold', updated_at = now() where id = 1;

  return json_build_object('ok', true, 'team_id', v_team.id, 'price', v_state.current_highest_bid);
end;
$$;

grant execute on function mark_sold(text, integer) to anon, authenticated;


-- ---------------------------------------------------------------
-- mark_unsold: no bids reached - player goes to the unsold pile.
-- ---------------------------------------------------------------
create or replace function mark_unsold(p_admin_pin text, p_player_id integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state auction_state%rowtype;
begin
  perform assert_admin(p_admin_pin);

  select * into v_state from auction_state where id = 1 for update;

  if v_state.current_player_id is distinct from p_player_id then
    raise exception 'This is not the active lot';
  end if;

  update players set status = 'unsold' where id = p_player_id;

  insert into bid_history (player_id, team_id, bid_amount, action)
    values (p_player_id, v_state.current_highest_team_id, coalesce(v_state.current_highest_bid, 0), 'unsold');

  update auction_state set status = 'unsold', updated_at = now() where id = 1;

  return json_build_object('ok', true);
end;
$$;

grant execute on function mark_unsold(text, integer) to anon, authenticated;


-- ---------------------------------------------------------------
-- undo_last_action: single-level undo of the most recent bid,
-- sale, or unsold call - covers the classic "wrong paddle number"
-- mis-press at live auction speed.
-- ---------------------------------------------------------------
create or replace function undo_last_action(p_admin_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last bid_history%rowtype;
  v_prev bid_history%rowtype;
begin
  perform assert_admin(p_admin_pin);

  perform id from auction_state where id = 1 for update;

  select * into v_last from bid_history order by id desc limit 1;
  if not found then
    raise exception 'Nothing to undo';
  end if;

  if v_last.action = 'bid' then
    select * into v_prev from bid_history
      where player_id = v_last.player_id and action = 'bid' and id < v_last.id
      order by id desc limit 1;

    update auction_state
      set current_highest_bid = coalesce(v_prev.bid_amount, 0),
          current_highest_team_id = v_prev.team_id,
          updated_at = now()
      where id = 1;

  elsif v_last.action = 'sold' then
    update teams
      set purse_remaining = purse_remaining + v_last.bid_amount,
          roster_count = roster_count - 1
      where id = v_last.team_id;

    update players
      set status = 'in_auction', sold_to_team_id = null, sold_price = null
      where id = v_last.player_id;

    update auction_state
      set current_player_id = v_last.player_id,
          current_highest_bid = v_last.bid_amount,
          current_highest_team_id = v_last.team_id,
          status = 'bidding',
          updated_at = now()
      where id = 1;

  elsif v_last.action = 'unsold' then
    update players set status = 'in_auction' where id = v_last.player_id;

    update auction_state
      set current_player_id = v_last.player_id,
          current_highest_bid = coalesce(v_last.bid_amount, 0),
          current_highest_team_id = v_last.team_id,
          status = 'bidding',
          updated_at = now()
      where id = 1;
  end if;

  delete from bid_history where id = v_last.id;

  return json_build_object('ok', true, 'undone_action', v_last.action);
end;
$$;

grant execute on function undo_last_action(text) to anon, authenticated;


-- ---------------------------------------------------------------
-- admin_list_team_pins: the `teams.pin` column is locked down from
-- normal reads (see schema.sql's column grants) so that public
-- visitors and team owners can never see each other's PINs. The
-- admin, however, already has full CRUD power over every team and
-- player - hiding PINs from them too would just be friction, not
-- real protection - so this lets the Manage screen display and
-- pre-fill them for the person actually running the event.
-- ---------------------------------------------------------------
create or replace function admin_list_team_pins(p_admin_pin text)
returns table (team_id integer, pin text)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_admin_pin);
  return query select id, teams.pin from teams order by id;
end;
$$;

grant execute on function admin_list_team_pins(text) to anon, authenticated;


-- ============================================================
-- ADMIN CRUD - Teams
-- ============================================================

create or replace function admin_create_team(
  p_admin_pin text,
  p_name text,
  p_short_code text,
  p_pin text,
  p_sponsor_name text default '',
  p_captain_name text default null,
  p_captain_mobile text default null,
  p_captain_photo_url text default null,
  p_purse_total integer default 10000,
  p_color_hex text default '#F5A623',
  p_logo_url text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id integer;
begin
  perform assert_admin(p_admin_pin);

  if p_pin is null or length(p_pin) <> 4 or p_pin !~ '^[0-9]{4}$' then
    raise exception 'Team PIN must be exactly 4 digits';
  end if;

  insert into teams (
    name, short_code, sponsor_name, pin, captain_name, captain_mobile,
    captain_photo_url, purse_total, purse_remaining, roster_count, color_hex, logo_url
  )
  values (
    p_name, p_short_code, p_sponsor_name, p_pin, p_captain_name, p_captain_mobile,
    p_captain_photo_url, p_purse_total, p_purse_total, 1, p_color_hex, p_logo_url
  )
  returning id into v_id;

  return json_build_object('ok', true, 'id', v_id);
end;
$$;

grant execute on function admin_create_team(
  text, text, text, text, text, text, text, text, integer, text, text
) to anon, authenticated;


-- p_* fields default to NULL meaning "leave unchanged" (COALESCE pattern).
create or replace function admin_update_team(
  p_admin_pin text,
  p_team_id integer,
  p_name text default null,
  p_short_code text default null,
  p_sponsor_name text default null,
  p_pin text default null,
  p_captain_name text default null,
  p_captain_mobile text default null,
  p_captain_photo_url text default null,
  p_purse_total integer default null,
  p_purse_remaining integer default null,
  p_color_hex text default null,
  p_logo_url text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_admin_pin);

  if p_pin is not null and (length(p_pin) <> 4 or p_pin !~ '^[0-9]{4}$') then
    raise exception 'Team PIN must be exactly 4 digits';
  end if;

  update teams set
    name = coalesce(p_name, name),
    short_code = coalesce(p_short_code, short_code),
    sponsor_name = coalesce(p_sponsor_name, sponsor_name),
    pin = coalesce(p_pin, pin),
    captain_name = coalesce(p_captain_name, captain_name),
    captain_mobile = coalesce(p_captain_mobile, captain_mobile),
    captain_photo_url = coalesce(p_captain_photo_url, captain_photo_url),
    purse_total = coalesce(p_purse_total, purse_total),
    purse_remaining = coalesce(p_purse_remaining, purse_remaining),
    color_hex = coalesce(p_color_hex, color_hex),
    logo_url = coalesce(p_logo_url, logo_url)
  where id = p_team_id;

  if not found then
    raise exception 'Team not found';
  end if;

  return json_build_object('ok', true);
end;
$$;

grant execute on function admin_update_team(
  text, integer, text, text, text, text, text, text, text, integer, integer, text, text
) to anon, authenticated;


create or replace function admin_delete_team(p_admin_pin text, p_team_id integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_admin_pin);

  if exists (select 1 from players where sold_to_team_id = p_team_id) then
    raise exception 'Cannot delete a team that already owns purchased players - reassign or unsell them first';
  end if;

  if exists (select 1 from auction_state where current_highest_team_id = p_team_id) then
    raise exception 'This team currently holds the highest bid on the active lot - resolve that first';
  end if;

  delete from teams where id = p_team_id;

  if not found then
    raise exception 'Team not found';
  end if;

  return json_build_object('ok', true);
end;
$$;

grant execute on function admin_delete_team(text, integer) to anon, authenticated;


-- ============================================================
-- ADMIN CRUD - Players
-- ============================================================

create or replace function admin_create_player(
  p_admin_pin text,
  p_name text,
  p_role text default null,
  p_base_price integer default 100,
  p_queue_order integer default null,
  p_photo_url text default null,
  p_mobile text default null,
  p_rating smallint default 0,
  p_entry_fee integer default null,
  p_source_group text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id integer;
  v_order integer;
begin
  perform assert_admin(p_admin_pin);

  if p_role is not null and p_role not in ('Batsman','Bowler','All-Rounder','Wicket-Keeper') then
    raise exception 'Role must be one of Batsman, Bowler, All-Rounder, Wicket-Keeper';
  end if;

  v_order := coalesce(p_queue_order, (select coalesce(max(queue_order), 0) + 1 from players));

  insert into players (
    name, role, base_price, queue_order, photo_url, mobile, rating, entry_fee, source_group
  )
  values (
    p_name, p_role, p_base_price, v_order, p_photo_url, p_mobile,
    coalesce(p_rating, 0), p_entry_fee, p_source_group
  )
  returning id into v_id;

  return json_build_object('ok', true, 'id', v_id);
end;
$$;

grant execute on function admin_create_player(
  text, text, text, integer, integer, text, text, smallint, integer, text
) to anon, authenticated;


create or replace function admin_update_player(
  p_admin_pin text,
  p_player_id integer,
  p_name text default null,
  p_role text default null,
  p_base_price integer default null,
  p_queue_order integer default null,
  p_photo_url text default null,
  p_mobile text default null,
  p_rating smallint default null,
  p_entry_fee integer default null,
  p_source_group text default null,
  p_clear_role boolean default false
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_admin_pin);

  if p_role is not null and p_role not in ('Batsman','Bowler','All-Rounder','Wicket-Keeper') then
    raise exception 'Role must be one of Batsman, Bowler, All-Rounder, Wicket-Keeper';
  end if;

  update players set
    name = coalesce(p_name, name),
    role = case when p_clear_role then null else coalesce(p_role, role) end,
    base_price = coalesce(p_base_price, base_price),
    queue_order = coalesce(p_queue_order, queue_order),
    photo_url = coalesce(p_photo_url, photo_url),
    mobile = coalesce(p_mobile, mobile),
    rating = coalesce(p_rating, rating),
    entry_fee = coalesce(p_entry_fee, entry_fee),
    source_group = coalesce(p_source_group, source_group)
  where id = p_player_id;

  if not found then
    raise exception 'Player not found';
  end if;

  return json_build_object('ok', true);
end;
$$;

grant execute on function admin_update_player(
  text, integer, text, text, integer, integer, text, text, smallint, integer, text, boolean
) to anon, authenticated;


-- Deleting a sold player automatically refunds the team's purse and
-- frees the roster slot, so the books never go out of balance.
create or replace function admin_delete_player(p_admin_pin text, p_player_id integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row players%rowtype;
begin
  perform assert_admin(p_admin_pin);

  select * into v_row from players where id = p_player_id;
  if not found then
    raise exception 'Player not found';
  end if;

  if v_row.status = 'sold' and v_row.sold_to_team_id is not null then
    update teams
      set purse_remaining = purse_remaining + coalesce(v_row.sold_price, 0),
          roster_count = roster_count - 1
      where id = v_row.sold_to_team_id;
  end if;

  if exists (select 1 from auction_state where current_player_id = p_player_id) then
    update auction_state
      set current_player_id = null, current_highest_bid = 0,
          current_highest_team_id = null, status = 'idle', timer_started_at = null,
          updated_at = now()
      where id = 1;
  end if;

  delete from bid_history where player_id = p_player_id;
  delete from players where id = p_player_id;

  return json_build_object('ok', true);
end;
$$;

grant execute on function admin_delete_player(text, integer) to anon, authenticated;


-- ---------------------------------------------------------------
-- admin_reset_auction: dev/rehearsal helper - wipes all sale
-- results and bid history, restores every team's purse/roster, and
-- resets every player back to 'pending'. Does NOT delete teams or
-- players themselves. Handy for a practice run before the real event.
-- ---------------------------------------------------------------
create or replace function admin_reset_auction(p_admin_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  perform assert_admin(p_admin_pin);

  delete from bid_history;

  update players set status = 'pending', sold_to_team_id = null, sold_price = null;

  update teams set purse_remaining = purse_total, roster_count = 1;

  update auction_state
    set current_player_id = null, current_highest_bid = 0, current_highest_team_id = null,
        status = 'idle', timer_started_at = null, updated_at = now()
    where id = 1;

  return json_build_object('ok', true);
end;
$$;

grant execute on function admin_reset_auction(text) to anon, authenticated;

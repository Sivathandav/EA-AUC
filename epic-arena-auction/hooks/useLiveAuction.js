'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * useLiveAuction
 * Single source of truth for every screen (Big Screen, Admin, Owner).
 * - Loads initial snapshot from Postgres.
 * - Subscribes to postgres_changes on teams/players/auction_state so
 *   every connected screen re-renders within one realtime round trip
 *   of any write (which itself only ever happens through the RPC
 *   functions - see supabase/rpc_functions.sql).
 *
 * v2: auction-flow actions (start/next/sold/unsold/undo) now require
 * an admin PIN, and placeBid requires the bidding team's own PIN.
 * Both are just passed straight through as function arguments - the
 * caller (an admin page reading from AdminPinContext, or the owner
 * dashboard reading its stored team pin) supplies them.
 */
export function useLiveAuction() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [auctionState, setAuctionState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  const refreshAll = useCallback(async () => {
    const [teamsRes, playersRes, stateRes] = await Promise.all([
      supabase.from('teams').select('*').order('id'),
      supabase.from('players').select('*').order('queue_order'),
      supabase.from('auction_state').select('*').eq('id', 1).single(),
    ]);

    if (teamsRes.error || playersRes.error || stateRes.error) {
      setError(teamsRes.error || playersRes.error || stateRes.error);
    } else {
      setTeams(teamsRes.data);
      setPlayers(playersRes.data);
      setAuctionState(stateRes.data);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();

    const channel = supabase
      .channel('auction-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_state' }, (payload) => {
        setAuctionState(payload.new);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, (payload) => {
        setTeams((prev) => {
          const next = [...prev];
          const idx = next.findIndex((t) => t.id === payload.new?.id);
          if (payload.eventType === 'DELETE') return next.filter((t) => t.id !== payload.old.id);
          if (idx === -1) return [...next, payload.new].sort((a, b) => a.id - b.id);
          next[idx] = payload.new;
          return next;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        setPlayers((prev) => {
          const next = [...prev];
          const idx = next.findIndex((p) => p.id === payload.new?.id);
          if (payload.eventType === 'DELETE') return next.filter((p) => p.id !== payload.old.id);
          if (idx === -1) return [...next, payload.new].sort((a, b) => a.queue_order - b.queue_order);
          next[idx] = payload.new;
          return next;
        });
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshAll]);

  const currentPlayer = useMemo(
    () => players.find((p) => p.id === auctionState?.current_player_id) || null,
    [players, auctionState]
  );

  const currentHighestTeam = useMemo(
    () => teams.find((t) => t.id === auctionState?.current_highest_team_id) || null,
    [teams, auctionState]
  );

  const pendingQueue = useMemo(
    () => players.filter((p) => p.status === 'pending').sort((a, b) => a.queue_order - b.queue_order),
    [players]
  );

  const unassignedRoleCount = useMemo(() => players.filter((p) => !p.role).length, [players]);

  // ---- Auction-flow actions (admin PIN required) ----

  const placeBid = useCallback(async (teamId, teamPin, bidAmount) => {
    if (!auctionState?.current_player_id) return { ok: false, error: 'No active player' };
    const { data, error } = await supabase.rpc('place_bid', {
      p_player_id: auctionState.current_player_id,
      p_team_id: teamId,
      p_team_pin: teamPin,
      p_bid_amount: bidAmount,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }, [auctionState]);

  const markSold = useCallback(async (adminPin) => {
    if (!auctionState?.current_player_id) return { ok: false, error: 'No active player' };
    const { data, error } = await supabase.rpc('mark_sold', {
      p_admin_pin: adminPin,
      p_player_id: auctionState.current_player_id,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }, [auctionState]);

  const markUnsold = useCallback(async (adminPin) => {
    if (!auctionState?.current_player_id) return { ok: false, error: 'No active player' };
    const { data, error } = await supabase.rpc('mark_unsold', {
      p_admin_pin: adminPin,
      p_player_id: auctionState.current_player_id,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }, [auctionState]);

  const undoLastAction = useCallback(async (adminPin) => {
    const { data, error } = await supabase.rpc('undo_last_action', { p_admin_pin: adminPin });
    if (error) return { ok: false, error: error.message };
    return data;
  }, []);

  const loadNextPlayer = useCallback(async (adminPin) => {
    const { data, error } = await supabase.rpc('load_next_player', { p_admin_pin: adminPin });
    if (error) return { ok: false, error: error.message };
    return data;
  }, []);

  const startTimer = useCallback(async (adminPin) => {
    const { error } = await supabase.rpc('start_timer', { p_admin_pin: adminPin });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const resetAuction = useCallback(async (adminPin) => {
    const { data, error } = await supabase.rpc('admin_reset_auction', { p_admin_pin: adminPin });
    if (error) return { ok: false, error: error.message };
    return data;
  }, []);

  // ---- Team CRUD (admin PIN required) ----

  const createTeam = useCallback(async (adminPin, fields) => {
    const { data, error } = await supabase.rpc('admin_create_team', {
      p_admin_pin: adminPin,
      p_name: fields.name,
      p_short_code: fields.short_code,
      p_pin: fields.pin,
      p_sponsor_name: fields.sponsor_name ?? '',
      p_captain_name: fields.captain_name ?? null,
      p_captain_mobile: fields.captain_mobile ?? null,
      p_captain_photo_url: fields.captain_photo_url ?? null,
      p_purse_total: fields.purse_total ?? 10000,
      p_color_hex: fields.color_hex ?? '#F5A623',
      p_logo_url: fields.logo_url ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }, []);

  const updateTeam = useCallback(async (adminPin, teamId, fields) => {
    const { data, error } = await supabase.rpc('admin_update_team', {
      p_admin_pin: adminPin,
      p_team_id: teamId,
      p_name: fields.name ?? null,
      p_short_code: fields.short_code ?? null,
      p_sponsor_name: fields.sponsor_name ?? null,
      p_pin: fields.pin ?? null,
      p_captain_name: fields.captain_name ?? null,
      p_captain_mobile: fields.captain_mobile ?? null,
      p_captain_photo_url: fields.captain_photo_url ?? null,
      p_purse_total: fields.purse_total ?? null,
      p_purse_remaining: fields.purse_remaining ?? null,
      p_color_hex: fields.color_hex ?? null,
      p_logo_url: fields.logo_url ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }, []);

  const deleteTeam = useCallback(async (adminPin, teamId) => {
    const { data, error } = await supabase.rpc('admin_delete_team', {
      p_admin_pin: adminPin,
      p_team_id: teamId,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }, []);

  // Admin-only: teams.pin is otherwise unreadable (see schema.sql
  // column grants). Returns { ok, pins: { [teamId]: '1234', ... } }.
  const listTeamPins = useCallback(async (adminPin) => {
    const { data, error } = await supabase.rpc('admin_list_team_pins', { p_admin_pin: adminPin });
    if (error) return { ok: false, error: error.message };
    const map = {};
    for (const row of data) map[row.team_id] = row.pin;
    return { ok: true, pins: map };
  }, []);

  // ---- Player CRUD (admin PIN required) ----

  const createPlayer = useCallback(async (adminPin, fields) => {
    const { data, error } = await supabase.rpc('admin_create_player', {
      p_admin_pin: adminPin,
      p_name: fields.name,
      p_role: fields.role ?? null,
      p_base_price: fields.base_price ?? 100,
      p_queue_order: fields.queue_order ?? null,
      p_photo_url: fields.photo_url ?? null,
      p_mobile: fields.mobile ?? null,
      p_rating: fields.rating ?? 0,
      p_entry_fee: fields.entry_fee ?? null,
      p_source_group: fields.source_group ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }, []);

  const updatePlayer = useCallback(async (adminPin, playerId, fields) => {
    const { data, error } = await supabase.rpc('admin_update_player', {
      p_admin_pin: adminPin,
      p_player_id: playerId,
      p_name: fields.name ?? null,
      p_role: fields.role ?? null,
      p_base_price: fields.base_price ?? null,
      p_queue_order: fields.queue_order ?? null,
      p_photo_url: fields.photo_url ?? null,
      p_mobile: fields.mobile ?? null,
      p_rating: fields.rating ?? null,
      p_entry_fee: fields.entry_fee ?? null,
      p_source_group: fields.source_group ?? null,
      p_clear_role: fields.clear_role ?? false,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }, []);

  const deletePlayer = useCallback(async (adminPin, playerId) => {
    const { data, error } = await supabase.rpc('admin_delete_player', {
      p_admin_pin: adminPin,
      p_player_id: playerId,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }, []);

  // ---- Admin account ----

  const changeAdminPin = useCallback(async (currentPin, newPin) => {
    const { data, error } = await supabase.rpc('admin_change_pin', {
      p_current_pin: currentPin,
      p_new_pin: newPin,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  }, []);

  return {
    teams,
    players,
    pendingQueue,
    auctionState,
    currentPlayer,
    currentHighestTeam,
    unassignedRoleCount,
    loading,
    error,
    refreshAll,
    // auction flow
    placeBid,
    markSold,
    markUnsold,
    undoLastAction,
    loadNextPlayer,
    startTimer,
    resetAuction,
    // team CRUD
    createTeam,
    updateTeam,
    deleteTeam,
    listTeamPins,
    // player CRUD
    createPlayer,
    updatePlayer,
    deletePlayer,
    // admin account
    changeAdminPin,
  };
}

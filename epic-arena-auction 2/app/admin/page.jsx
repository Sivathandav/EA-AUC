'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useLiveAuction } from '../../hooks/useLiveAuction';
import { useAdminSession } from '../../hooks/useAdminSession';
import { useAdminPin } from '../../lib/adminContext';
import BidTicker from '../../components/BidTicker';

const statusColor = {
  pending: 'text-slate-soft',
  in_auction: 'text-gold',
  sold: 'text-turf',
  unsold: 'text-danger',
};

export default function AdminConsolePage() {
  const adminPin = useAdminPin();
  const { logout } = useAdminSession();

  const {
    teams,
    players,
    auctionState,
    currentPlayer,
    currentHighestTeam,
    unassignedRoleCount,
    loading,
    markSold,
    markUnsold,
    undoLastAction,
    loadNextPlayer,
    startTimer,
  } = useLiveAuction();

  const [toast, setToast] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);

  const flash = useCallback((msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2600);
  }, []);

  // Local countdown display, ticking off timer_started_at + timer_seconds.
  // Purely cosmetic - the source of truth (bidding open/closed) stays server-side.
  useEffect(() => {
    if (!auctionState?.timer_started_at) {
      setSecondsLeft(null);
      return;
    }
    const started = new Date(auctionState.timer_started_at).getTime();
    const total = (auctionState.timer_seconds ?? 15) * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((started + total - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [auctionState?.timer_started_at, auctionState?.timer_seconds]);

  // The admin console records each verbal bid on a team's behalf
  // (standard live-auction flow), so it authorizes via the admin PIN
  // through a dedicated RPC rather than needing every team's
  // individual PIN at the podium.
  const assignBidToTeam = useCallback(
    async (team) => {
      if (!auctionState?.current_player_id) return;
      const currentBid = auctionState.current_highest_bid || 0;
      const nextBid = currentBid === 0 ? currentPlayer?.base_price ?? 0 : currentBid + (auctionState.min_increment ?? 100);

      const { data, error } = await supabase.rpc('admin_place_bid', {
        p_admin_pin: adminPin,
        p_player_id: auctionState.current_player_id,
        p_team_id: team.id,
        p_bid_amount: nextBid,
      });

      if (error) flash(error.message, true);
      else flash(`${team.short_code} bids ${nextBid.toLocaleString('en-IN')}`);
    },
    [auctionState, currentPlayer, adminPin, flash]
  );

  // ---- Keyboard shortcuts: this is the whole point of the console ----
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        startTimer(adminPin);
        flash('Timer started');
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 8) {
        const team = [...teams].sort((a, b) => a.id - b.id)[num - 1];
        if (team) assignBidToTeam(team);
        return;
      }

      if (e.key.toLowerCase() === 's') {
        markSold(adminPin).then((res) => (res.ok ? flash('SOLD!') : flash(res.error, true)));
      }
      if (e.key.toLowerCase() === 'u') {
        markUnsold(adminPin).then((res) => (res.ok ? flash('Marked UNSOLD') : flash(res.error, true)));
      }
      if (e.key.toLowerCase() === 'z') {
        undoLastAction(adminPin).then((res) => (res.ok ? flash(`Undid last ${res.undone_action}`) : flash(res.error, true)));
      }
      if (e.key.toLowerCase() === 'n') {
        loadNextPlayer(adminPin);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [teams, assignBidToTeam, markSold, markUnsold, undoLastAction, loadNextPlayer, startTimer, flash, adminPin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center">
        <p className="font-display text-3xl text-gold tracking-widest">LOADING CONSOLE…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stadium flex flex-col lg:flex-row text-floodlight">
      {/* Player queue sidebar */}
      <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-stadium-line p-4 overflow-y-auto max-h-64 lg:max-h-screen lg:h-screen">
        <p className="font-mono text-xs text-slate-soft tracking-widest mb-3">PLAYER QUEUE</p>
        <div className="flex flex-col gap-1">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                p.id === currentPlayer?.id ? 'arena-panel border border-gold/50' : ''
              }`}
            >
              <span className="truncate">{p.queue_order}. {p.name}</span>
              <span className={`font-mono text-xs uppercase ${statusColor[p.status]}`}>{p.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main control panel */}
      <main className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl tracking-wide">AUCTIONEER CONSOLE</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/manage"
              className="font-mono text-xs arena-panel rounded-full px-4 py-2 hover:border-gold border border-transparent transition-colors"
            >
              MANAGE TEAMS &amp; PLAYERS
            </Link>
            <button
              onClick={logout}
              className="font-mono text-xs arena-panel rounded-full px-4 py-2 hover:border-danger border border-transparent transition-colors"
            >
              LOG OUT
            </button>
          </div>
        </div>

        {unassignedRoleCount > 0 && (
          <div className="arena-panel border border-gold/40 rounded-xl px-4 py-2 text-sm font-mono text-gold">
            {unassignedRoleCount} player{unassignedRoleCount === 1 ? '' : 's'} still need a role assigned —{' '}
            <Link href="/admin/manage" className="underline">
              classify them in Manage
            </Link>
          </div>
        )}

        <div className="hidden md:block font-mono text-xs text-slate-soft">
          SPACE=timer &nbsp;1-8=bid &nbsp;S=sold &nbsp;U=unsold &nbsp;Z=undo &nbsp;N=next
        </div>

        <div className="arena-panel rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="font-mono text-xs text-slate-soft tracking-widest">ON THE BLOCK</p>
            <h2 className="font-display text-4xl">{currentPlayer?.name ?? '—'}</h2>
            <p className="text-slate-soft text-sm">
              {currentPlayer?.role ?? 'Unassigned role'} · base {currentPlayer?.base_price?.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-slate-soft tracking-widest">HIGHEST BID</p>
            <BidTicker value={auctionState?.current_highest_bid ?? 0} className="text-5xl text-gold" />
            <p className="text-sm mt-1" style={{ color: currentHighestTeam?.color_hex }}>
              {currentHighestTeam?.name ?? 'no bids yet'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-slate-soft tracking-widest">TIMER</p>
            <p className={`font-display text-5xl ${secondsLeft <= 5 ? 'text-danger' : 'text-floodlight'}`}>
              {secondsLeft ?? '--'}
            </p>
          </div>
        </div>

        {/* Team hotkey grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...teams]
            .sort((a, b) => a.id - b.id)
            .map((team, i) => (
              <button
                key={team.id}
                onClick={() => assignBidToTeam(team)}
                disabled={team.roster_count >= 7}
                className="arena-panel rounded-xl p-3 text-left hover:border-gold border border-transparent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-soft">[{i + 1}]</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: team.color_hex }}
                  />
                </div>
                <p className="font-display text-xl leading-tight mt-1">{team.short_code}</p>
                <p className="font-mono text-xs text-slate-soft">
                  {team.purse_remaining.toLocaleString('en-IN')} pts · {team.roster_count}/7
                </p>
              </button>
            ))}
        </div>

        {/* Master action buttons */}
        <div className="flex flex-wrap gap-3 mt-auto">
          <button
            onClick={async () => {
              const res = await markSold(adminPin);
              flash(res.ok ? 'SOLD!' : res.error, !res.ok);
            }}
            className="flex-1 min-w-[45%] md:min-w-0 bg-turf hover:brightness-110 transition-all rounded-xl py-4 font-display text-2xl tracking-widest"
          >
            SOLD
          </button>
          <button
            onClick={async () => {
              const res = await markUnsold(adminPin);
              flash(res.ok ? 'Marked UNSOLD' : res.error, !res.ok);
            }}
            className="flex-1 min-w-[45%] md:min-w-0 bg-danger hover:brightness-110 transition-all rounded-xl py-4 font-display text-2xl tracking-widest"
          >
            UNSOLD
          </button>
          <button
            onClick={async () => {
              const res = await undoLastAction(adminPin);
              flash(res.ok ? `Undid last ${res.undone_action}` : res.error, !res.ok);
            }}
            className="flex-1 min-w-[45%] md:min-w-0 arena-panel hover:border-gold border border-transparent transition-colors rounded-xl py-4 font-display text-2xl tracking-widest"
          >
            UNDO
          </button>
          <button
            onClick={() => loadNextPlayer(adminPin)}
            className="flex-1 min-w-[45%] md:min-w-0 bg-gold text-stadium hover:brightness-110 transition-all rounded-xl py-4 font-display text-2xl tracking-widest"
          >
            NEXT PLAYER
          </button>
        </div>

        {toast && (
          <div
            className={`fixed bottom-6 right-6 arena-panel rounded-xl px-5 py-3 font-mono text-sm border ${
              toast.isError ? 'border-danger text-danger' : 'border-gold text-gold'
            }`}
          >
            {toast.msg}
          </div>
        )}
      </main>
    </div>
  );
}

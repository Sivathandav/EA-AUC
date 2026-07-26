'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLiveAuction } from '../../hooks/useLiveAuction';
import BidTicker from '../../components/BidTicker';
import PinGate from '../../components/PinGate';

const SESSION_KEY = 'epicArena.teamSession'; // { teamId, pin }

export default function OwnerDashboardPage() {
  const [session, setSession] = useState(undefined); // undefined = checking storage

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    setSession(stored ? JSON.parse(stored) : null);
  }, []);

  const { teams, auctionState, currentPlayer, currentHighestTeam, loading, placeBid } = useLiveAuction();

  const myTeam = useMemo(() => teams.find((t) => t.id === session?.teamId) || null, [teams, session]);

  const [toast, setToast] = useState(null);
  const flash = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2200);
  };

  const loginWithPin = async (pin) => {
    const { data, error } = await supabase.rpc('verify_team_pin', { p_pin: pin });
    if (error || !data || data.length === 0) {
      return { ok: false, error: 'Incorrect PIN - ask the auctioneer to confirm your team PIN.' };
    }
    const team = data[0];
    const newSession = { teamId: team.id, pin };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
    return { ok: true };
  };

  if (session === undefined || loading) {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center">
        <p className="font-display text-2xl text-gold tracking-widest">LOADING…</p>
      </div>
    );
  }

  if (session === null || !myTeam) {
    return (
      <PinGate
        title="TEAM OWNER LOGIN"
        placeholderLabel="ENTER 4-DIGIT TEAM PIN"
        buttonLabel="ENTER DUGOUT"
        onSubmit={loginWithPin}
      />
    );
  }

  const isMyBid = currentHighestTeam?.id === myTeam.id;
  const rosterFull = myTeam.roster_count >= 7;
  const currentBid = auctionState?.current_highest_bid ?? 0;
  const minIncrement = auctionState?.min_increment ?? 100;
  const nextMinBid = currentBid === 0 ? currentPlayer?.base_price ?? 0 : currentBid + minIncrement;

  const bidIncrements = [minIncrement, minIncrement * 2, minIncrement * 5];

  const handleBid = async (amount) => {
    const res = await placeBid(myTeam.id, session.pin, amount);
    if (!res.ok) flash(res.error, true);
    else flash(`Bid placed: ${amount.toLocaleString('en-IN')}`);
  };

  return (
    <div className="min-h-screen bg-stadium flex flex-col text-floodlight">
      {/* Header: my team status */}
      <header className="arena-panel border-b border-stadium-line p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: myTeam.color_hex }} />
          <div>
            <p className="font-display text-xl leading-none">{myTeam.name}</p>
            {myTeam.sponsor_name && <p className="font-mono text-[10px] text-slate-soft">{myTeam.sponsor_name}</p>}
            <p className="font-mono text-xs text-slate-soft">{myTeam.roster_count}/7 slots filled</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-slate-soft">PURSE</p>
          <p className="font-display text-2xl text-gold">{myTeam.purse_remaining.toLocaleString('en-IN')}</p>
        </div>
      </header>

      {/* Active player */}
      <main className="flex-1 p-4 flex flex-col gap-4">
        {currentPlayer ? (
          <div className="arena-panel rounded-2xl overflow-hidden border border-gold/30">
            <div className="aspect-video bg-stadium-line">
              {currentPlayer.photo_url ? (
                <img src={currentPlayer.photo_url} alt={currentPlayer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-6xl text-slate-soft/40">
                  {currentPlayer.name?.[0]}
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-display text-3xl">{currentPlayer.name}</h2>
              <p className="font-mono text-sm text-slate-soft">
                {currentPlayer.role || 'Unassigned role'} · base {currentPlayer.base_price.toLocaleString('en-IN')}
                {currentPlayer.rating > 0 && <span className="text-gold"> · {'★'.repeat(currentPlayer.rating)}</span>}
              </p>
            </div>
          </div>
        ) : (
          <div className="arena-panel rounded-2xl p-8 text-center">
            <p className="font-display text-2xl text-slate-soft">Waiting for next lot…</p>
          </div>
        )}

        {/* Live bid status */}
        <div className="arena-panel rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-slate-soft tracking-widest">HIGHEST BID</p>
            <BidTicker value={currentBid} className="text-4xl text-gold" />
          </div>
          <div className="text-right">
            {isMyBid ? (
              <p className="font-display text-2xl text-turf">YOU'RE WINNING</p>
            ) : currentHighestTeam ? (
              <p className="font-display text-lg" style={{ color: currentHighestTeam.color_hex }}>
                {currentHighestTeam.name}
              </p>
            ) : (
              <p className="font-mono text-sm text-slate-soft">no bids yet</p>
            )}
          </div>
        </div>

        {rosterFull && (
          <div className="arena-panel border border-danger rounded-xl p-3 text-center">
            <p className="font-mono text-sm text-danger">Your squad is full (7/7) - bidding disabled.</p>
          </div>
        )}
      </main>

      {/* One-thumb bid buttons, thumb-zone anchored */}
      <footer className="p-4 pb-6 flex flex-col gap-3 sticky bottom-0 arena-panel border-t border-stadium-line">
        <button
          onClick={() => handleBid(nextMinBid)}
          disabled={rosterFull || isMyBid || !currentPlayer}
          className="w-full bg-gold text-stadium font-display text-2xl tracking-widest rounded-2xl py-4 disabled:opacity-30 active:scale-[0.98] transition-transform"
        >
          BID {nextMinBid.toLocaleString('en-IN')}
        </button>
        <div className="grid grid-cols-3 gap-3">
          {bidIncrements.map((inc) => {
            const amount = currentBid + inc;
            return (
              <button
                key={inc}
                onClick={() => handleBid(amount)}
                disabled={rosterFull || isMyBid || !currentPlayer}
                className="arena-panel rounded-xl py-3 font-mono text-sm disabled:opacity-30 active:scale-[0.97] transition-transform border border-gold/30"
              >
                +{inc}
              </button>
            );
          })}
        </div>
      </footer>

      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 arena-panel rounded-xl px-5 py-2 font-mono text-sm border z-20 ${
            toast.isError ? 'border-danger text-danger' : 'border-gold text-gold'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

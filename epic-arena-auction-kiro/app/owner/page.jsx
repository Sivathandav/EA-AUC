'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLiveAuction } from '../../hooks/useLiveAuction';
import BidTicker from '../../components/BidTicker';
import SquadList from '../../components/SquadList';
import PinGate from '../../components/PinGate';

const SESSION_KEY = 'epicArena.teamSession';

export default function OwnerDashboardPage() {
  const [session, setSession] = useState(undefined);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    setSession(stored ? JSON.parse(stored) : null);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { teams, players, auctionState, currentPlayer, currentHighestTeam, loading, placeBid } = useLiveAuction();

  const myTeam = useMemo(() => teams.find((t) => t.id === session?.teamId) || null, [teams, session]);

  const [toast, setToast] = useState(null);
  const flash = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2200);
  };

  const loginWithPin = async (pin) => {
    const { data, error } = await supabase.rpc('verify_team_pin', { p_pin: pin });
    if (error || !data || data.length === 0) {
      return { ok: false, error: 'Incorrect PIN - verify with the auctioneer.' };
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
        <p className="font-display text-2xl text-gold tracking-widest animate-pulse">LOADING…</p>
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
    if (isOffline) {
      flash('Connection lost - bidding disabled', true);
      return;
    }
    const res = await placeBid(myTeam.id, session.pin, amount);
    if (!res.ok) flash(res.error, true);
    else flash(`Bid placed: ${amount.toLocaleString('en-IN')}`);
  };

  return (
    <div className="min-h-screen bg-stadium flex flex-col text-floodlight">
      {/* Header: Team Status (Sticky) */}
      <header className="arena-panel border-b border-stadium-line p-3 md:p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <span className="w-3 md:w-4 h-3 md:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: myTeam.color_hex }} />
          <div className="min-w-0">
            <p className="font-display text-lg md:text-xl leading-none truncate">{myTeam.name}</p>
            {myTeam.sponsor_name && (
              <p className="font-mono text-[10px] md:text-xs text-slate-soft truncate">{myTeam.sponsor_name}</p>
            )}
            <p className="font-mono text-xs text-slate-soft">{myTeam.roster_count}/7 slots</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          {isOffline && (
            <div className="flex items-center gap-1 justify-end mb-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="font-mono text-xs text-orange-500">Offline</span>
            </div>
          )}
          <p className="font-mono text-xs text-slate-soft">PURSE</p>
          <p className="font-display text-xl md:text-2xl text-gold">{myTeam.purse_remaining.toLocaleString('en-IN')}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 md:p-4 flex flex-col gap-3 md:gap-4 overflow-y-auto">
        {/* Current Player Card */}
        {currentPlayer ? (
          <div className="arena-panel rounded-lg md:rounded-2xl overflow-hidden border border-gold/30">
            <div className="aspect-video bg-stadium-line flex items-center justify-center">
              {currentPlayer.photo_url ? (
                <img src={currentPlayer.photo_url} alt={currentPlayer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-5xl md:text-6xl text-slate-soft/40">
                  {currentPlayer.name?.[0]}
                </div>
              )}
            </div>
            <div className="p-3 md:p-4">
              <h2 className="font-display text-2xl md:text-3xl leading-tight">{currentPlayer.name}</h2>
              <p className="font-mono text-xs md:text-sm text-slate-soft mt-1 md:mt-2">
                {currentPlayer.role || 'Unassigned'} · base {currentPlayer.base_price?.toLocaleString('en-IN')}
                {currentPlayer.rating > 0 && <span className="text-gold ml-1">{'★'.repeat(currentPlayer.rating)}</span>}
              </p>
            </div>
          </div>
        ) : (
          <div className="arena-panel rounded-lg md:rounded-2xl p-6 md:p-8 text-center">
            <p className="font-display text-xl md:text-2xl text-slate-soft">Waiting for next lot…</p>
          </div>
        )}

        {/* Live Bid Status */}
        <div className="arena-panel rounded-lg md:rounded-2xl p-3 md:p-4 flex items-center justify-between border border-gold/20">
          <div>
            <p className="font-mono text-xs text-slate-soft tracking-widest">HIGHEST BID</p>
            <BidTicker value={currentBid} className="text-3xl md:text-4xl text-gold" />
          </div>
          <div className="text-right">
            {isMyBid ? (
              <p className="font-display text-xl md:text-2xl text-turf">YOU'RE WINNING</p>
            ) : currentHighestTeam ? (
              <p className="font-display text-base md:text-lg" style={{ color: currentHighestTeam.color_hex }}>
                {currentHighestTeam.name}
              </p>
            ) : (
              <p className="font-mono text-xs md:text-sm text-slate-soft">no bids yet</p>
            )}
          </div>
        </div>

        {/* Roster Status */}
        {rosterFull && (
          <div className="arena-panel border border-danger rounded-lg p-3 text-center">
            <p className="font-mono text-xs md:text-sm text-danger font-semibold">Your squad is full (7/7) - bidding disabled.</p>
          </div>
        )}

        {/* Squad List - PHASE 4: Real-time squad display */}
        {myTeam && (
          <div className="arena-panel rounded-lg md:rounded-2xl p-3 md:p-4 border border-stadium-line flex-1">
            <SquadList team={myTeam} players={players} showCaption={true} showPagination={false} maxVisibleItems={3} />
          </div>
        )}
      </main>

      {/* One-Thumb Bidding Buttons (Sticky Bottom) */}
      <footer className="p-3 md:p-4 pb-4 md:pb-6 flex flex-col gap-2 md:gap-3 sticky bottom-0 arena-panel border-t border-stadium-line">
        {/* Primary Bid Button */}
        <button
          onClick={() => handleBid(nextMinBid)}
          disabled={rosterFull || isMyBid || !currentPlayer || isOffline}
          className="w-full bg-gold text-stadium font-display text-xl md:text-2xl tracking-widest rounded-lg md:rounded-2xl py-3 md:py-4 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform font-semibold"
        >
          BID {nextMinBid.toLocaleString('en-IN')}
        </button>

        {/* Quick Increment Buttons */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {bidIncrements.map((inc) => {
            const amount = currentBid + inc;
            return (
              <button
                key={inc}
                onClick={() => handleBid(amount)}
                disabled={rosterFull || isMyBid || !currentPlayer || isOffline}
                className="arena-panel rounded-lg py-2 md:py-3 font-mono text-xs md:text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform border border-gold/30 hover:border-gold"
              >
                +{inc}
              </button>
            );
          })}
        </div>
      </footer>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-24 md:top-32 left-1/2 -translate-x-1/2 arena-panel rounded-lg px-4 md:px-5 py-2 md:py-3 font-mono text-xs md:text-sm border z-20 animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.isError ? 'border-danger text-danger' : 'border-gold text-gold'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

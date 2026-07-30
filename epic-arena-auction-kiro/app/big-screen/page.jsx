'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useLiveAuction } from '../../hooks/useLiveAuction';
import PlayerCard from '../../components/PlayerCard';
import BidTicker from '../../components/BidTicker';
import TeamStrip from '../../components/TeamStrip';
import SoldHammer from '../../components/SoldHammer';
import SquadList from '../../components/SquadList';

export default function BigScreenPage() {
  const { teams, players, auctionState, currentPlayer, currentHighestTeam, loading } = useLiveAuction();
  const [transparent, setTransparent] = useState(false);
  const [soldTrigger, setSoldTrigger] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const lastStatusRef = useRef(null);

  // Fire the hammer-drop exactly once per sale
  useEffect(() => {
    if (auctionState?.status === 'sold' && lastStatusRef.current !== 'sold') {
      setSoldTrigger((n) => n + 1);
    }
    lastStatusRef.current = auctionState?.status;
  }, [auctionState?.status]);

  // Monitor connection status
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

  if (loading) {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center">
        <p className="font-display text-3xl text-gold tracking-widest animate-pulse">LOADING ARENA…</p>
      </div>
    );
  }

  return (
    <div
      className={`arena-stage min-h-screen ${transparent ? 'greenscreen' : 'arena-turf-bg'} flex flex-col justify-between p-4 md:p-8`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-gold text-xs md:text-sm tracking-[0.4em]">EPIC ARENA PREMIER LEAGUE</p>
          <h1 className="font-display text-3xl md:text-5xl tracking-wide">MEGA AUCTION</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {isOffline && (
            <div className="flex items-center gap-2 arena-panel rounded-full px-3 md:px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="font-mono text-xs tracking-widest">OFFLINE</span>
            </div>
          )}
          <div className="flex items-center gap-2 arena-panel rounded-full px-3 md:px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="font-mono text-xs tracking-widest">LIVE</span>
          </div>
          <button
            onClick={() => setTransparent((t) => !t)}
            className="font-mono text-xs arena-panel rounded-full px-3 md:px-4 py-1.5 hover:border-gold border border-transparent transition-colors"
          >
            {transparent ? 'STAGE' : 'CHROMA'}
          </button>
        </div>
      </div>

      {/* Center Stage - Current Player & Bid */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-8 py-6 md:py-8">
        <PlayerCard player={currentPlayer} />

        <div className="arena-panel rounded-2xl px-6 md:px-10 py-4 md:py-5 text-center border border-gold/30">
          <p className="font-mono text-xs md:text-sm text-slate-soft tracking-[0.3em] mb-1 md:mb-2">CURRENT HIGHEST BID</p>
          <BidTicker value={auctionState?.current_highest_bid ?? 0} className="text-4xl md:text-6xl text-gold" />
          {currentHighestTeam ? (
            <p className="font-display text-lg md:text-2xl tracking-wide mt-2" style={{ color: currentHighestTeam.color_hex }}>
              {currentHighestTeam.name}
            </p>
          ) : (
            <p className="font-mono text-sm text-slate-soft mt-2">no bids yet</p>
          )}
        </div>
      </div>

      {/* Squad Display - PHASE 4: Real-time visibility */}
      {currentHighestTeam && (
        <div className="mb-4 md:mb-6 arena-panel rounded-xl p-3 md:p-4 border border-stadium-line">
          <SquadList team={currentHighestTeam} players={players} showCaption={true} showPagination={true} maxVisibleItems={4} />
        </div>
      )}

      {/* Bottom Banner */}
      <TeamStrip teams={teams} highlightTeamId={currentHighestTeam?.id} />

      <SoldHammer
        trigger={soldTrigger}
        teamName={currentHighestTeam?.name}
        teamColor={currentHighestTeam?.color_hex || '#F5A623'}
      />
    </div>
  );
}

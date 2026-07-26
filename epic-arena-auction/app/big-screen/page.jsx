'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveAuction } from '../../hooks/useLiveAuction';
import PlayerCard from '../../components/PlayerCard';
import BidTicker from '../../components/BidTicker';
import TeamStrip from '../../components/TeamStrip';
import SoldHammer from '../../components/SoldHammer';

export default function BigScreenPage() {
  const { teams, auctionState, currentPlayer, currentHighestTeam, loading } = useLiveAuction();
  const [transparent, setTransparent] = useState(false);
  const [soldTrigger, setSoldTrigger] = useState(0);
  const lastStatusRef = useRef(null);

  // Fire the hammer-drop exactly once per sale, on the idle->sold transition.
  useEffect(() => {
    if (auctionState?.status === 'sold' && lastStatusRef.current !== 'sold') {
      setSoldTrigger((n) => n + 1);
    }
    lastStatusRef.current = auctionState?.status;
  }, [auctionState?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center">
        <p className="font-display text-3xl text-gold tracking-widest animate-pulseDot">LOADING ARENA…</p>
      </div>
    );
  }

  return (
    <div
      className={`arena-stage min-h-screen ${transparent ? 'greenscreen' : 'arena-turf-bg'} flex flex-col justify-between p-8`}
    >
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-gold text-xs tracking-[0.4em]">EPIC ARENA PREMIER LEAGUE</p>
          <h1 className="font-display text-4xl tracking-wide">MEGA AUCTION</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 arena-panel rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulseDot" />
            <span className="font-mono text-xs tracking-widest">LIVE</span>
          </div>
          <button
            onClick={() => setTransparent((t) => !t)}
            className="font-mono text-xs arena-panel rounded-full px-4 py-1.5 hover:border-gold border border-transparent transition-colors"
          >
            {transparent ? 'STAGE VIEW' : 'GREEN SCREEN'}
          </button>
        </div>
      </div>

      {/* center stage */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
        <PlayerCard player={currentPlayer} />

        <div className="arena-panel rounded-2xl px-10 py-5 text-center min-w-[320px] border border-gold/30">
          <p className="font-mono text-xs text-slate-soft tracking-[0.3em] mb-1">CURRENT HIGHEST BID</p>
          <BidTicker value={auctionState?.current_highest_bid ?? 0} className="text-6xl text-gold" />
          {currentHighestTeam ? (
            <p className="font-display text-2xl tracking-wide mt-1" style={{ color: currentHighestTeam.color_hex }}>
              {currentHighestTeam.name}
            </p>
          ) : (
            <p className="font-mono text-sm text-slate-soft mt-1">no bids yet</p>
          )}
        </div>
      </div>

      {/* bottom banner */}
      <TeamStrip teams={teams} highlightTeamId={currentHighestTeam?.id} />

      <SoldHammer
        trigger={soldTrigger}
        teamName={currentHighestTeam?.name}
        teamColor={currentHighestTeam?.color_hex || '#F5A623'}
      />
    </div>
  );
}

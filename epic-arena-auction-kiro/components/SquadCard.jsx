'use client';

import React, { useEffect, useState } from 'react';
import { getTeamColor } from '../lib/designTokens';

/**
 * SquadCard Component
 * Displays individual player card within a team's squad list
 * Shows: name, role, base price, sold price, rating, status, purchase order
 */
export default function SquadCard({ player, team, animateEntrance = false, showDetails = true }) {
  const [animated, setAnimated] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    if (animateEntrance) {
      const timer = setTimeout(() => setAnimated(true), 50);
      return () => clearTimeout(timer);
    }
  }, [animateEntrance]);

  const teamColor = team ? team.color_hex : getTeamColor(1).primary;
  const priceOpacity = player.status === 'sold' ? 1 : 0.6;

  return (
    <div
      className={`arena-panel rounded-lg border border-stadium-line overflow-hidden hover:border-gold/50 transition-all ${
        animateEntrance && animated ? 'opacity-100 scale-100' : animateEntrance ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{
        transition: animateEntrance ? 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        borderLeftWidth: '4px',
        borderLeftColor: teamColor,
      }}
    >
      {/* Card Header */}
      <div className="p-3 border-b border-stadium-line">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg leading-tight text-floodlight truncate">{player.name}</p>
            {player.role && (
              <p className="font-mono text-xs text-slate-soft mt-1 uppercase tracking-wider">{player.role}</p>
            )}
          </div>
          {player.rating > 0 && (
            <span className="text-xs text-gold whitespace-nowrap">{'★'.repeat(player.rating)}</span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 space-y-2">
        {/* Base Price */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-soft">Base</p>
          <p className="font-mono font-semibold text-floodlight" style={{ opacity: priceOpacity }}>
            {player.base_price?.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Sold Price */}
        {player.sold_price && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-slate-soft">Sold</p>
            <p className="font-mono font-semibold text-gold">{player.sold_price?.toLocaleString('en-IN')}</p>
          </div>
        )}

        {/* Status Badge */}
        <div className="pt-2 flex items-center justify-between">
          <span
            className={`font-mono text-xs uppercase tracking-widest px-2 py-1 rounded ${
              player.status === 'sold'
                ? 'bg-turf/20 text-turf'
                : 'bg-slate-soft/10 text-slate-soft'
            }`}
          >
            {player.status}
          </span>
          {player.queue_order && (
            <span className="font-mono text-xs text-slate-soft/60">#{player.queue_order}</span>
          )}
        </div>
      </div>

      {/* Additional Details (Optional) */}
      {showDetails && player.entry_fee && (
        <div className="px-3 py-2 border-t border-stadium-line/50 bg-stadium-line/20">
          <p className="font-mono text-xs text-slate-soft">Entry: {player.entry_fee}</p>
        </div>
      )}
    </div>
  );
}

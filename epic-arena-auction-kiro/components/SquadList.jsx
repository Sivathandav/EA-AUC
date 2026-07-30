'use client';

import React, { useMemo, useState, useEffect } from 'react';
import SquadCard from './SquadCard';

/**
 * SquadList Component
 * Displays all players purchased by a team
 * Supports virtualization for large rosters and entrance animations
 */
export default function SquadList({
  team,
  players = [],
  showCaption = true,
  scrollable = true,
  maxVisibleItems = 6,
  showPagination = false,
}) {
  const [animatingPlayerIds, setAnimatingPlayerIds] = useState(new Set());
  const [page, setPage] = useState(0);

  // Filter players for this team
  const squadPlayers = useMemo(() => {
    return players.filter((p) => p.sold_to_team_id === team?.id);
  }, [players, team]);

  // Implement pagination if needed
  const pageSize = showPagination ? maxVisibleItems : squadPlayers.length;
  const paginatedPlayers = squadPlayers.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(squadPlayers.length / pageSize);

  // Track newly added players for entrance animation
  useEffect(() => {
    const allPlayerIds = new Set(squadPlayers.map((p) => p.id));
    setAnimatingPlayerIds((prev) => {
      const newIds = new Set(allPlayerIds);
      allPlayerIds.forEach((id) => {
        if (!prev.has(id)) {
          newIds.add(id);
        }
      });
      // Clear animation after duration
      setTimeout(() => setAnimatingPlayerIds(new Set()), 300);
      return newIds;
    });
  }, [squadPlayers]);

  // Empty state
  if (squadPlayers.length === 0) {
    return (
      <div className="arena-panel rounded-lg border border-stadium-line border-dashed p-6 text-center">
        <p className="font-display text-xl text-slate-soft mb-1">No players purchased yet</p>
        <p className="font-mono text-sm text-slate-soft/60">Squad updates will appear here in real-time</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${scrollable ? 'overflow-y-auto max-h-[400px]' : ''}`}>
      {/* Header with count */}
      {showCaption && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-slate-soft tracking-widest uppercase">
            Squad ({squadPlayers.length}/7 players)
          </p>
          {totalPages > 1 && showPagination && (
            <p className="font-mono text-xs text-slate-soft">Page {page + 1} of {totalPages}</p>
          )}
        </div>
      )}

      {/* Squad Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {paginatedPlayers.map((player) => (
          <SquadCard
            key={player.id}
            player={player}
            team={team}
            animateEntrance={animatingPlayerIds.has(player.id)}
            showDetails={false}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && showPagination && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stadium-line">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="font-mono text-xs px-3 py-1 arena-panel rounded disabled:opacity-30 hover:border-gold border border-transparent transition-colors"
          >
            ← Previous
          </button>
          <p className="font-mono text-xs text-slate-soft">
            {page * pageSize + 1} to {Math.min((page + 1) * pageSize, squadPlayers.length)} of {squadPlayers.length}
          </p>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="font-mono text-xs px-3 py-1 arena-panel rounded disabled:opacity-30 hover:border-gold border border-transparent transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Roster Full Indicator */}
      {squadPlayers.length >= 7 && (
        <div className="mt-2 px-3 py-2 bg-gold/10 border border-gold/30 rounded text-center">
          <p className="font-mono text-xs text-gold font-semibold">Squad Full (7/7)</p>
        </div>
      )}
    </div>
  );
}

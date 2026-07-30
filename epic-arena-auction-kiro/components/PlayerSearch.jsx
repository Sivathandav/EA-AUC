'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

/**
 * PlayerSearch Component
 * Enables auctioneer to search and select players by name or serial number
 * Features:
 * - Autocomplete dropdown with up to 10 results
 * - Keyboard navigation (Up/Down/Enter/Escape)
 * - Visual focus indicators
 * - Relevance ranking
 * - Touch-friendly interface
 */
export default function PlayerSearch({ players = [], onSelect, onLoadAuction, autoFocus = true, className = '' }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Filter and rank results by relevance
  const filtered = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const results = players
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const serialMatch = String(p.serial_number).includes(q);
        return (nameMatch || serialMatch) && p.status !== 'sold';
      })
      .map((p) => {
        // Rank by relevance
        const nameExact = p.name.toLowerCase() === q;
        const serialExact = String(p.serial_number) === q;
        const nameStart = p.name.toLowerCase().startsWith(q);
        const serialStart = String(p.serial_number).startsWith(q);

        let score = 0;
        if (nameExact || serialExact) score = 1000;
        else if (nameStart || serialStart) score = 500;
        else if (p.name.toLowerCase().includes(q)) score = 100;
        else score = 50;

        return { ...p, relevanceScore: score };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10)
      .map(({ relevanceScore, ...p }) => p);

    return results;
  }, [query, players]);

  // Handle query change
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    setFocusIndex(-1);
  }, []);

  // Handle player selection
  const handleSelect = useCallback(
    (player) => {
      if (onSelect) onSelect(player);
      if (onLoadAuction) onLoadAuction(player.id);
      setQuery('');
      setIsOpen(false);
      setFocusIndex(-1);
      inputRef.current?.focus();
    },
    [onSelect, onLoadAuction]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen && e.key !== 'Enter') return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex((i) => (i < filtered.length - 1 ? i + 1 : i));
          setIsOpen(true);
          break;

        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((i) => (i > 0 ? i - 1 : -1));
          break;

        case 'Enter':
          e.preventDefault();
          if (focusIndex >= 0 && filtered[focusIndex]) {
            handleSelect(filtered[focusIndex]);
          } else if (filtered.length === 1) {
            handleSelect(filtered[0]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setFocusIndex(-1);
          break;

        default:
          break;
      }
    },
    [isOpen, focusIndex, filtered, handleSelect]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-gold/30 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search by player name or serial number..."
          className="w-full px-4 py-3 rounded-lg border-2 border-transparent arena-panel focus:border-gold focus:outline-none transition-colors bg-stadium-panel text-floodlight placeholder-slate-soft"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-soft hover:text-floodlight"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-stadium-panel border border-stadium-line rounded-lg shadow-elevation z-50 max-h-[400px] overflow-y-auto">
          {filtered.map((player, idx) => (
            <button
              key={player.id}
              onClick={() => handleSelect(player)}
              onMouseEnter={() => setFocusIndex(idx)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-stadium-line transition-colors border-b border-stadium-line last:border-b-0 ${
                focusIndex === idx ? 'bg-stadium-line ring-2 ring-inset ring-gold' : ''
              }`}
              role="option"
              aria-selected={focusIndex === idx}
            >
              <div className="flex-1">
                <p className="font-medium text-floodlight">{highlightMatch(player.name, query)}</p>
                <p className="font-mono text-xs text-slate-soft">
                  #{highlightMatch(String(player.serial_number), query)} · {player.role}
                </p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="font-mono text-sm text-gold font-semibold">
                  {player.base_price?.toLocaleString('en-IN')}
                </p>
                <p className="font-mono text-xs text-slate-soft">base</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {query && isOpen && filtered.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-stadium-panel border border-stadium-line rounded-lg p-4 text-center z-50">
          <p className="text-slate-soft font-mono text-sm">No players found matching "{query}"</p>
          <p className="text-slate-soft/60 font-mono text-xs mt-1">Try searching by name or serial number</p>
        </div>
      )}

      {/* Result Count Badge */}
      {query && isOpen && filtered.length > 0 && (
        <div className="absolute top-3 right-12 bg-gold/10 border border-gold/20 rounded-full px-2 py-1">
          <p className="font-mono text-xs text-gold font-semibold">{filtered.length} results</p>
        </div>
      )}
    </div>
  );
}

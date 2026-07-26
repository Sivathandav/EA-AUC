'use client';

const roleAbbrev = {
  Batsman: 'BAT',
  Bowler: 'BWL',
  'All-Rounder': 'ALL',
  'Wicket-Keeper': 'WK',
};

export default function PlayerCard({ player }) {
  if (!player) {
    return (
      <div className="arena-panel rounded-3xl w-full max-w-2xl aspect-[4/5] flex items-center justify-center">
        <p className="font-display text-4xl text-slate-soft tracking-widest">WAITING FOR NEXT LOT</p>
      </div>
    );
  }

  return (
    <div className="arena-panel rounded-3xl w-full max-w-2xl overflow-hidden shadow-glow border-2 border-gold/40">
      <div className="relative aspect-[4/3] bg-stadium-line">
        {player.photo_url ? (
          // plain <img> - photo URLs are arbitrary/organizer-supplied
          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-9xl text-slate-soft/40">
              {player.name?.[0] ?? '?'}
            </span>
          </div>
        )}
        <div className="absolute top-4 right-4 font-mono text-xs bg-gold text-stadium px-3 py-1 rounded-full font-bold tracking-widest">
          {player.role ? roleAbbrev[player.role] ?? player.role : 'UNASSIGNED'}
        </div>
        {player.rating > 0 && (
          <div className="absolute top-4 left-4 font-mono text-sm text-gold bg-stadium/70 px-3 py-1 rounded-full">
            {'★'.repeat(player.rating)}
          </div>
        )}
      </div>
      <div className="p-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-5xl tracking-wide leading-none">{player.name}</h2>
          <p className="text-slate-soft font-mono text-sm mt-1">{player.role || 'Role not yet assigned'}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-slate-soft tracking-widest">BASE PRICE</p>
          <p className="font-display text-3xl text-gold">{player.base_price.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
}

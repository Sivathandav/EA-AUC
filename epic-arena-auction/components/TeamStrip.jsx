'use client';

export default function TeamStrip({ teams, highlightTeamId }) {
  const sorted = [...teams].sort((a, b) => a.id - b.id);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-2 min-w-max px-2">
        {sorted.map((team) => {
          const isHighlighted = team.id === highlightTeamId;
          return (
            <div
              key={team.id}
              className="arena-panel rounded-xl px-4 py-3 min-w-[150px] transition-all duration-200"
              style={
                isHighlighted
                  ? { borderColor: team.color_hex, boxShadow: `0 0 24px ${team.color_hex}66` }
                  : undefined
              }
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: team.color_hex }}
                />
                <p className="font-mono text-xs tracking-widest text-slate-soft truncate">
                  {team.short_code}
                </p>
              </div>
              <p className="font-display text-2xl leading-none">
                {team.purse_remaining.toLocaleString('en-IN')}
              </p>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: i < team.roster_count ? team.color_hex : '#1E2A45',
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import Link from 'next/link';

const views = [
  {
    href: '/big-screen',
    title: 'Big Screen',
    subtitle: 'Projector / OBS overlay',
    desc: 'Full-bleed stadium jumbotron for the venue TV or a browser-source overlay in OBS.',
  },
  {
    href: '/admin',
    title: 'Auctioneer Console',
    subtitle: 'Keyboard-optimized',
    desc: 'SOLD / UNSOLD / UNDO, plus 1-8 hotkeys to assign bids at auction speed.',
  },
  {
    href: '/owner',
    title: 'Franchise Dashboard',
    subtitle: 'Mobile, PIN login',
    desc: 'One-thumb bidding for team owners. Enter your 4-digit Team PIN to get in.',
  },
  {
    href: '/admin/manage',
    title: 'Manage',
    subtitle: 'Admin, add/edit/delete',
    desc: 'Add, edit, and delete teams, captains, and players before the event. Admin PIN required.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen arena-turf-bg flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center mb-14">
        <p className="font-mono text-gold tracking-[0.4em] text-sm mb-3">LIVE • TURF • TOURNAMENT</p>
        <h1 className="font-display text-6xl md:text-7xl tracking-wide">
          EPIC ARENA <span className="text-gold">PREMIER LEAGUE</span>
        </h1>
        <p className="font-display text-3xl md:text-4xl text-slate-soft tracking-widest mt-1">
          MEGA AUCTION
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-6xl">
        {views.map((v) => (
          <Link
            key={v.href}
            href={v.href}
            className="arena-panel rounded-2xl p-6 hover:shadow-glow hover:-translate-y-1 transition-all duration-200 group"
          >
            <p className="font-mono text-xs text-gold tracking-widest mb-2">{v.subtitle.toUpperCase()}</p>
            <h2 className="font-display text-3xl tracking-wide mb-2 group-hover:text-gold transition-colors">
              {v.title}
            </h2>
            <p className="text-slate-soft text-sm leading-relaxed">{v.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

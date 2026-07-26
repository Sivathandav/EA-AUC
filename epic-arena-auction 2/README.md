# EPIC ARENA PREMIER LEAGUE — MEGA AUCTION

A real-time turf-tournament auction app: Big Screen (projector/OBS), an
Admin/Auctioneer console with keyboard hotkeys, and a mobile Franchise
Owner dashboard with frictionless 4-digit PIN login. Every screen stays
in sync through Supabase Realtime, and every write is funneled through
atomic Postgres RPC functions so two owners bidding at the same
millisecond can never corrupt the auction state.

## 1. Init steps

```bash
# scaffold (or just use this folder directly - it's already a full app)
npx create-next-app@14 epic-arena-auction --js --tailwind --eslint --app --no-src-dir
cd epic-arena-auction

# install the two extra dependencies this app needs
npm install @supabase/supabase-js gsap

# copy in the files from this delivery (app/, components/, hooks/, lib/, supabase/)
# then:
cp .env.local.example .env.local
# edit .env.local with your Supabase project URL + anon key

npm run dev
# -> http://localhost:3000
```

## 2. Supabase setup

In the Supabase dashboard, open **SQL Editor** and run these files **in order**:

1. `supabase/schema.sql` — creates `teams`, `players`, `auction_state`,
   `bid_history`, enables Realtime on all four, sets up Row Level
   Security (public read, no direct writes), and locks the `teams.pin`
   column down at the grant level.
2. `supabase/rpc_functions.sql` — the atomic bidding engine:
   `verify_team_pin`, `place_bid`, `start_timer`, `load_next_player`,
   `mark_sold`, `mark_unsold`, `undo_last_action`.
3. `supabase/seed.sql` *(optional)* — 8 demo teams with PINs `1111`…`8888`
   and 48 placeholder players. Replace with your real roster before
   the event (real names, PINs, `photo_url`s).

Realtime must be turned on for the project (Database → Replication) —
the `alter publication supabase_realtime add table ...` lines in
`schema.sql` handle this as long as replication is enabled at the
project level (it is by default on new projects).

## 3. How the business rules are enforced

All of this lives in `place_bid()` inside `rpc_functions.sql`, running
as **one atomic Postgres transaction**:

- **`select ... from auction_state where id = 1 for update`** locks the
  singleton state row first. If two owners bid in the same instant,
  Postgres serializes them — the second transaction blocks until the
  first commits, then re-validates against the *new* state (so it will
  correctly reject a now-stale bid amount). This is what makes the RPC
  race-condition-proof instead of "mostly works."
- **Roster full check**: `team.roster_count >= 7` hard-blocks the bid.
- **Purse Margin Check**, exactly per spec:
  `Max Allowable Bid = Remaining Budget − ((Remaining Empty Slots − 1) × Minimum Base Price)`
  where *Minimum Base Price* is the cheapest base price anywhere in the
  48-player pool (a stable floor — an owner can never bid themselves
  into a position where they can't legally fill their remaining slots).
- **UNDO** (`undo_last_action()`) reverses the single most recent entry
  in the `bid_history` audit table — a bid, a sale, or an unsold call.
  It's a one-level undo (the common "wrong paddle pressed" case);
  extending it to a full multi-step stack is a straightforward
  extension of the same pattern if you need it later.

## 4. The four views

| Route         | Who                | Notes |
|---------------|---------------------|-------|
| `/`           | anyone              | Nav hub |
| `/big-screen` | projector / OBS      | Toggle button switches to a pure-green (`#00FF00`) background for chroma-key overlay use |
| `/admin`      | auctioneer, keyboard | `Space`=start timer, `1`-`8`=assign bid to that team, `S`=SOLD, `U`=UNSOLD, `Z`=UNDO, `N`=next player |
| `/owner`      | team owners, mobile  | 4-digit PIN → dugout view with one-thumb bid buttons |

## 5. GSAP animations

- `components/BidTicker.jsx` — tweens the displayed number from its old
  value to the new one (`gsap.to` on a proxy object, `onUpdate` writes
  `textContent` directly) — an LED-scoreboard "climb" instead of a
  jarring snap, and it only touches one text node per frame.
- `components/SoldHammer.jsx` — the signature moment: a hammer drops in
  (`y`/`rotate`/`opacity` only — all GPU-accelerated), impacts with a
  quick counter-rotation + a radial gold shockwave (`scale`+`opacity`),
  triggers a 5-frame camera-shake on the `.arena-stage` wrapper via
  `transform: translateX`, then "SOLD!" punches in with a back-ease.
  Everything animates `transform`/`opacity` exclusively to stay at 60fps.

## 6. Deploying to Vercel

```bash
npm install -g vercel   # if you don't have it
vercel                  # first deploy, follow the prompts
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard and set the two
`NEXT_PUBLIC_*` env vars under Project Settings → Environment Variables.

## 7. Before your event

- Replace seed data with the real 8 franchises (PINs, colors, logos)
  and the real 48-player pool (photos, roles, base prices).
- Put `/big-screen` on the venue TV or as an OBS Browser Source.
- Hand `/admin` to the auctioneer on a keyboard-equipped laptop.
- Text each owner their team's PIN and the `/owner` link.

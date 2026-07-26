# EPIC ARENA — v2 Upgrade Notes

This upgrade adds: your real 53-player roster, full CRUD for teams/players/captains
from the browser, a two-tier Admin/User auth model, and mobile-responsive Manage screens.

## 1. What's new

- **Real roster imported** — all 53 players from your registration sheet, plus 8
  franchises built around your 8 captains (Vikram, Gokul, Rahoof, Nandhu,
  Dhanapalan, Arun Balaji, Ganesh, Achu).
- **Full CRUD from the browser** — a new `/admin/manage` screen to add, edit, and
  delete teams, captains, and players. No SQL required after initial setup.
- **Two-tier auth**:
  - **Admin** — one shared 4-digit PIN. Gates the Auctioneer Console (`/admin`)
    and the new Manage screen (`/admin/manage`). Default PIN is **`9999`** —
    change it immediately from Manage → Settings.
  - **User** (team owner) — each team's existing 4-digit PIN, unchanged from
    before. Gates the Franchise Dashboard (`/owner`).
  - Both are checked **server-side inside the database functions**, not just
    hidden in the UI — so they can't be bypassed by calling the API directly.
- **Responsive Manage UI** — works on both desktop and mobile (add players from
  your phone before the event if you need to).
- **Rehearsal reset** — Manage → Settings → "Reset Auction Data" wipes all sales/
  bids and restores starting purses, so you can run a full practice auction and
  then reset to zero before the real thing.

## 2. Assumptions made about your data (please verify)

Your sheet's 7 group labels (Old School, Vivek Team, Trivorn, Bhai Team,
Ellapalayam, LGB, Epic Arena) were imported as **metadata only** — all 53
players are pooled into one shared auction list, per your instruction. The
original label is kept in each player's `source_group` field as a note.

Your 8 captains became the 8 franchises. Team names are placeholders
("Team Vikram", "Team Gokul", etc.) — **rename them and add sponsor names**
from Manage → Teams before the event, exactly as you asked.

Two names appear in both lists ("Gokul" as a captain, and again as a pool
player under Ellapalayam; same for "Achu" under Vivek Team). These were kept
as **separate people**. If either is actually the same person, delete the
duplicate player row from Manage → Players.

No player had a Role (Batsman/Bowler/etc.) on the sheet, so all 53 imported
as **Unassigned** — both the Console and Manage screen show a count of how
many still need classifying. Base prices default to 100 / 125 / 150 based on
the sheet's star rating; adjust freely.

## 3. Setup — fresh Supabase project

1. Run `supabase/schema.sql`
2. Run `supabase/rpc_functions.sql`
3. Run `supabase/seed_real_roster.sql` (your real data) — or `supabase/seed.sql`
   for a quick generic test instead
4. `npm install`, `npm run dev`, visit `/admin` with PIN **`9999`**
5. **Immediately go to Manage → Settings and change the admin PIN**

## 4. Setup — upgrading an existing v1 project

If you already ran the original `schema.sql`/`rpc_functions.sql` and have data
you want to keep:

1. Run `supabase/migration_v1_to_v2.sql` (adds new columns/tables, safe to
   re-run, does not touch existing rows)
2. Re-run the full (new) `supabase/rpc_functions.sql` — function signatures
   changed, so old versions must be replaced
3. Optionally run `supabase/seed_real_roster.sql` if you want to replace your
   test data with the real roster (**this deletes existing teams/players
   first** — read the top of that file before running it)
4. Default admin PIN is `9999` — change it from Manage → Settings

## 5. New route map

| Route | Auth | Purpose |
|---|---|---|
| `/` | none | Nav hub |
| `/big-screen` | none | Projector/OBS display |
| `/admin` | Admin PIN | Auctioneer console (unchanged UX, now PIN-gated) |
| `/admin/manage` | Admin PIN | **New** — Teams / Players / Settings CRUD |
| `/owner` | Team PIN | Franchise bidding (unchanged UX) |

## 6. Notable design decisions

- **Admin can see team PINs, nobody else can.** The admin already has full
  power to edit/delete everything, so hiding PINs from them too would just be
  friction. Public visitors and other teams still never see them.
- **The auctioneer console assigns bids via the admin PIN**, not each team's
  individual PIN — this matches how a real oral auction works (the auctioneer
  records the winning bid at the podium; owners don't type on the console).
  The Owner Dashboard still requires each team's own PIN to bid from their phone.
- **Deleting a sold player automatically refunds the buying team's purse** and
  frees their roster slot, so the books never drift out of balance.
- **Deleting a team is blocked** if it already owns purchased players (unsell
  them first) — prevents silently orphaning sale records.

## 7. Suggested next steps (optional, not built yet)

- **Bulk CSV import** for players in Manage, instead of one-by-one — useful if
  you add another batch of registrations later.
- **Photo upload** — currently photo_url is a pasted link; wiring up Supabase
  Storage would let you upload photos directly from the Manage screen.
- **Multiple auctioneer devices** — right now the admin PIN is shared; if you
  want per-person accountability (who recorded which bid), that's a bigger
  change (real user accounts) worth a separate conversation if you need it.

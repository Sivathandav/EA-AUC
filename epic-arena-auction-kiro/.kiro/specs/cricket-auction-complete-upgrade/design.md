# Cricket Auction Application - Complete Upgrade Design

## Overview

The Cricket Auction Application undergoes a comprehensive transformation from a functional prototype into enterprise-grade live sports auction software. This design document specifies the technical architecture, component structure, real-time data synchronization strategy, UI/UX design system, and implementation phases required to meet all upgrade requirements.

The system maintains a three-screen ecosystem (Big Screen, Admin Console, Mobile Dashboard) synchronized through Supabase Realtime, underpinned by atomic Postgres RPC functions ensuring no race conditions during concurrent bidding. The upgrade introduces search-based player navigation, premium sports UI with professional design tokens, real-time squad visibility, and responsive layouts from 320px mobile to 4K displays.

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                       │ │
│  │  ├─ teams (8 franchises, captain, budget, roster)         │ │
│  │  ├─ players (48 roster, serial#, name, role, price)      │ │
│  │  ├─ auction_state (singleton: current player, bid, timer) │ │
│  │  ├─ bid_history (audit log: all bids/sales/unsolds)      │ │
│  │  └─ app_config (admin PIN)                               │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Realtime Subscriptions (postgres_changes)                │ │
│  │  - auction_state changes (bid updates, timer, status)     │ │
│  │  - teams changes (roster, budget, squad composition)      │ │
│  │  - players changes (status, sold_to_team_id)             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  RPC Functions (Atomic Transactions)                            │
│  ├─ place_bid() - Validates purse, roster, bid amount         │ │
│  ├─ mark_sold() - Player → team assignment                    │ │
│  ├─ mark_unsold() - Revert sold status                        │ │
│  ├─ undo_last_action() - Reverse last bid_history entry      │ │
│  ├─ load_next_player() - Advance queue_order                 │ │
│  ├─ admin_place_bid() - Auctioneer override for verbal bids   │ │
│  └─ *_team/*_player CRUD - Create/update/delete entities     │ │
└─────────────────────────────────────────────────────────────────┘
                         ▲
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
   │  Admin      │  │ Big Screen   │  │ Mobile       │
   │  Console    │  │ Display      │  │ Dashboard    │
   │             │  │              │  │              │
   │ Player      │  │ Live auction │  │ Team owner   │
   │ search      │  │ state        │  │ PIN gate     │
   │ input       │  │ animations   │  │ Bid buttons  │
   │             │  │ Team cards   │  │ Squad view   │
   │ 1920×1080   │  │ 1920-3840px  │  │ 320-768px    │
   │ Keyboard    │  │ OBS/chroma   │  │ Touch UI     │
   │             │  │ 60fps smooth │  │              │
   └─────────────┘  └──────────────┘  └──────────────┘
        (Next.js SSR/Client Components)
```

### Data Flow

1. **Auctioneer searches and selects player**: Admin search input → PlayerSearch component → useLiveAuction.selectPlayer() → Server RPC triggers auction_state update
2. **Team bids**: Mobile Dashboard bidding or Admin Console team button → placeBid RPC → Postgres validates + updates auction_state.current_highest_bid and auction_state.current_highest_team_id → Realtime broadcasts to all screens
3. **Auctioneer marks sold**: Admin Console SOLD button → markSold RPC → Updates players.status, players.sold_to_team_id, players.sold_price, teams.roster_count → Realtime triggers squad updates on Big Screen + Mobile Dashboard
4. **Undo action**: Admin Console UNDO button → undoLastAction RPC → Reverts bid_history entry → Updates auction_state, players, teams tables → All screens sync automatically

### Real-Time Synchronization

- **Realtime Channel**: Single `auction-room` channel subscribes to postgres_changes on `auction_state`, `teams`, `players`, `bid_history` tables
- **Subscription Strategy**: 
  - All three screens share same hook `useLiveAuction()` which maintains `useEffect` with Realtime channel active for page lifecycle
  - Subscription runs immediately on mount; cleanup on unmount
  - State updates trigger React re-render; only affected components update (e.g., BidTicker updates on current_highest_bid change only)
- **Update Latency**: <1 second end-to-end (Postgres commit → Realtime broadcast → client socket receive → React render)
- **Offline Resilience**: If connection drops, hook maintains last-known state and displays "OFFLINE" indicator; auto-reconnects within 5 seconds with `refreshAll()` to catch any missed updates

## Components and Interfaces

### New Components (To Create)

#### PlayerSearch Component
**Purpose**: Enables auctioneer to search and select players by name or serial number with autocomplete suggestions

**Props**:
```javascript
{
  players: Player[],           // Full player roster
  onSelect: (player) => void,  // Callback when player selected (Enter or click)
  onLoadAuction: (playerId) => void,  // Load auction screen for player
  autoFocus: boolean,          // Focus on mount
  className: string            // Tailwind classes
}
```

**Features**:
- Search field accepts name or serial number input
- Autocomplete dropdown displays up to 10 results filtered by relevance (exact matches first, then partial name/number matches)
- Keyboard navigation: Up/Down arrows navigate suggestions, Enter selects, Escape closes
- Visual focus indicator on current selection
- Highlights matching text in suggestions
- Shows player role and base price in suggestion
- Removes selected player from dropdown if already in auction

**Architecture**:
```javascript
const [query, setQuery] = useState('');
const [filtered, setFiltered] = useState([]);
const [isOpen, setIsOpen] = useState(false);
const [focusIndex, setFocusIndex] = useState(-1);

// Search logic: filter by partial match on name/serialNumber, rank by relevance
// Keyboard handler: captures Up/Down/Enter/Escape, prevents default
// Maintains focus state with visual indicator
```

#### SquadCard Component
**Purpose**: Displays individual player card within team squad list

**Props**:
```javascript
{
  player: Player,              // Player object with all fields
  team: Team,                  // Purchasing team (for context)
  animateEntrance: boolean,    // Trigger entrance animation
  showDetails: boolean         // Show/hide extra fields (rating, entry_fee)
}
```

**Features**:
- Displays: player name, role (badge), base price, sold price, purchase order
- Star rating visualization if available
- Smooth entrance animation: 150-250ms fade + scale (triggered on first render of "SOLD" purchase)
- Responsive: 2-column grid on mobile, 4-column on tablet, 6-column on desktop
- Touch-friendly sizing (min 60px height)
- Team color accent stripe on left edge

#### SquadList Component
**Purpose**: Displays all players purchased by a team

**Props**:
```javascript
{
  team: Team,
  players: Player[],           // Players sold_to_team_id === team.id
  showCaption: boolean,        // Show "0/7 players" header
  scrollable: boolean          // Enable vertical scroll or pagination
}
```

**Features**:
- Renders SquadCard components for each player
- Virtualization if >20 players (renders only visible viewport)
- Pagination alternative: "Show more" button for mobile
- Real-time update: players added to squad trigger SquadCard entrance animation
- Empty state: "No players purchased yet" message if roster_count === 0

#### DesignTokens.jsx
**Purpose**: Central source for all design system values (colors, spacing, typography, shadows, radius)

**Structure**:
```javascript
export const COLORS = {
  primary: { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 },
  accent: { ... },
  neutral: { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 },
  semantic: { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
  team1: { primary, secondary }, // for each of 8 teams
  ...
};

export const SPACING = {
  4: '4px', 8: '8px', 12: '12px', 16: '16px', 24: '24px', 32: '32px', 48: '48px', 64: '64px'
};

export const TYPOGRAPHY = {
  heading: { fontFamily, sizes: { xs, sm, md, lg, xl, 2xl, 3xl }, weights: { 600, 700, 800 } },
  body: { fontFamily, sizes: { xs, sm, md, lg, xl }, weights: { 400, 500, 600 } },
  mono: { fontFamily, sizes: { xs, sm, md }, weights: { 400, 500 } }
};

export const SHADOWS = {
  subtle: '0 2px 8px rgba(0,0,0,0.08)',
  medium: '0 4px 16px rgba(0,0,0,0.12)',
  elevation: '0 8px 24px rgba(0,0,0,0.15)',
  focus: '0 0 0 3px rgba(primary, 0.2)'
};

export const RADIUS = {
  tight: '4px', subtle: '6px', standard: '8px', rounded: '12px', pill: '24px', full: '9999px'
};
```

**Usage**: Export as CSS variables in root `:root` selector and reference throughout components as `var(--color-primary-500)`, etc.

#### ResponsiveText Component
**Purpose**: Typography that scales responsively from mobile (320px) to 4K (3840px)

**Props**:
```javascript
{
  variant: 'h1' | 'h2' | 'h3' | 'body' | 'mono',  // semantic type
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl',
  weight: 400 | 500 | 600 | 700 | 800,
  children: ReactNode,
  className: string
}
```

**Features**:
- Implements fluid typography: base size on mobile, scales linearly with viewport width to max size at 3840px
- Formula: `font-size: clamp(minSize, vw * 1%, maxSize)` for smooth scaling
- Ensures readability at all breakpoints without manual media queries

### Modified Components (Update Existing)

#### AdminConsole Page (`app/admin/page.jsx`)

**Changes**:
1. Replace "Next Player" button with PlayerSearch component at top of page
2. Remove sequential player queue navigation; enable direct search
3. Add visual focus indicator on search field when active
4. Maintain keyboard shortcuts (Space, 1-8, S, U, Z) while search field has focus
5. Preserve search state during active auction (don't clear input after selection)
6. Add skeleton loader animation while player data loads
7. Implement responsive layout for smaller screens

**New Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  PLAYER SEARCH INPUT (with autocomplete dropdown)       │  ← NEW
├─────────────────────────────────────────────────────────┤
│  PLAYER QUEUE (sidebar, unchanged)                      │
├─────────────────────────────────────────────────────────┤
│  AUCTION DISPLAY PANEL                                  │
│  ├─ Current Player Card                                 │
│  ├─ Highest Bid / Highest Team                          │
│  └─ Timer Display                                       │
├─────────────────────────────────────────────────────────┤
│  TEAM BID BUTTONS (grid, 2x4)                          │
├─────────────────────────────────────────────────────────┤
│  ACTION BUTTONS: SOLD / UNSOLD / UNDO                  │
│  (Remove NEXT PLAYER)                                   │  ← REMOVE
└─────────────────────────────────────────────────────────┘
```

#### BigScreenPage (`app/big-screen/page.jsx`)

**Changes**:
1. Add SquadList component below auction display showing current team's purchased players
2. Implement scrolling/pagination for squad list if squad grows beyond viewport
3. Add responsive typography using ResponsiveText for 4K displays
4. Optimize animations: use transform/opacity only (GPU-accelerated)
5. Add "OFFLINE" indicator if Realtime disconnects
6. Implement squad update animations: new SquadCard entrance on purchase
7. Scale layout to handle chroma-key mode with pure green background (#00FF00)

**New Sections**:
- Squad Display Panel (below bid information): Shows team roster with SquadCards in grid
- Team Performance Summary: Squad size (X/7), budget remaining, player count by role

#### OwnerPage (`app/owner/page.jsx`)

**Changes**:
1. Add SquadList component showing mobile-optimized squad display
2. Implement one-thumb bidding: Large bid button (60px min height) positioned for thumb reach
3. Add responsive layout: Stack vertically on 320px, 2-column on 600px+
4. Show current squad in scrollable/paginated list below bid area
5. Add "Budget Exhausted" state when purse_remaining === 0
6. Implement skeleton loaders for squad updates
7. Add "Connection Lost" indicator with auto-reconnect visual

**Mobile-Optimized Layout**:
```
┌─────────────────────────────────────┐
│  TEAM HEADER                        │ (sticky, 40px)
│  └─ Team name, logo, budget         │
├─────────────────────────────────────┤
│  CURRENT PLAYER / AUCTION STATE     │ (flex, grow)
│  ├─ Current player name             │
│  ├─ Base price                      │
│  └─ Current bid / highest team      │
├─────────────────────────────────────┤
│  SQUAD LIST (scrollable)            │ (flex, grow, min-h-24)
│  └─ SquadCards in 2-column grid     │
├─────────────────────────────────────┤
│  BID BUTTON (sticky, bottom)        │ (60px height, full width)
│  └─ [BID] or [BUDGET EXHAUSTED]     │
└─────────────────────────────────────┘
```

### Component Composition Patterns

**Data Flow**: 
```
useLiveAuction Hook
  ├─ state: teams, players, auctionState, currentPlayer
  ├─ actions: placeBid, markSold, markUnsold, loadNextPlayer
  └─ realtime: subscriptions via channel.on('postgres_changes')
        ↓
      Pages (AdminConsole, BigScreen, Owner)
        ├─ Extract relevant state for display
        └─ Pass subset to child components as props
              ↓
            UI Components (SearchInput, SquadCard, TeamCard, BidTicker)
              └─ Accept immutable props, trigger callbacks on user action
```

**Memoization Strategy**:
- Use `React.memo()` on PlayerCard, SquadCard, BidTicker to prevent unnecessary re-renders
- Use `useCallback()` for all event handlers (search, bid, undo) to preserve reference stability
- Use `useMemo()` for filtered arrays (currentPlayer, currentHighestTeam, pendingQueue) in useLiveAuction hook
- Avoid prop spreading; explicitly pass needed values

## Data Models

### Player Schema (Postgres)

```sql
CREATE TABLE players (
  id              SERIAL PRIMARY KEY,
  serial_number   INTEGER UNIQUE NOT NULL,  -- From EA data.xlsx
  name            TEXT NOT NULL,
  role            TEXT CHECK (role IN ('Batsman','Bowler','All-Rounder','Wicket-Keeper','Unassigned')),
  base_price      INTEGER NOT NULL DEFAULT 100,
  photo_url       TEXT,
  mobile          TEXT,
  rating          SMALLINT DEFAULT 0 CHECK (rating BETWEEN 0 AND 2),
  entry_fee       INTEGER,
  source_group    TEXT,  -- Historical: original sign-up group
  queue_order     INTEGER UNIQUE NOT NULL,  -- Auctioneer-set player sequence
  status          TEXT NOT NULL DEFAULT 'pending' 
                  CHECK (status IN ('pending','in_auction','sold','unsold')),
  sold_to_team_id INTEGER REFERENCES teams(id),
  sold_price      INTEGER,
  sold_timestamp  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Team Schema (Postgres)

```sql
CREATE TABLE teams (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  short_code        TEXT UNIQUE NOT NULL,
  sponsor_name      TEXT DEFAULT '',
  captain_name      TEXT,
  captain_mobile    TEXT,
  captain_photo_url TEXT,
  pin               CHAR(4) UNIQUE NOT NULL,
  purse_total       INTEGER NOT NULL DEFAULT 10000,
  purse_remaining   INTEGER NOT NULL DEFAULT 10000,
  roster_count      INTEGER DEFAULT 0 CHECK (roster_count >= 0 AND roster_count <= 7),
  color_hex         TEXT DEFAULT '#F5A623',
  logo_url          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### Auction State Schema (Postgres)

```sql
CREATE TABLE auction_state (
  id                      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_player_id       INTEGER REFERENCES players(id),
  current_highest_bid     INTEGER DEFAULT 0,
  current_highest_team_id INTEGER REFERENCES teams(id),
  min_increment           INTEGER DEFAULT 100,
  timer_seconds           INTEGER DEFAULT 15,
  timer_started_at        TIMESTAMPTZ,
  status                  TEXT DEFAULT 'idle' 
                          CHECK (status IN ('idle','bidding','sold','unsold')),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### Bid History Schema (Postgres)

```sql
CREATE TABLE bid_history (
  id                SERIAL PRIMARY KEY,
  player_id         INTEGER REFERENCES players(id),
  bid_amount        INTEGER,
  team_id           INTEGER REFERENCES teams(id),
  action_type       TEXT CHECK (action_type IN ('bid','sold','unsold')),
  timestamp         TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Import Pipeline (Player Migration)

1. **Parse Phase**: Read EA data.xlsx using xlsx library or server-side parsing
2. **Validate Phase**: For each row:
   - Extract: serial_number, name, role, base_price, metadata
   - Validate: serial_number unique, name not empty, role in valid set, base_price numeric > 0
   - Collect errors for UI display
3. **Deduplicate Phase**: Identify duplicates by serial_number + name combination
4. **Transform Phase**: Assign queue_order based on serial_number order
5. **Insert Phase**: Batch insert all valid records with preserved order
6. **Report Phase**: Display summary (total imported, validation errors, duplicates detected, first 10 preview)

**Server Endpoint** (`POST /api/import-players`):
```javascript
// Body: { file: FormData with .xlsx, adminPin: string }
// Returns: { ok, summary: { imported, errors, duplicates }, errors: [] }
// Persists valid records; displays validation errors for retry
```

## Design System

### Color Palette

**Primary Colors** (Professional Sports Brand):
- Primary 500: `#0066CC` (Royal Blue) - Primary action, highlights
- Primary 400: `#3385DB` - Hover state
- Primary 600: `#004CA0` - Focus state, active states

**Accent Colors** (Auction-Specific):
- Gold (Bid/Sold): `#FFB81C` - Highest bid, SOLD state
- Danger (Unsold): `#DC143C` - UNSOLD, errors
- Success (Confirmation): `#10B981` - Successful bids, confirmations
- Warning (Info): `#F59E0B` - Information alerts

**Neutral Colors** (Foundation):
- Neutral 50: `#F9FAFB` - Backgrounds, light surfaces
- Neutral 100: `#F3F4F6` - Subtle backgrounds
- Neutral 200: `#E5E7EB` - Borders, dividers
- Neutral 400: `#9CA3AF` - Secondary text, placeholders
- Neutral 600: `#4B5563` - Primary text
- Neutral 900: `#111827` - Darkest text

**Semantic Colors**:
- Success: `#10B981` (Green)
- Error: `#EF4444` (Red)
- Warning: `#F59E0B` (Amber)
- Info: `#3B82F6` (Blue)

**Team Colors** (8 Franchises):
Each team has unique primary + secondary colors for visual identification across all screens:
- Team 1: Primary `#E63946`, Secondary `#A4161A`
- Team 2: Primary `#1D3557`, Secondary `#457B9D`
- Team 3: Primary `#F77F00`, Secondary `#FCBF49`
- Team 4: Primary `#06A77D`, Secondary `#2D6A4F`
- Team 5: Primary `#8B5A8E`, Secondary `#D4A5D4`
- Team 6: Primary `#FF006E`, Secondary `#FB5607`
- Team 7: Primary `#2A9D8F`, Secondary `#E76F51`
- Team 8: Primary `#264653`, Secondary `#E9C46A`

### Typography System

**Font Stack**:
- Heading: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` (weights: 600, 700, 800)
- Body: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` (weights: 400, 500, 600)
- Mono (numbers, codes): `'IBM Plex Mono', 'Courier New', monospace` (weights: 400, 500)

**Size Scale** (following 1.2x progression):
```
xs:  12px / 1rem
sm:  14px / 1.167rem
md:  16px / 1.333rem
lg:  20px / 1.667rem
xl:  24px / 2rem
2xl: 28px / 2.333rem
3xl: 32px / 2.667rem
4xl: 40px / 3.333rem
5xl: 48px / 4rem
```

**Line Heights**:
- Tight: 1.2 (headings)
- Normal: 1.5 (body)
- Relaxed: 1.75 (descriptive text)

### Spacing System (8px Baseline)

```
4px   → xs (micro spacing, icon internal)
8px   → sm (minimal, compact lists)
12px  → md (small, internal padding)
16px  → lg (standard, default padding, section gaps)
24px  → xl (medium, section separation)
32px  → 2xl (large, major section separation)
48px  → 3xl (extra large, page-level spacing)
64px  → 4xl (max spacing, full-screen sections)
```

### Shadow System

```javascript
const SHADOWS = {
  // Subtle: Used for hover states, slight elevation
  subtle: '0 2px 8px rgba(0,0,0,0.08)',
  
  // Medium: Used for cards, modals
  medium: '0 4px 16px rgba(0,0,0,0.12)',
  
  // Elevation: Used for dropdowns, elevated surfaces
  elevation: '0 8px 24px rgba(0,0,0,0.15)',
  
  // Focus: 3px ring for keyboard focus states
  focus: '0 0 0 3px rgba(0,102,204,0.2)'
};
```

### Border Radius System

```
tight:   4px    → Small components (inputs, badges)
subtle:  6px    → Moderate components (small cards)
standard: 8px   → Main components (cards, modals, buttons)
rounded: 12px   → Larger containers (team cards, panels)
pill:    24px   → Pill shapes (pills buttons, full-width rounded)
full:    9999px → Perfect circles (avatars, circular elements)
```

### Animation System

**Timing Functions**:
- Ease-Out: `cubic-bezier(0.16, 1, 0.3, 1)` - Quick starts, smooth finish (entrances)
- Ease-In-Out: `cubic-bezier(0.4, 0, 0.2, 1)` - Smooth throughout (transitions)
- Power2.Out: `cubic-bezier(0.33, 0.66, 0.66, 1)` - GSAP default (bid ticker, smooth climbs)

**Duration Standards**:
- Quick: 150ms - Micro interactions (hover, focus states)
- Standard: 200-250ms - Component transitions (modals, overlays)
- Slow: 400-600ms - Complex animations (sold hammer, entrance sequences)
- Smooth: 500-550ms - LED ticker (bid climbs smoothly)

**Micro-Interactions**:
- Button Hover: 200ms, scale 1.02, shadow increase
- Card Hover: 200ms, scale 1.01, shadow increase
- Squad Card Entrance: 250ms, fade + scale (0.95 → 1)
- Modal Entrance: 200ms, fade + scale (0.9 → 1)
- Bid Number Climb (BidTicker): 550ms, smooth value tween
- Sold Hammer: 600ms sequence (drop + rotate, counter-rotate + shockwave, shake, text punch)
- Error Toast: 200ms slide-in from top, auto-dismiss 5s
- Success Toast: 200ms slide-in from bottom, 3s display

**GSAP Usage**:
- BidTicker: `gsap.to(proxy, { val: newValue, duration: 0.55, ease: 'power2.out', onUpdate })` - Animates numeric display
- SoldHammer: Sequence of `gsap.to()` calls for drop, counter-rotate, shockwave, shake, text punch
- Entrance Animations: `gsap.fromTo()` for fade, scale, slide transitions
- No pure CSS animations for performance-critical sequences; use GSAP for full control

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Assessment: Is Property-Based Testing Appropriate?

This feature combines multiple concerns:

**PBT IS Appropriate For**:
- Player search: Input variation (names, serial numbers, edge cases) reveals bugs
- Data validation during import: Various input formats, edge cases, duplicates
- Real-time state synchronization: Different update sequences should preserve consistency
- Squad calculation logic: Different purchase patterns should maintain correct roster counts
- Bid validation logic: Different budget/purse/increment values should correctly accept/reject bids

**PBT IS NOT Appropriate For**:
- UI rendering (React components, CSS layout) → Use snapshot tests instead
- Supabase infrastructure (RPC functions, Row Level Security) → Use integration tests with live database
- Mobile responsiveness (CSS media queries, layout shifts) → Use visual regression tests
- GSAP animations (transforms, timings) → Manual testing or visual regression
- Keyboard navigation (focus management, ARIA) → Manual accessibility testing

**Approach**: We will focus PBT on pure logic layers (search, validation, state calculations) and use unit tests + integration tests for infrastructure and UI rendering.



### Property 1: Player Import Field Completeness

*For any* row in the imported player data (EA data.xlsx), all required fields (serial_number, name, role, base_price) SHALL be extracted and stored in the players table without data loss or transformation.

**Validates: Requirements 1.1, 1.6**

### Property 2: Serial Number Sequence Preservation

*For any* player roster imported from a source file, the queue_order values SHALL be assigned in ascending order matching the original serial_number sequence, preserving player order from source.

**Validates: Requirements 1.2**

### Property 3: Duplicate Detection Accuracy

*For any* player dataset, the import validation process SHALL identify duplicate entries (identical serial_number or identical name combination) and reject them, preventing duplicates from entering the system.

**Validates: Requirements 1.3**

### Property 4: Required Field Validation

*For any* player record missing one or more required fields (serial_number, name, role, base_price), the import validation SHALL reject that record and report the specific missing field in the error log.

**Validates: Requirements 1.5**

### Property 5: Autocomplete Filtering Accuracy

*For any* search query (name or serial_number partial match) and any player roster, the autocomplete results SHALL contain only players whose name or serial_number matches the query string (case-insensitive partial match) and SHALL exclude already-sold players.

**Validates: Requirements 2.1**

### Property 6: Autocomplete Result Ranking

*For any* player roster and search query, the autocomplete results SHALL rank exact name/serial matches first, followed by partial matches, and SHALL limit results to maximum 10 players, ordered by relevance score.

**Validates: Requirements 2.2**

### Property 7: Any Unsold Player Selectable

*For any* auction state, the auctioneer SHALL be able to select and load any player with status='pending' or status='unsold', regardless of queue_order position, and regardless of previously-selected players.

**Validates: Requirements 2.6**

### Property 8: Team Name Consistency

*For any* team, when the team name is updated, all views (current auction display, squad lists, bid history, exports) SHALL display the new team name consistently, with no contradictory old names visible.

**Validates: Requirements 3.1, 3.5**

### Property 9: Captain Information Persistence

*For any* team update operation (update captain_name, captain_mobile, or captain_photo_url), those fields SHALL be persisted in the teams table and reflected immediately in all team displays (Big Screen, Admin, Mobile Dashboard).

**Validates: Requirements 3.2**

### Property 10: Historical Team Name Preservation

*For any* bid_history or auction_history record created while a team had a certain name, when the team name is later changed, that history record SHALL display the team name as it existed at the time of the transaction, not the current name.

**Validates: Requirements 3.4**

### Property 11: Sold Player Squad Assignment

*For any* player marked as sold (status='sold', sold_to_team_id set, sold_price recorded), that player SHALL immediately appear in the purchasing team's squad list, and the team's roster_count SHALL increment by 1.

**Validates: Requirements 5.1**

### Property 12: Squad Card Field Completeness

*For any* squad card component rendered with a player object, that card SHALL display all required fields: player name, role (role badge), base price, sold price, purchase order number, and star rating (if available).

**Validates: Requirements 5.4**

### Property 13: Team Card Squad Stats Accuracy

*For any* team card displayed with a team object, the card's displayed squad statistics (roster_count, purse_remaining) SHALL match the team's actual database values: roster_count = count(players where sold_to_team_id = team.id), and purse_remaining = purse_total - sum(sold_price for all team's players).

**Validates: Requirements 5.5**

### Property 14: Undo Player Squad Removal

*For any* player that was purchased and added to a team's squad, when the undo action is triggered on that purchase, the player's status SHALL revert from 'sold' to 'pending', sold_to_team_id SHALL clear, and the player SHALL be removed from the squad and available for purchase again.

**Validates: Requirements 5.7**

### Property 15: Roster Full Bidding Block

*For any* team with roster_count >= 7 (squad at maximum capacity), that team SHALL not be able to place new bids or purchase additional players, and the UI SHALL display a "Roster Full" or "Budget Exhausted" indicator.

**Validates: Requirements 5.8**

### Property 16: Leaderboard Sorting Correctness

*For any* set of teams with varying roster_count, purse_remaining, and total_spent values, the leaderboard display SHALL correctly sort teams according to selected metric: teams ranked by descending order of roster_count (most players purchased), or descending order of total_spent, or ascending order of purse_remaining.

**Validates: Requirements 9.4**

### Property 17: Statistics Calculations Accuracy

*For any* auction state in progress, the displayed summary statistics (total_players_sold, total_players_unsold, average_sell_price, price_range_min, price_range_max, budget_utilization_percent_per_team) SHALL match calculations from the live database: sold count = count(players.status='sold'), unsold count = count(players.status='unsold'), etc.

**Validates: Requirements 9.5**

### Property 18: Bid Failure Error Message

*For any* bid placement that fails for a specific reason (insufficient budget remaining, roster at capacity, bid amount below minimum), the system SHALL display an error message explaining the specific constraint that was violated and suggesting the correct action (e.g., "Budget exhausted - purchase another player first" or "Team roster full - cannot bid").

**Validates: Requirements 13.2**

### Property 19: Import Error Detailed Report

*For any* player import operation with validation failures, the system SHALL produce a detailed error report where each validation error shows: the problematic record/field, the specific reason for rejection (e.g., "Duplicate serial number", "Missing name field", "Invalid role"), and allows the user to correct and retry.

**Validates: Requirements 13.3**

### Property 20: Invalid Action Error Explanation

*For any* invalid user action (bid below minimum increment, select unsold player, bid with zero budget), the system SHALL display a clear error message explaining the constraint violated and, where applicable, suggest the correct action (e.g., "Bid must be at least 100 points above current bid").

**Validates: Requirements 13.7**

### Property 21: CSV Export Field Completeness

*For any* auction export in CSV format, each exported player record SHALL contain all required fields: serial_number, player_name, role, base_price, sold_price, purchasing_team_name, sold_timestamp, with no missing values or placeholder text (unless field was null in source).

**Validates: Requirements 14.2**

### Property 22: Export Chronological Ordering

*For any* purchase_history or bid_history export, the records SHALL be sorted in ascending chronological order by timestamp (oldest to newest), allowing accurate historical review of auction progression.

**Validates: Requirements 14.5**

---

## Property Reflection

After reviewing all 22 properties, the following consolidations improve coverage without losing specificity:

- **Property 8 + 3.5**: Team name consistency already covers both current display and export consistency; no redundancy
- **Property 13 + 14**: Squad stats and undo removal are distinct concerns (state display vs. state mutation); no consolidation
- **Property 18 + 20**: Bid failure messages + invalid action messages are part of same error handling strategy but affect different workflows; keep both
- **Property 21 + 22**: CSV completeness and ordering are distinct; combined they ensure both data integrity and auditability

**Final Count**: 22 unique, non-redundant properties covering all PBT-suitable requirements.

---

## Error Handling

### Network Errors

**Scenario**: Realtime connection drops or API request times out

**Strategy**:
- Catch Supabase client errors in useLiveAuction hook and set `error` state
- Display connection status indicator at top of page: "Offline - Last synced at 3:45 PM"
- Maintain last-known state (don't blank screen)
- Auto-reconnect: call `refreshAll()` every 5 seconds until connection restored
- On reconnect, merge any missed updates using max(timestamp) approach

**UI Messaging**:
```javascript
// In all screens
{error && (
  <div className="fixed top-4 left-4 right-4 bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded">
    <p className="font-semibold">Connection Lost</p>
    <p className="text-sm">Trying to reconnect...</p>
  </div>
)}
```

### Bid Placement Failures

**Scenarios**:
1. Team budget insufficient for proposed bid
2. Team roster at capacity (7 players)
3. Bid amount below minimum increment
4. Player already sold

**Strategy**:
- RPC function `place_bid()` validates all constraints and returns `{ ok: false, error: "reason" }`
- Client catches error and displays user-friendly message with suggestion
- Allows retry with different team or adjusted bid

**Error Messages**:
```javascript
// From RPC validation failures
{
  'PURSE_INSUFFICIENT': 'Team budget exhausted. Remaining: [amount]. This bid requires [needed].',
  'ROSTER_FULL': 'Team roster at capacity (7/7). No more players can be purchased.',
  'BID_BELOW_MIN': `Bid must be at least ${minIncrement} above current bid (${currentBid}). Try ${currentBid + minIncrement}.`,
  'PLAYER_SOLD': 'This player has already been sold. Select another player.',
  'INVALID_TEAM': 'Team not found. Verify team PIN and try again.'
}
```

### Data Import Failures

**Scenarios**:
1. Excel file parsing error
2. Required field missing
3. Duplicate player detected
4. Invalid role value
5. Base price not numeric or <= 0

**Strategy**:
- Parse Excel row by row
- Collect all validation errors in array with record index + error reason
- Display summary and detailed error list
- Allow user to correct and re-upload
- Provide download of "error report" CSV with all failures

**UI Display**:
```
IMPORT RESULTS
✓ Successfully imported: 45 players
✗ Validation errors: 3 records

ERROR DETAILS:
Row 12: Duplicate serial_number (already exists in system)
Row 25: Missing required field: role
Row 31: Invalid base_price: "abc" (must be numeric)

[Download Error Report] [Fix & Re-Upload]
```

### UI Error States

**Toast Notifications** (auto-dismiss after 5 seconds):
```javascript
// Error toast
<div className="fixed bottom-6 right-6 bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg shadow-lg">
  <p className="font-semibold text-sm">{errorMessage}</p>
</div>

// Success toast
<div className="fixed bottom-6 right-6 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg shadow-lg">
  <p className="font-semibold text-sm">✓ {successMessage}</p>
</div>
```

---

## Testing Strategy

### Unit Tests (Example-Based)

**Focus**: Specific input/output scenarios, edge cases, integration points

**Coverage Areas**:

1. **Player Import Logic**
   - Test: Parsing valid Excel row → all fields extracted
   - Test: Missing required field → validation error with field name
   - Test: Duplicate serial number → rejection with error
   - Test: Invalid role value → validation error

2. **Player Search Logic**
   - Test: Query "kohli" → returns all players with "kohli" in name
   - Test: Query "5" → returns player serial_number starting with "5"
   - Test: Empty query → returns all unsold players
   - Test: Query with 15 results → returns only first 10, ranked correctly

3. **Team State Updates**
   - Test: Update team name → new name stored
   - Test: Add player to team → roster_count increments
   - Test: Team budget 0 → "Budget Exhausted" badge shown
   - Test: Undo purchase → player removed from squad, roster_count decrements

4. **Error Message Logic**
   - Test: Bid with insufficient budget → displays correct budget shortfall amount
   - Test: Bid with roster full → displays "7/7 players"
   - Test: Invalid role import → error message shows invalid value

5. **Statistics Calculations**
   - Test: Generate various auction states → statistics match hand-calculated values
   - Test: Leaderboard sorting by different metrics → sort order correct

6. **Export Data Integrity**
   - Test: Generate CSV from auction data → all rows contain required fields
   - Test: Export with team name change → current name used
   - Test: Export purchase history → chronological order maintained

### Property-Based Tests

**Tools**: Hypothesis (Python integration tests) or fast-check (JavaScript)

**Configuration**: Minimum 100 iterations per property test

**Tagging**: Each test includes comment with property reference and requirements traceability

```javascript
// Feature: cricket-auction-complete-upgrade, Property 5: Autocomplete Filtering Accuracy
test('autocomplete returns only players matching query', () => {
  // Generate: randomized player roster, random search query
  // Execute: filterAutocompleteSuggestions(query, players)
  // Assert: all results match query by name or serial, all are unsold
  // Run 100+ iterations with varying roster sizes, queries, special characters
});

// Feature: cricket-auction-complete-upgrade, Property 13: Team Card Squad Stats Accuracy
test('team card stats match database calculations', () => {
  // Generate: random team with random purchased players
  // Execute: getTeamCardStats(team)
  // Assert: roster_count === count(sold players), purse_remaining === total - spent
  // Run 100+ iterations with varying squad sizes and prices
});

// Feature: cricket-auction-complete-upgrade, Property 16: Leaderboard Sorting Correctness
test('leaderboard sorts correctly by selected metric', () => {
  // Generate: 8 teams with random roster_count, spent amounts
  // Execute: sortLeaderboard(teams, 'players_purchased')
  // Assert: teams in descending order of roster_count
  // Run 100+ iterations with various team configurations
});
```

### Integration Tests

**Focus**: Real Supabase database, Realtime subscription, full workflows

**Coverage Areas**:

1. **End-to-End Bid Flow**
   - Setup: 8 teams, 48 players in Supabase
   - Execute: Place bid via Admin Console → verify Realtime triggers on Big Screen + Owner Dashboard → verify bid appears in bid_history
   - Assertion: All three screens show identical bid amount within 1 second

2. **Player Import with Database Persistence**
   - Setup: Upload EA data.xlsx via import endpoint
   - Execute: Import completes, verify players table contains all records with correct serial_number sequence
   - Assertion: Queue order matches source, all fields persisted

3. **Undo Action Atomicity**
   - Setup: Purchase player (player moved to squad)
   - Execute: Undo action
   - Assertion: Player status reverts to pending, squad updates immediately on all screens, player available for new bid

4. **Roster Full Constraint**
   - Setup: Team with 7 players in squad
   - Execute: Try to place bid for team
   - Assertion: Bid rejected, error message displayed

5. **Real-Time Squad Sync**
   - Setup: Mobile Dashboard and Big Screen open simultaneously
   - Execute: Place bid from Admin Console
   - Assertion: Both screens show new squad member within 1 second, animations trigger smoothly

### Performance Tests (Benchmarking)

**Targets**:
- Player selection <300ms (from search input to auction screen load)
- Bid placement confirmation <500ms
- Realtime propagation <1 second
- Big Screen 60fps during active bidding

**Tools**: Lighthouse (page load), browser DevTools (runtime performance), k6 (load testing)

### Accessibility Testing (Manual + Automated)

**Automated Checks**:
- Color contrast: 4.5:1 for normal text, 3:1 for large text
- ARIA labels: Present on all buttons, inputs, interactive elements
- Keyboard navigation: Tab order logical, focus indicators visible
- prefers-reduced-motion: Respected for animations

**Manual Testing**:
- Screen reader (NVDA, JAWS): Navigate full flow, verify announcements
- Keyboard-only: Complete auctioneer workflow using only keyboard
- Mobile screen reader: Test owner dashboard voice control

### Visual Regression Tests

**Tools**: Percy, BackstopJS, or similar

**Scenarios**:
- Admin Console at 1920×1080
- Big Screen at 1920×1080, 2560×1440, 3840×2160
- Mobile Dashboard at 320px, 375px, 600px, 768px
- All color themes (light, dark if applicable)
- Error states (connection lost, bid failure, import errors)

---

## Implementation Phases

### Phase 1: Data Migration & Database Schema (Week 1)

**Tasks**:
1. Create data import pipeline (Excel parsing, validation, duplicate detection)
2. Add `serial_number` field to players table, ensure unique constraint
3. Update team table with new franchise names and identities
4. Create migration script: seed.sql → new team names + imported player roster
5. Update Supabase RPC functions to handle new player fields
6. Test import with EA data.xlsx end-to-end

**Deliverables**:
- Import endpoint (`POST /api/import-players`)
- Migration completed: 48 players imported with zero data loss
- All 8 teams updated with new names/captains/colors
- Database schema validated

### Phase 2: Auctioneer Console Redesign with Player Search (Week 2)

**Tasks**:
1. Build PlayerSearch component with autocomplete dropdown
2. Implement keyboard navigation (Up/Down/Enter/Escape)
3. Integrate search into AdminConsole page layout
4. Remove "Next Player" button
5. Update keyboard shortcut handler to maintain focus on search input
6. Build PlayerFormModal updates for additional player fields
7. Test search performance with 48-player roster

**Deliverables**:
- PlayerSearch component with autocomplete working
- Admin Console layout updated, no "Next Player" button
- Keyboard navigation fully functional
- Search response time <300ms
- All keyboard shortcuts (Space, 1-8, S, U, Z) working with search focused

### Phase 3: UI/UX Redesign & Design System (Week 3)

**Tasks**:
1. Create DesignTokens.jsx with colors, spacing, typography, shadows, radius
2. Build ResponsiveText component for fluid typography
3. Update all existing components (BidTicker, PlayerCard, etc.) to use design tokens
4. Redesign AdminConsole page: apply design tokens, improve spacing, add animations
5. Redesign BigScreenPage: apply design tokens, optimize 4K typography
6. Redesign OwnerPage: mobile-first responsive layout, one-thumb bidding
7. Create component library documentation (Storybook optional)

**Deliverables**:
- DesignTokens.jsx defining all colors, spacing, typography, shadows
- All components using CSS variables for tokens
- Design system documentation (README)
- AdminConsole, BigScreen, Owner pages visually updated
- Mobile dashboard works perfectly on 320px screens
- Big Screen responsive at 3840px with readable typography

### Phase 4: Real-Time Squad Visibility & Updates (Week 4)

**Tasks**:
1. Build SquadCard component for individual player display
2. Build SquadList component for team roster visualization
3. Add squad display to BigScreenPage below auction info
4. Add squad display to OwnerPage below bid area
5. Implement virtualization for large squad lists if needed
6. Add entrance animations to squad cards when player purchased
7. Test real-time sync across all three screens simultaneously

**Deliverables**:
- SquadCard component with full player information display
- SquadList component with scroll/pagination
- Big Screen shows purchasing team's squad in real-time
- Mobile Dashboard shows team's squad, updates instantly on purchases
- Squad card entrance animations smooth and professional
- Undo action immediately removes player from squad

### Phase 5: Mobile & Big Screen Enhancements (Week 5)

**Tasks**:
1. Implement 44px minimum button sizes on mobile
2. Add one-thumb bidding layout on OwnerPage (bid button at bottom, 60px height)
3. Implement responsive grid layouts (mobile 1-col, tablet 2-col, desktop 4-col)
4. Add "Budget Exhausted" and "Roster Full" states with visual indicators
5. Optimize Big Screen for chroma-key mode (pure green background, white text)
6. Add OFFLINE indicator and auto-reconnect UI to all screens
7. Implement skeleton loaders for data loading states
8. Test on actual mobile devices (iPhone, Android) at various sizes

**Deliverables**:
- Mobile Dashboard fully optimized for 320-768px screens
- One-thumb bidding works smoothly with thumb placement
- Big Screen displays chroma-key mode correctly
- All screens show connection status and recover gracefully
- Skeleton loaders animate smoothly during data fetch

### Phase 6: Performance Optimization & Testing (Week 6)

**Tasks**:
1. Implement lazy loading for player search results
2. Add memoization to prevent unnecessary re-renders (React.memo, useCallback, useMemo)
3. Optimize BidTicker animation with GSAP performace tuning
4. Profile and optimize Big Screen at 60fps during active bidding
5. Set up property-based tests for search, import, stats calculations
6. Create integration tests for bid flow, undo, team updates
7. Run performance benchmarks: player selection <300ms, bid <500ms, realtime <1s
8. Conduct accessibility testing and fix issues
9. Set up visual regression tests for all breakpoints

**Deliverables**:
- Player selection <300ms consistently
- Bid placement <500ms consistently
- Realtime updates <1 second end-to-end
- Big Screen maintains 60fps during active bidding
- Property-based tests passing (100+ iterations each)
- Integration tests covering full workflows
- Accessibility audit passing (WCAG 2.1 Level AA)
- Visual regression tests established and passing

### Phase 7: Documentation & Deployment (Week 7)

**Tasks**:
1. Document Design System (colors, typography, spacing, components)
2. Document PlayerSearch component usage and API
3. Document import process and error handling
4. Create admin/owner/big-screen user guides
5. Deploy to Vercel with environment variables
6. Set up monitoring and error logging
7. Conduct final end-to-end testing
8. Create rollback plan and incident runbooks

**Deliverables**:
- Design System documentation
- Component API documentation
- User guides for all three interfaces
- Live deployment on Vercel
- Monitoring dashboard active
- Ready for real tournament

---

## Success Metrics

✅ **All players imported accurately**: 48 players from EA data.xlsx, zero data loss, correct serial_number sequence preserved

✅ **Auctioneer console responsive**: Player search returns results <300ms, autocomplete displays within 250ms, keyboard navigation seamless

✅ **Team identities updated**: All 8 teams display with new names/captains/colors consistently across all screens

✅ **UI/UX professional**: Design tokens applied, consistent spacing, smooth animations (200-600ms), mobile-first responsive design

✅ **Real-time squad visibility**: Players appear in team squad cards instantly upon purchase, undo removes instantly, all screens synchronized

✅ **Big Screen production-ready**: Scales to 4K (3840×2160) with readable text, 60fps smooth animations, chroma-key mode works

✅ **Mobile dashboard frictionless**: Works on 320px screens, one-thumb bidding, squad visible, connection handling graceful

✅ **Performance targets met**: Player selection <300ms, bid confirmation <500ms, realtime sync <1 second

✅ **System feels professional**: Premium sports software aesthetic, responsive to user input, robust error handling, accessibility compliant

---

## References

- **Supabase Realtime Docs**: https://supabase.com/docs/guides/realtime
- **GSAP Animation Library**: https://gsap.com/
- **WCAG 2.1 Accessibility Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Responsive Typography**: https://www.smashingmagazine.com/2016/05/fluid-typography/
- **React Performance Optimization**: https://react.dev/reference/react/memo
- **Next.js Performance Guide**: https://nextjs.org/learn-next-js/seo/measuring-performance

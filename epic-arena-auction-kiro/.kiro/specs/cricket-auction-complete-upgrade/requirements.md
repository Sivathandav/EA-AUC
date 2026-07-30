# Cricket Auction Application — Complete Upgrade Requirements

## Introduction

The Cricket Auction Application is evolving from a functional prototype into a production-grade live auction management platform for professional cricket tournaments. This comprehensive upgrade transforms the system from its current generic AI-generated interface into a premium sports management application capable of real-world tournament operations.

The upgrade encompasses five major initiatives: migrating player data from authoritative sources, redesigning the auctioneer console for complete operational control, updating team identities with current rosters, transforming the UI/UX into a professional sports platform, and implementing real-time squad visibility and team management. The result will be a polished, responsive, enterprise-grade auction system that feels and functions like professional live sports software.

## Glossary

- **System**: The Cricket Auction Application — a real-time auction management platform for cricket tournaments
- **Auctioneer**: The operator controlling player selection order and managing the auction flow from the admin console
- **Team_Owner**: A franchisee participating in the auction via PIN-protected mobile dashboard
- **Player**: A cricket player available for auction, identified by serial number, name, role, and base price
- **Auction_Screen**: The real-time display showing current player, bid amounts, team bids, and auction state
- **Squad**: The roster of players purchased by a team
- **Purse**: The budget available to a team for purchasing players
- **Base_Price**: The starting price for a player in the auction
- **Bid_Amount**: The current highest bid for an active player
- **Real_Time_Update**: Immediate synchronization across all screens without manual refresh
- **Premium_Interface**: A professional, polished UI with consistent design system, smooth animations, and excellent UX
- **Search_And_Select**: Auctioneer feature to find and load players by name or serial number
- **Autocomplete**: Dynamic suggestions that appear as the auctioneer searches
- **Team_Card**: Visual representation of a team showing name, logo, colors, squad list, and squad stats
- **Squad_Card**: Individual player card within a team showing name, role, prices, rating, and status
- **Big_Screen_Display**: Venue projector or OBS display showing auction state for all attendees
- **Mobile_Dashboard**: Team owner interface on smartphones/tablets for bidding and squad monitoring
- **Design_System**: Documented set of reusable components, spacing, colors, typography, and patterns
- **Design_Tokens**: Documented values for colors, spacing, typography, shadows, radius, animations
- **Micro_Interaction**: Brief, meaningful animation in response to user action (hover, click, transition)
- **Loading_State**: Visual feedback indicating data is being fetched or processed
- **Skeleton_Loader**: Placeholder UI that animates to indicate loading without showing actual data
- **Empty_State**: Meaningful UI shown when a section has no data
- **Professional_Color_Palette**: Carefully chosen colors conveying premium sports brand identity
- **Responsive_Layout**: Interface that adapts gracefully from mobile (320px) to 4K displays (3840px)
- **Accessibility**: Conformance to WCAG 2.1 standards for users with disabilities
- **Performance_Baseline**: Target metrics for responsiveness, load time, and animation smoothness
- **Data_Integrity**: Accurate mapping of all player fields during migration from source data
- **Duplicate_Prevention**: Validation ensuring no duplicate players exist after data import
- **Serial_Number_Preservation**: Maintaining original player order/ID from source data
- **Real_Time_Squad_Sync**: Immediate reflection of player purchases in team squad lists across all views
- **Keyboard_Navigation**: Complete auctioneer workflow executable via keyboard without mouse

## Requirements

### Requirement 1: Player Database Migration with Data Integrity

**User Story:** As an event organizer, I want to import player data from authoritative sources, so that the auction system has accurate, current player information with preserved identity and no duplicates.

#### Acceptance Criteria

1. WHEN a player data file (EA data.xlsx) is imported, THE System SHALL parse all fields (serial number, name, role, base price, and metadata) accurately
2. WHEN import is completed, THE System SHALL preserve the original serial number sequence and player order from the source data
3. WHEN duplicate check is performed, THE System SHALL identify and reject any duplicate player entries (by serial number or name combination)
4. WHEN players are imported, THE System SHALL display a detailed import report showing total players imported, any validation errors, and confirmation of successful data mapping
5. WHEN a player record is saved, THE System SHALL validate all required fields are present (serial number, name, role, base price) before insertion
6. WHEN import completes successfully, THE System SHALL display confirmation that all fields match source data exactly, with zero data loss

### Requirement 2: Auctioneer Console Player Selection and Navigation

**User Story:** As an auctioneer, I want to search for and select players by name or serial number with intelligent suggestions, so that I have complete control over auction flow without cumbersome button navigation.

#### Acceptance Criteria

1. THE Auctioneer_Console SHALL display a search input field that accepts player search by name or serial number
2. WHEN the auctioneer types in the search field, THE System SHALL display autocomplete suggestions filtered by partial match (name or serial number)
3. WHEN autocomplete suggestions appear, THE System SHALL highlight matching text and show up to 10 results ranked by relevance
4. WHEN the auctioneer selects a player from suggestions (mouse or keyboard), THE System SHALL instantly load the auction screen for that player
5. THE Auctioneer_Console SHALL support keyboard-only navigation: Up/Down arrows to navigate suggestions, Enter to select, Escape to close suggestions
6. WHEN a player is selected, THE System SHALL remove the "Next Player" button entirely and eliminate sequential navigation
7. WHEN auction flow requires navigation, THE Auctioneer SHALL be able to select any unsold player in any order without workflow constraints
8. THE Auctioneer_Console SHALL preserve search state while a player is being auctioned, allowing quick access to next selection
9. WHEN auctioneer performs keyboard shortcuts (existing Space, 1-8, S, U, Z), THE System SHALL maintain focus on search input so shortcuts do not require mouse clicks

### Requirement 3: Complete Team Identity Update

**User Story:** As an administrator, I want to update all team names, captains, and identities throughout the system, so that the auction reflects current franchise rosters.

#### Acceptance Criteria

1. WHEN team data is updated, THE System SHALL consistently replace old team names with new names across all screens (team cards, auction display, dashboard, leaderboards, purchase screen, summary, exports, statistics, history)
2. WHEN a team identity is modified, THE System SHALL update captain information and team associations for all existing and future player purchases
3. WHEN team data changes, THE System SHALL propagate updates immediately to Big_Screen_Display, Mobile_Dashboard, and Admin_Console without requiring page refresh
4. WHEN historical data is viewed (bid history, auction history), THE System SHALL display both old and new team names with clear context (historical records show names at time of transaction)
5. WHEN export/reporting functions are used, THE System SHALL use current team names consistently in all output formats
6. WHEN a player is purchased by a team, THE System SHALL assign the player to the team with current identity and captain mapping

### Requirement 4: Complete UI/UX Redesign to Professional Standards

**User Story:** As an event stakeholder, I want the auction interface to feel like premium professional sports software, so that the event projects quality and attendees have a polished experience.

#### Acceptance Criteria

1. THE System SHALL implement a documented Design_System with reusable components, consistent spacing scale, professional typography, and color palette
2. WHEN Design_Tokens are defined, THE System SHALL establish values for: colors (primary, accent, neutral, semantic), spacing (8px baseline scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px), typography (font families, sizes, weights, line-heights), shadows (subtle: 2px-8px blur with 8-16% opacity), border-radius (4px-12px progression)
3. WHEN UI components are rendered, THE System SHALL apply consistent spacing to all elements: 16px padding standard, 24px gaps between sections, 12px internal component gaps
4. THE Auction_Screen SHALL display with rounded corners (8px), subtle depth effects (soft shadows), and professional spacing that conveys premium quality
5. WHEN user hovers over interactive elements (buttons, cards, bid fields), THE System SHALL animate smooth micro-interactions: 200-300ms transitions, scale/opacity/shadow changes with ease-out timing functions
6. THE System SHALL implement button hierarchy visually: primary action buttons with solid backgrounds and darker colors, secondary buttons with outline/ghost styles, disabled states with reduced opacity (50%)
7. WHEN modals or dialogs open, THE System SHALL animate entrance smoothly (150-250ms) with scale and opacity transitions, and overlay background shall fade in concurrently
8. WHEN players are loading or data is fetching, THE System SHALL display skeleton loaders (animated placeholder UI) instead of spinning icons, with subtle pulse animation (400-600ms cycle)
9. WHEN sections have no data (empty team squad before purchases), THE System SHALL display meaningful empty states with icon, descriptive message, and optional action (e.g., "No players purchased yet")
10. WHEN errors occur (failed bid, network issue), THE System SHALL display error messages with color (semantic red/orange), icon, and animation: slide-in from top with 200ms duration, auto-dismiss after 5 seconds
11. WHEN success actions complete (player purchased, team updated), THE System SHALL display brief success animations: green accent, checkmark icon, subtle scale pulse, 2-3 second display
12. THE Mobile_Dashboard SHALL adapt perfectly from 320px (small phone) to 768px (tablet) with responsive grid layouts, touch-friendly button sizes (minimum 44px×44px), and readable text at all sizes
13. THE Big_Screen_Display SHALL scale responsively from 1920×1080 (Full HD) to 3840×2160 (4K) with readable typography and well-balanced layouts at all resolutions
14. THE Admin_Console SHALL maintain 1:1 pixel precision at 1920×1080 (standard keyboard/mouse setup) with readable text and clickable elements
15. WHEN System is running, THE System SHALL display smooth page transitions: 150-200ms fade/slide animations between route changes with no layout shift
16. WHEN rendering large lists (player search results, squad lists), THE System SHALL implement virtualization or pagination to render only visible items, preventing performance degradation

### Requirement 5: Real-Time Team Squad Visibility and Updates

**User Story:** As a team owner or administrator, I want to see purchased players immediately assigned to team squad with real-time updates, so that squad status is always accurate without manual refresh.

#### Acceptance Criteria

1. WHEN a player is purchased and marked sold, THE System SHALL immediately assign the player to the purchasing team's squad
2. WHEN a squad_card is purchased, THE System SHALL display the player in the team's squad list instantly on all screens (Big_Screen_Display, Mobile_Dashboard, Team_Dashboard)
3. WHEN a purchase occurs, THE System SHALL not require any manual page refresh for squad updates to appear
4. WHEN squad list is displayed, THE System SHALL show each Squad_Card with: player name, role, base price, sold price, star rating (if available), purchase status (SOLD/UNSOLD), and purchase sequence number
5. WHEN a Team_Card is viewed, THE System SHALL display real-time squad composition: count of purchased players, squad member names, roles, purchase prices, all updating live as bids are won
6. WHEN multiple screens (Mobile_Dashboard, Big_Screen, Admin dashboards) are active, THE System SHALL synchronize squad data across all displays so all viewers see identical information simultaneously
7. WHEN purchase is reversed (undo action), THE System SHALL immediately remove the player from the squad and restore their availability
8. WHEN squad reaches capacity (7 players for cricket), THE System SHALL display visual indication on Team_Card (full badge, disabled bid state) preventing further purchases
9. WHEN Squad_Card is displayed, THE System SHALL animate the card entrance smoothly when player is added (150-250ms fade/slide with scale)
10. WHEN viewing squad comparison between teams, THE System SHALL display side-by-side squad lists with real-time synchronization across all teams simultaneously

### Requirement 6: Auctioneer Console Keyboard-Friendly Navigation

**User Story:** As an auctioneer, I want to navigate, search, and select players using keyboard shortcuts exclusively, so that I can manage auction flow rapidly without mouse distraction.

#### Acceptance Criteria

1. WHEN auctioneer is using Admin_Console, THE System SHALL enable full keyboard navigation: Tab moves between interactive elements, Shift+Tab moves backward
2. WHEN search field is focused, THE System SHALL accept keyboard input for name/serial number search with no mouse required
3. WHEN autocomplete suggestions display, THE System SHALL support Up/Down arrow keys to navigate suggestions, highlighting one at a time
4. WHEN suggestion is highlighted, THE System SHALL display visual focus indicator (outline, highlight color, or background change)
5. WHEN auctioneer presses Enter on a suggestion, THE System SHALL select that player and load the auction screen instantly
6. WHEN auctioneer presses Escape, THE System SHALL close suggestions and return focus to search field
7. WHEN player is auctioned, THE System SHALL maintain focus on search field, allowing Space/1-8/S/U/Z shortcuts to function without refocusing
8. THE System SHALL not trap keyboard focus; tabbing past last element shall cycle to first element (circular Tab order)
9. WHEN search field has focus, THE System SHALL display clear visual focus state (outline, glow, or background color change)
10. WHEN autocomplete dropdown is open, THE System SHALL display clear visual indication of focus: currently highlighted item shows distinct background/border

### Requirement 7: Big Screen Display Real-Time Updates and Big Screen Display Aesthetics

**User Story:** As a venue manager, I want the big screen display to show live auction state with professional visual presentation, so that all attendees see current information instantly.

#### Acceptance Criteria

1. WHEN Big_Screen_Display is active, THE System SHALL display current player, bid amount, highest bidding team, and auction timer in premium sports presentation
2. WHEN bid amount changes, THE System SHALL animate the bid number smoothly (LED scoreboard effect) rather than snap instantly, creating visual feedback of ascending bids
3. WHEN a player is marked sold, THE System SHALL display "SOLD!" announcement with scale/pulse animation and sound (optional), maintaining impact without overwhelming viewers
4. WHEN Big_Screen_Display is viewed, THE System SHALL scale typography and layouts to be readable from 50+ feet away on large venue screens
5. WHEN Big_Screen_Display is shown, THE System SHALL refresh all real-time data (current player, bids, team information) within 1 second of any change
6. WHEN color/chroma-key mode is enabled, THE System SHALL display pure green background (#00FF00) or designated transparency color with foreground elements in white/neutral colors
7. WHEN Big_Screen_Display shows team cards, THE System SHALL display team colors prominently (backgrounds, accent stripes, or borders) for immediate visual team identification
8. WHEN squad information is displayed on Big_Screen, THE System SHALL show purchased players with card design (name, role, price) in a scrolling or pagination format
9. WHEN Big_Screen_Display transitions between players, THE System SHALL animate transitions smoothly (200-300ms fade/slide) without jarring cuts
10. WHEN Big_Screen has zero network connectivity, THE System SHALL display last known state for up to 5 minutes with "OFFLINE" indicator before going dark

### Requirement 8: Mobile Dashboard Team Owner Experience

**User Story:** As a team owner, I want a frictionless mobile experience with PIN login, real-time squad visibility, and one-thumb bidding, so that I can manage my team effectively on a smartphone.

#### Acceptance Criteria

1. WHEN team owner accesses Mobile_Dashboard on smartphone, THE System SHALL display PIN entry gate before showing any auction data
2. WHEN PIN is entered correctly, THE System SHALL display team dugout view with current squad, remaining budget, and live auction participation interface
3. WHEN bidding is available for current player, THE System SHALL display prominent, large bid button (minimum 60px height) positioned for one-thumb operation at bottom of screen
4. WHEN Mobile_Dashboard is displayed, THE System SHALL show current squad in real time: purchased players with names, roles, base prices, sold prices, and purchase order
5. WHEN a player is purchased by the team, THE System SHALL update squad display within 1 second on the Mobile_Dashboard without requiring refresh
6. WHEN Mobile_Dashboard is viewed on 320px-width screen, THE System SHALL display all critical information (team name, budget, current player, bid button) without requiring horizontal scroll
7. WHEN Mobile_Dashboard is viewed on 600px-width screen or larger, THE System SHALL display two-column or flexible layout with squad list visible alongside current auction info
8. WHEN displaying squad on mobile, THE System SHALL show cards in scrollable vertical list or grid, with essential info (name, role, price) visible at a glance
9. WHEN squad updates occur, THE System SHALL animate card entrance smoothly (150-250ms) to indicate new purchase without jarring layout shift
10. WHEN network connectivity is lost, THE System SHALL display "Connection Lost" message and disable bidding until connection is restored

### Requirement 9: Admin Dashboard Team Management and Statistics

**User Story:** As a tournament administrator, I want comprehensive dashboards showing team status, squad composition, budget tracking, and auction statistics, so that I can monitor and manage the tournament in real time.

#### Acceptance Criteria

1. WHEN admin views Team_Dashboard, THE System SHALL display all 8 teams as Team_Cards in a responsive grid layout
2. WHEN Team_Card is displayed, THE System SHALL show: team name, logo/colors, current squad size (X/7), remaining budget, captain name, and active bidding indicator
3. WHEN a team's budget depletes, THE System SHALL update Budget_Display immediately and disable bidding for that team visually (grayed out or "Budget Exhausted" badge)
4. WHEN admin views Leaderboard, THE System SHALL display teams ranked by: most players purchased, highest spent, lowest remaining budget, with real-time sorting as bids occur
5. WHEN auction progresses, THE System SHALL display Summary_Statistics: total players sold, total unsold, average sell price, price range (min-max), budget utilization percentage per team
6. WHEN admin views Purchase_History, THE System SHALL display chronological log: player name, purchasing team, sell price, timestamp, with filter by team or date range
7. WHEN admin selects a team to inspect, THE System SHALL display Team_Inspection_View with full squad list, budget breakdown, and performance summary
8. WHEN admin inspects a squad, THE System SHALL display cards showing each player's information in detail: serial number, name, role, base price, sold price, seller timestamp

### Requirement 10: Design System and Component Documentation

**User Story:** As a developer, I want a documented design system with reusable components and design tokens, so that the entire interface remains consistent and future changes are straightforward.

#### Acceptance Criteria

1. THE System SHALL define and document all Design_Tokens in a single source file or design token system: colors (hex values, RGB, CSS variables), spacing scale (in px and rem), typography (font stacks, sizes, weights, line-heights), shadows (blur, offset, opacity), border-radius values (in px)
2. WHEN Design_Tokens are referenced, THE System SHALL use them consistently across all components via CSS variables (e.g., `var(--color-primary)`, `var(--spacing-unit)`)
3. WHEN UI components are created, THE System SHALL follow documented patterns: all buttons use standard size/spacing values, all cards use consistent padding and shadows, all text uses defined typography scale
4. WHEN component documentation is created, THE System SHALL include: purpose, props/parameters, usage examples, visual variations (default, hover, active, disabled), accessibility notes
5. THE System SHALL maintain visual consistency: all similar elements use matching colors, spacing, typography; deviations are intentional and documented
6. WHEN Design_System is updated, THE System SHALL track versions and communicate changes to development team

### Requirement 11: Performance Optimization and Responsiveness

**User Story:** As a user, I want the auction system to respond instantly to my actions, so that the experience feels snappy and real-time without lag or delays.

#### Acceptance Criteria

1. WHEN user interacts with Big_Screen_Display, THE System SHALL update within 1 second of state change (new player, new bid, sold announcement)
2. WHEN team owner bids from Mobile_Dashboard, THE System SHALL confirm bid placement within 500ms of button tap
3. WHEN auctioneer selects a player from search, THE System SHALL load and display auction screen within 300ms
4. WHEN Real_Time_Updates occur (bid, player selection, squad update), THE System SHALL not trigger full-page re-render; only affected sections shall update
5. WHEN Big_Screen_Display is running continuously, THE System SHALL not use more than 15% CPU and maintain 60fps animation smoothness
6. WHEN large lists (player search results, squad lists) are rendered, THE System SHALL implement lazy loading or virtualization to display only visible items
7. WHEN image assets (player photos, team logos) load, THE System SHALL display placeholder or skeleton loader before image appears, preventing layout shift
8. WHEN System is idle (no auction activity), THE System SHALL reduce network polling frequency to once per 30 seconds to minimize bandwidth
9. WHEN System handles simultaneous updates (multiple teams bidding concurrently), THE System SHALL process all updates without missing any or showing stale data

### Requirement 12: Accessibility and Inclusive Design

**User Story:** As a user with accessibility needs, I want the auction system to be usable with assistive technologies, so that all participants can engage regardless of ability.

#### Acceptance Criteria

1. THE System SHALL conform to WCAG 2.1 Level AA standards for all interactive components
2. WHEN interface is displayed, THE System SHALL have sufficient color contrast: text/background contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text, ≥ 3:1 for UI components
3. WHEN interactive elements are displayed, THE System SHALL have visible focus indicators (outline, highlight, or background change) for keyboard navigation
4. WHEN form inputs are displayed (search field, PIN entry), THE System SHALL have associated labels or ARIA labels clearly indicating purpose
5. WHEN buttons are displayed, THE System SHALL have descriptive text (not just icons) or ARIA labels indicating action
6. WHEN alerts/error messages appear, THE System SHALL use semantic HTML (`<alert>` role) and announce content to screen readers
7. WHEN animations/auto-playing content exist, THE System SHALL respect `prefers-reduced-motion` preference and provide pause/stop controls
8. WHEN big screen display shows dynamic content, THE System SHALL support screen reader navigation via caption/text overlay alternative
9. WHEN typing is required (PIN, search), THE System SHALL support multiple input methods: physical keyboard, on-screen keyboard, voice input (where applicable)

### Requirement 13: Error Handling and Recovery

**User Story:** As a user, I want clear error messages and recovery options when things go wrong, so that I understand what happened and can take appropriate action.

#### Acceptance Criteria

1. WHEN a network error occurs, THE System SHALL display user-friendly message (not technical error codes) explaining the issue and suggested action
2. WHEN bid placement fails, THE System SHALL display error message explaining reason (insufficient budget, team roster full, network issue) and allow retry or correction
3. WHEN data import fails, THE System SHALL display detailed error report: which records failed, why, and options to fix/retry
4. WHEN search returns no results, THE System SHALL display empty state message: "No players found" and suggest alternative searches
5. WHEN Team_Owner loses connection, THE System SHALL display "Connection Lost" indicator and auto-reconnect with visual feedback ("Reconnecting...") when connectivity is restored
6. WHEN critical system error occurs, THE System SHALL log error details internally and display simple message to user: "Something went wrong. Please refresh the page."
7. WHEN user performs invalid action (e.g., bid below minimum), THE System SHALL explain constraint clearly and suggest valid action

### Requirement 14: Export and Reporting Capabilities

**User Story:** As an administrator, I want to export auction results and statistics in multiple formats, so that I can share data with stakeholders and archive tournament records.

#### Acceptance Criteria

1. WHEN admin triggers export, THE System SHALL generate downloadable file in specified format (CSV, PDF, JSON) with current auction data
2. WHEN CSV export is generated, THE System SHALL include all relevant fields: player name, serial number, base price, sell price, purchasing team, timestamp
3. WHEN PDF export is generated, THE System SHALL display formatted report with team summaries, squad lists, budget breakdowns, and tournament statistics
4. WHEN export is created, THE System SHALL use current team names and identities consistently throughout the document
5. WHEN export includes purchase history, THE System SHALL show chronological order, allow filtering by date/team, and total calculations

---

## Non-Functional Requirements

### Performance Requirements

1. WHEN System is running, THE System SHALL maintain 60fps refresh rate on Big_Screen_Display during active bidding
2. WHEN player is selected, THE Auctioneer_Console SHALL display auction screen within 300ms
3. WHEN bid is placed, THE System SHALL confirm within 500ms and propagate to all displays within 1 second
4. WHEN Mobile_Dashboard loads, THE System SHALL display initial screen within 2 seconds on 4G connection (25 Mbps)
5. WHEN Big_Screen_Display streams realtime data, THE System SHALL use ≤100kB/s bandwidth for typical auction activity

### Availability Requirements

1. WHEN System is running during tournament, THE System SHALL maintain 99% uptime (allow ≤14 minutes downtime per 24 hours)
2. WHEN database connection is lost, THE System SHALL display meaningful error and cache last known state for up to 5 minutes
3. WHEN Realtime synchronization is interrupted, THE System SHALL re-establish connection within 5 seconds with user notification

### Scalability Requirements

1. WHEN System is running with 1000 concurrent viewers (Big_Screen + web streams), THE System SHALL handle load without degradation
2. WHEN 8 teams are bidding simultaneously, THE System SHALL process all bids without data corruption or race conditions
3. WHEN data export occurs, THE System SHALL complete within 10 seconds for full tournament dataset

### Compatibility Requirements

1. THE Big_Screen_Display SHALL be compatible with OBS browser source, displaying correctly with custom chroma-key background
2. THE Mobile_Dashboard SHALL display correctly on iOS Safari and Android Chrome from 2022+ devices
3. THE Admin_Console SHALL work on desktop browsers (Chrome, Firefox, Safari, Edge) with 1920×1080 minimum resolution
4. THE System SHALL be deployable on Vercel, AWS, or similar Node.js hosting platforms

### Browser Support

1. THE System SHALL support: Chrome 120+, Firefox 121+, Safari 17+, Edge 120+
2. THE Mobile_Dashboard SHALL support: iOS Safari 16+, Android Chrome 120+

---

## Data Migration Requirements

### Player Data Import Process

1. WHEN EA data.xlsx is loaded, THE System SHALL parse Excel format and extract columns: Serial_Number, Name, Role, Base_Price, and any metadata
2. WHEN data is parsed, THE System SHALL validate each record: serial number is unique, name is not empty, role is valid, base price is numeric > 0
3. WHEN validation completes, THE System SHALL display summary: "X players imported, Y validation errors, Z duplicates detected"
4. WHEN user confirms import, THE System SHALL insert all valid records into Player table with preserved order (sort by serial number)
5. WHEN import completes, THE System SHALL display success confirmation with total count and first 10 players visible for verification

### Team Data Update Process

1. WHEN team information is updated, THE System SHALL update: team name, captain, team colors, logo URL in Teams table
2. WHEN team data changes, THE System SHALL update all references across database: past bids, current auction state, squad compositions
3. WHEN export/reporting occurs, THE System SHALL show purchases with team names current at time of transaction (historical accuracy)

---

## Real-Time Synchronization Requirements

1. WHEN state changes occur (bid placed, player sold, squad update), THE System SHALL propagate update to all connected displays within 1 second using Supabase Realtime
2. WHEN multiple clients update simultaneously, THE System SHALL use atomic RPC functions (existing place_bid, mark_sold, etc.) to prevent race conditions and data corruption
3. WHEN Realtime connection drops, THE System SHALL auto-reconnect within 5 seconds and re-sync any missed updates
4. WHEN display is offline, THE System SHALL display last known state and "OFFLINE" indicator until connectivity restored

---

## UI/UX Design System Specifications

### Color Palette

1. **Primary Color**: Professional sports accent (likely blue, gold, or brand color) with light/dark variations
2. **Neutral Colors**: Gray scale for backgrounds, text, borders (use at least 5 shades: 50, 200, 400, 600, 900)
3. **Semantic Colors**: Green for success, Red/Orange for error, Yellow for warning, Blue for info
4. **Team Colors**: Each team's unique primary + secondary color used for team cards and bid indicators

### Typography System

1. **Heading Font**: Professional sans-serif (e.g., Inter, Roboto, Poppins) with weights: 600, 700, 800
2. **Body Font**: Readable sans-serif matching heading font, weights: 400, 500, 600
3. **Monospace Font**: For numbers, codes (e.g., Courier New, IBM Plex Mono)
4. **Size Scale**: 12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px, 40px, 48px (each step 1.2x or similar ratio)

### Spacing System (8px baseline)

- 4px: micro spacing (internal icon spacing)
- 8px: minimal spacing (compact lists)
- 12px: small spacing (component internal padding)
- 16px: standard spacing (default padding, gaps)
- 24px: medium spacing (section separation)
- 32px: large spacing (major section separation)
- 48px: extra large spacing (page-level spacing)
- 64px: max spacing (full screen sections)

### Shadow System

- **Subtle**: 0 2px 8px rgba(0, 0, 0, 0.08)
- **Medium**: 0 4px 16px rgba(0, 0, 0, 0.12)
- **Elevation**: 0 8px 24px rgba(0, 0, 0, 0.15)
- **Focus**: 0 0 0 3px rgba(primary, 0.2) (focus ring for keyboard nav)

### Border Radius System

- 4px: tight (small components, inputs)
- 6px: subtle (cards, moderate components)
- 8px: standard (main cards, modals)
- 12px: rounded (larger containers)
- 24px+: fully rounded (pills, circular elements)

---

## Data Model / Glossary Reference

The System maintains these core entities:

- **Player**: serial_number, name, role, base_price, status (sold/unsold), purchased_by_team, sold_price, timestamp
- **Team**: name, captain, budget, remaining_budget, roster_count (0-7), colors, logo_url, purchased_players (relationship)
- **Auction_State**: current_player_id, current_bid, highest_bidder_team_id, timer_seconds, auction_status
- **Bid_History**: timestamp, player_id, bid_amount, team_id, status (placed/accepted/rejected)

---

## Success Criteria and Completion Definition

The upgrade is complete and successful when:

1. ✅ All players from EA data.xlsx are imported accurately with zero data loss
2. ✅ Auctioneer can search, select, and load any player within 300ms using keyboard or mouse
3. ✅ All 8 teams display with new names/identities consistently across all screens
4. ✅ UI transforms from generic to premium sports design with professional color palette, typography, spacing, and micro-interactions
5. ✅ Squad visibility is real-time: players appear in team cards instantly upon purchase without page refresh
6. ✅ Big screen scales to 4K without text distortion, animations maintain 60fps, and bids animate smoothly
7. ✅ Mobile dashboard works on 320px screens with one-thumb bidding and real-time squad updates
8. ✅ System performs: player selection <300ms, bid placement <500ms, real-time sync <1 second
9. ✅ All screens remain responsive: mobile (320-768px), desktop (1920px), 4K (3840px)
10. ✅ System feels like production-grade live sports software ready for real tournaments

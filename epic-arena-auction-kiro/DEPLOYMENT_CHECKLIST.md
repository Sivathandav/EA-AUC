# Cricket Auction Application - Deployment Checklist

## Pre-Deployment Verification

### 1. Environment & Dependencies ✅

- [ ] Node.js 18+ installed: `node --version`
- [ ] npm packages installed: `npm install`
- [ ] xlsx library installed: `npm list xlsx` (or `npm install xlsx`)
- [ ] Git repository initialized and clean: `git status`
- [ ] Environment variables configured in `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```

### 2. Database Setup ✅

- [ ] Supabase project created
- [ ] Replication enabled (Database → Replication)
- [ ] Run migrations in Supabase SQL Editor (in order):
  1. `supabase/schema.sql` - Core tables
  2. `supabase/rpc_functions.sql` - Atomic operations
  3. `supabase/migration_add_serial_number.sql` - Add new fields
  4. `supabase/seed_new_teams.sql` - Seed 8 teams
  5. `supabase/seed.sql` - Seed demo data (if needed)
- [ ] Verify tables created: teams, players, auction_state, bid_history
- [ ] Verify indexes created on serial_number, queue_order
- [ ] Confirm Realtime enabled on all tables
- [ ] Test RPC functions: verify_team_pin, place_bid, mark_sold, mark_unsold, undo_last_action

### 3. Code Quality ✅

- [ ] No TypeScript/ESLint errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No console warnings in production build
- [ ] All imports resolved correctly
- [ ] CSS variables applied without errors
- [ ] Design tokens exported properly
- [ ] PlayerSearch component mounts without errors
- [ ] SquadCard/SquadList render correctly
- [ ] ResponsiveText scales fluid typography

### 4. Feature Verification ✅

#### Admin Console (/admin)
- [ ] Login with admin PIN works
- [ ] PlayerSearch displays and filters correctly
- [ ] Autocomplete shows up to 10 results
- [ ] Keyboard navigation (Up/Down/Enter/Escape) works
- [ ] Keyboard shortcuts functional: Space (timer), 1-8 (bid), S (sold), U (unsold), Z (undo)
- [ ] "Next Player" button removed (replaced with PlayerSearch)
- [ ] Team bid buttons functional
- [ ] SOLD/UNSOLD/UNDO buttons work
- [ ] Toast notifications display correctly

#### Big Screen Display (/big-screen)
- [ ] Responsive at 1920×1080, 2560×1440, 3840×2160
- [ ] Current player card displays
- [ ] Bid ticker animates smoothly (LED effect)
- [ ] Team color highlights correctly
- [ ] Squad list shows purchased players in real-time
- [ ] Chroma-key mode (green screen) works on click
- [ ] OFFLINE indicator appears/disappears with connection
- [ ] Sold Hammer animation triggers on SOLD
- [ ] No layout shifts on content updates

#### Owner Dashboard (/owner)
- [ ] Mobile responsive at 320px, 375px, 600px, 768px
- [ ] PIN gate works (1111-8888)
- [ ] Squad displays in real-time
- [ ] One-thumb bidding button at bottom (60px+ height)
- [ ] Bid confirmation within 500ms
- [ ] Budget display updates correctly
- [ ] Roster full indicator shows at 7/7
- [ ] "OFFLINE" message appears when disconnected
- [ ] Touch-friendly button sizes (≥44px × 44px)

#### Manage Page (/admin/manage)
- [ ] Team and player management accessible
- [ ] Admin PIN gate works
- [ ] Forms functional and validated
- [ ] Changes persist to database

### 5. Real-Time Synchronization ✅

- [ ] Open all three screens simultaneously (admin, big-screen, owner)
- [ ] Place bid from admin console
- [ ] Verify updates appear on all screens within 1 second
- [ ] Squad list updates immediately on purchase
- [ ] Undo action reverts player from squad instantly
- [ ] No duplicate updates or race conditions
- [ ] Offline simulation: disconnect network
  - [ ] "OFFLINE" indicator appears
  - [ ] Last known state displayed
  - [ ] No error crashes
  - [ ] Reconnects automatically within 5 seconds

### 6. Player Import ✅

- [ ] Excel file parsing works
- [ ] Duplicate detection functions
- [ ] Validation error reporting clear
- [ ] Serial number sequence preserved
- [ ] Queue order assigned correctly
- [ ] All 48 players import without data loss
- [ ] Players appear in search immediately after import
- [ ] No null or undefined fields

### 7. Design System ✅

- [ ] CSS variables applied across all components
- [ ] Colors consistent with design tokens
- [ ] Typography scales fluidly (320px → 3840px)
- [ ] Spacing consistent (8px baseline)
- [ ] Border radius applied uniformly
- [ ] Shadows render correctly
- [ ] Hover/focus states visible
- [ ] Animations smooth (200-600ms durations)
- [ ] Empty states display correctly
- [ ] Error messages formatted consistently

### 8. Accessibility ✅

- [ ] Color contrast ≥4.5:1 for normal text
- [ ] Focus indicators visible on all interactive elements
- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter, Escape)
- [ ] ARIA labels on buttons and inputs
- [ ] Screen reader announces form fields
- [ ] Prefers-reduced-motion respected (animations disabled)
- [ ] No keyboard traps
- [ ] Form inputs have associated labels
- [ ] Error messages announced to screen readers

### 9. Performance ✅

- [ ] Player search <300ms response
- [ ] Bid placement <500ms confirmation
- [ ] Page load <2 seconds on 4G
- [ ] Real-time sync <1 second
- [ ] Big Screen maintains 60fps during active bidding
- [ ] No memory leaks (DevTools memory tab)
- [ ] Lighthouse score ≥80
- [ ] Core Web Vitals green:
  - [ ] LCP (Largest Contentful Paint) <2.5s
  - [ ] FID (First Input Delay) <100ms
  - [ ] CLS (Cumulative Layout Shift) <0.1

### 10. Browser Compatibility ✅

Test on actual browsers (not just emulation):
- [ ] Chrome 120+
- [ ] Firefox 121+
- [ ] Safari 17+ (macOS)
- [ ] Safari iOS 16+ (iPad/iPhone)
- [ ] Edge 120+
- [ ] Samsung Internet (Android)

### 11. Mobile Device Testing ✅

Test on actual devices:
- [ ] iPhone 12/13/14/15 (320px+)
- [ ] Android device (375px, 600px widths)
- [ ] Tablet (iPad, Samsung Tab)
- [ ] One-thumb bidding works on all devices
- [ ] Touch responsiveness (<200ms)
- [ ] Orientation changes handled (portrait/landscape)
- [ ] Soft keyboard doesn't hide critical buttons

### 12. Network & Security ✅

- [ ] HTTPS enforced (Vercel default)
- [ ] Supabase RLS policies active
- [ ] Admin PIN required for sensitive operations
- [ ] Team PIN gated (4-digit auth)
- [ ] No sensitive data in client-side code
- [ ] CORS headers configured
- [ ] API rate limiting configured (if needed)
- [ ] Audit trail logged (bid_history table)

---

## Deployment Steps

### Step 1: Final Build & Test
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Run linter
npm run lint

# Build for production
npm run build

# Test locally
npm run start
```

### Step 2: Verify Supabase Configuration
```bash
# In Supabase dashboard:
# 1. Check project URL and anon key
# 2. Verify Realtime enabled (Database → Replication)
# 3. Run all migration scripts
# 4. Test RPC functions
# 5. Seed teams data
```

### Step 3: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Step 4: Post-Deployment Verification
```bash
# Visit deployed URLs:
# - https://your-app.vercel.app/ (home)
# - https://your-app.vercel.app/admin (admin console)
# - https://your-app.vercel.app/big-screen (big screen)
# - https://your-app.vercel.app/owner (owner dashboard)

# Test all features on production:
# 1. Login with admin PIN
# 2. Search for player
# 3. Place bid
# 4. Verify squad updates
# 5. Check big screen syncs
# 6. Test owner dashboard on mobile
```

---

## Rollback Plan

If issues occur post-deployment:

```bash
# Rollback to previous version
vercel rollback

# Or redeploy specific commit
vercel deploy --with-code git-commit-hash

# Verify previous version restored
# Test all critical features
# Monitor error logs for issues
```

---

## Tournament Day Preparation

### 2 Hours Before

- [ ] Test all three screens on venue equipment
- [ ] Verify Excel player file is correct (48 players)
- [ ] Import all players into database
- [ ] Confirm all team PINs work (1111-8888)
- [ ] Test Big Screen on projector/OBS
- [ ] Provide owner phone links to team captains
- [ ] Run through full auction simulation
- [ ] Set admin PIN securely
- [ ] Backup database (Supabase automatic)

### 1 Hour Before

- [ ] Confirm all three screens running
- [ ] Test microphone/speaker integration if any
- [ ] Verify internet connection stable
- [ ] Check Admin Console keyboard shortcuts
- [ ] Practice bidding workflow
- [ ] Have troubleshooting guide ready
- [ ] Assign tech support roles

### During Event

- [ ] Monitor error logs (Vercel Analytics)
- [ ] Keep backup laptop with offline data
- [ ] Have auctioneer cheat sheet for keyboard shortcuts
- [ ] Document any issues for post-event review
- [ ] Verify squad updates happening in real-time
- [ ] Monitor network latency

### Post-Event

- [ ] Export final results
- [ ] Archive bid history
- [ ] Collect feedback from users
- [ ] Review error logs
- [ ] Plan follow-up improvements

---

## Success Criteria

✅ **All Critical Features Working:**
- [ ] Player search <300ms
- [ ] Real-time squad sync <1s
- [ ] Big Screen 60fps
- [ ] Mobile responsive 320-768px
- [ ] All keyboard shortcuts functional

✅ **No Critical Errors:**
- [ ] Zero crashes on any screen
- [ ] No data corruption
- [ ] No loss of bids
- [ ] No duplicate players

✅ **Deployment Confidence:**
- [ ] All tests passing
- [ ] Lighthouse score ≥80
- [ ] Zero console errors
- [ ] WCAG 2.1 AA compliant

---

## Support Contacts

- **Technical Issues:** Check TROUBLESHOOTING_GUIDE.md
- **Database Issues:** Supabase support dashboard
- **Deployment Issues:** Vercel dashboard
- **Performance Issues:** Vercel Analytics, Chrome DevTools

---

**Deployment Status:** Ready for production  
**Last Updated:** July 30, 2026  
**Version:** 1.0.0


# Changelog — CALICO PRO Configurator

All notable changes to the Cavitak tvONE CALICO PRO Configurator web application.
Built for Cavitak Marketing Pvt Ltd · National Product Manager: Dipenkumar Gajjar.

Versions follow semantic-ish conventions: MAJOR.MINOR[.PATCH].
Frontend and Apps Script backend are versioned independently when they diverge.

---

## [v25.7] — 2026-04-20 · Directory, Review, Dashboard personalization

### Major additions

**Directory tab** (replaces Customers tab)
- Unified 3-segment switcher at the top: Customers · Partners/SI · Consultants
- Live count badges on each segment
- Customers segment — full CRUD (from existing master list)
- Partners/SI segment — auto-derived from deal log (name, cities, deal count, unique end-clients, total value, last deal date)
- Consultants segment — auto-derived from deal log (same schema)
- Search box + industry filter auto-adapt to active segment
- Industry filter hidden for Partners/Consultants (not meaningful)
- Add button only shown for Customers (Partners/Consultants come from deals, not manual entry)

**Review tab** (replaces 1:1 Briefing tab)
- Unified 3-segment switcher: Quarterly Review · Annual Review · 1:1 Briefing (Super only)
- Quarterly Review panel:
  - Indian FY quarter selector (current + last 7 quarters)
  - 4 inline metric cards with YoY growth badges (Total Deals · Pipeline Value · Won · Partners)
  - OEM vs Cavitak split card (side-by-side with % + deal count + value)
  - Ecosystem Breadth card (unique partners, consultants, end-clients with YoY)
  - "Email Report" button (sends the full quarterly email)
  - "Export CSV" button (downloads all deals in the quarter)
- Annual Review panel:
  - Indian FY year selector (current + last 4 years)
  - 4 inline metric cards with YoY growth badges
  - Quarter-wise breakdown table (all 4 quarters with deals/pipeline/won/win%)
  - Email + CSV export buttons
- 1:1 Briefing sub-tab preserves existing briefing functionality (Super only)

**Dashboard scoping change**
- Dashboard now shows ONLY the current user's own deals, regardless of role (Super, OEM, etc.)
- Title updated to "Your Dashboard" / subtitle mentions team-wide analytics live on Review tab
- History tab still follows role-based scoping (Super + OEM see all, others see own)
- Review + Directory use new `_rawCentralLog` internal array that holds full unscoped data

**Info tab removed**
- Profile access moved to header: click your username to open Profile page
- Tooltip added to hint at this
- Reduces header clutter, matches common SaaS pattern

### Fixes

- **Close month dropdown was silently empty** — HTML had a `<!-- Populated dynamically on load -->` comment but no code ever populated it. Added `populateCloseMonths_()` that generates the next 18 months starting from current month. Called from `initScreens()`.
- **Login page theme pill looked broken/cut-off** — button used old `.theme-toggle` CSS class which was deleted when theme pill was unified. Rebuilt with dedicated `.theme-pill-login` CSS: 1.5px gold border, dark backdrop with blur, fixed positioning, proper light-mode variant.
- **formView was not hidden by default** — causing pages to appear transparent with the initial form bleeding through. Added `class="hidden"` to match all other views; login flow explicitly reveals it.

### Files in release
- `index.html` (frontend — 476 KB)
- `apps-script-backend.gs` (backend — 108 KB, unchanged from v25.6)

---

## [v25.6.2] — 2026-04-20 · Professional audit fixes

### Added
- **Global error handlers** (`window.onerror` + `unhandledrejection`) — every uncaught JS error now logs to console with `[GLOBAL ERROR]` / `[UNHANDLED PROMISE]` prefix + stack trace. Filters ResizeObserver noise and cross-origin script errors.
- **Customer Delete button** (Super only) — removes from master list with full-warning confirmation; existing deals that reference the name stay intact but lose the enrichment. Uses backend `customer_delete` endpoint that existed for months but was never wired to UI.

### Audit findings (documented but not all fixed)
- 7 dead legacy-shim functions identified — left alone for backward compat
- Backend `bootstrap` handler exists but never called from frontend
- 5 `no-cors` fetches can't verify server response (acceptable for theme + profile saves)
- 3 `aria-label`, 0 `role` attributes — accessibility gap flagged for future
- 38 `required` attrs but 0 `pattern` attrs — form validation gap flagged
- 25 infinite CSS animations — minor perf concern

---

## [v25.6.1] — 2026-04-20 · Table trimmed to 5 columns

### Changed
- Desktop + mobile history table reduced from 14-16 columns to **5 columns everywhere**
- New column set: Project · Stage · End-user · Partner/SI · Edit
- Removed columns (accessible via row-tap detail modal): Time, User, Consultant, Location, Chassis, Screens, M Pixels, HDMI, SDI, Inputs, Deal Value
- Removed `min-width: 780px` that was forcing horizontal scroll on mobile
- Added `table-layout: fixed` to prevent column width jumps
- Project name now bold in gold for visual hierarchy
- Edit button always visible (was off-screen in column 16 on mobile before)

### Rationale
- Mobile table was 780px wide on 375px phone screen → users had to scroll horizontally
- This caused visual "misalignment" perception when different rows had different scroll positions
- Detail modal still shows all 40+ fields — zero data loss, just cleaner overview list

---

## [v25.6] — 2026-04-19 · BrightSign parity port

### Added (ported from BrightSign v24.2)
- **Forgot Password flow** — modal on login page, `ResetRequests` sheet auto-created, Super sees pulsing red badge on Team tab with pending count, approve/deny flow with auto-notification + resolved requests history section
- **Branded login splash** — 2-second progress bar (Signing in → Loading workspace → Preparing your deals → Finishing up → Ready), gold + emerald gradient
- **Duplicate project warning** — fuzzy match against existing deals, shows warning banner with "Open existing entry" link that jumps to History with the matching deal loaded for edit
- **Relative lastLogin timestamps** — Team tab shows "2h ago", "yesterday", "3 days ago" instead of raw ISO timestamps via `formatRelativeTime_()`
- **Stay-signed-in countdown** — session warning banner at 9min with live 60-second countdown and "Stay signed in" button that extends to full 10 minutes
- **Two-logo CSS specificity fix** — dark/light theme logos swapping with `!important` on `.logo-dark` / `.logo-light`
- **Bulletproof Edit rewrite** — async with multi-layer fallback (fast path centralLog → slow path server refresh → clear alert if all fail), `[Edit] ▶ CLICKED` console diagnostics prefix
- **Fresh-entry Edit fix** — `centralLog.unshift(submission)` after new deal registration + `centralLog[idx] = submission` after edit save, so Edit works on deals logged in the same session without waiting for refresh

### Sanitization pass (product-language rewrite)
- Removed all mechanism-revealing language from user-facing text
- "submissions" → "deals" everywhere user sees it
- "Backend" → "Status" / "All systems operational"
- "Syncing" → "Preparing" / "Finalizing"
- "Network error" → "Connection issue — please try again"
- "Google Sheet" references stripped
- CSV filename: `calico-submissions-*.csv` → `calico-deals-*.csv`
- Save flow toasts: "Saving…" → "Preparing recommendation…"; "Saved" → "Deal registered"
- Edit flow: "Submission updated" → "Deal updated"; audit modal "Fetching…" → "Loading…"

---

## [v25.6 — unified theme pill] — 2026-04-19

### Changed
- Consolidated separate Dark/Light button + Auto scheduler pill into ONE unified pill with dropdown menu
- Pill adapts appearance to mode: 🌙 Dark / ☀️ Light / 🕐 Auto (with emerald pulse dot)
- Dropdown menu with 3 options: Dark · Light · divider · Auto (7AM–7PM)
- Chevron rotates 180° when open, slide animation on reveal
- Outside-click closes menu
- Mobile: icon-only display, dropdown still full-size
- Legacy `toggleTheme()` kept as shim for backward compat
- Storage migration: old `calicoThemeAuto=true` flag auto-promotes to `calicoThemeMode=auto`

---

## [v25.5] — 2026-04-19 · Mobile responsive layer

### Added
- Full mobile CSS breakpoint at `max-width: 640px`
- Single-column layout for form fields on mobile
- Full-screen modals on mobile (no padding around edge)
- Collapsed header elements on mobile (icons only)
- Touch-sized buttons (min-height 36px)
- Notification bell panel → bottom sheet on mobile
- Horizontal scroll on filter bars instead of wrap
- Tighter card padding + smaller font sizes on small screens

---

## [v25.4] — 2026-04-18 · Phase C security hardening

### Added
- **Salted password hashes** — new `salt` column in Users sheet, SHA-256(salt + password) stored instead of plain SHA-256(password). Reset password regenerates salt. Migration function preserves existing users.
- **Rate limiting on login** — new `LoginAttempts` sheet tracks attempts per username + IP. After 5 failed attempts in 10 minutes, account is locked for 15 minutes. Auto-created, capped at 1000 rows.
- **Server-side data scoping** — `getlog` action now re-validates caller's role server-side and filters rows before returning. Prevents tampered client from requesting full team data.
- **AuditLog tab** — all edits automatically logged with (timestamp, user, refId, field, oldValue, newValue). 7-column schema. Auto-created. Viewable via Edit History modal.

---

## [v25.3] — 2026-04-18 · Deal value + weekly digest + theme sync

### Added
- **Deal value field (INR)** — required field on submission form with live-formatted display (₹1.2 L, ₹3.5 Cr). Stored in `dealValueINR` column.
- **Pipeline value strip** — new strip on Dashboard showing Total Pipeline · Won Value · Open Pipeline with INR formatting
- **Weekly digest email** — sent every Monday 8 AM IST by `sendWeeklyDigest()` trigger. Per-user summary of their deals last week.
- **Theme preference server persistence** — Dark/Light preference stored in `themePreference` column on Users sheet, auto-applied on login across devices (non-Auto only; Auto stays device-local)

---

## [v25.2] — 2026-04-18 · Data integrity

### Added
- **Fuzzy duplicate detection** — Levenshtein-based matching on project name + end-user when logging new deal, shows warning with link to existing match
- **Full CSV export** — 67-column dump matching Submissions sheet schema exactly, for pivot-table analysis
- **Edit audit log** — every field change logged to AuditLog sheet with before/after values, viewable from detail modal

---

## [v25.1] — 2026-04-18 · UX polish + edit

### Added
- **Personal stats strip** — on Dashboard for non-privileged users, shows their own Total Deals · Won · Pipeline · This Month counts
- **Detail modal on row tap** — History rows are now clickable, opens full deal details in a modal
- **Bulk actions bar** — checkboxes in History with "Apply stage to selected" action for Super users
- **Keyboard shortcuts** — Esc closes modals, Enter submits forms, / focuses search

---

## [v25.0] — 2026-04-18 · BrightSign feature port base

### Added (initial port from BrightSign Selector)
- Password salting + rate limiting (refined in v25.4)
- History search (broad match across 11 fields)
- Weekly digest scaffolding (completed in v25.3)
- Notification bell with per-user localStorage (max 50 items)
- Customers master list with CRUD + Super merge function
- 1:1 Briefing view (Super only)
- Quarterly + Annual review emails scheduled via `setupReviewTriggers()`
- Nightly backup to hidden `Backup_YYYY-MM-DD` tabs with 30-day rolling window (`setupNightlyBackupTrigger()`)
- `dealSource` auto-classification (OEM role user = `OEM-referred`, others = `Cavitak-sourced`)

---

## [v24.4] — 2026-04-19 · Dark cinematic theme overhaul

### Changed
- Full color palette rebuild — dark green (`#1B4332`) + gold (`#D4AF37`) + emerald accent
- Typography: Manrope (sans) + Fraunces (serif display) + JetBrains Mono (code)
- Premium glass-morph cards with backdrop-filter blur
- Gradient mesh page backdrop
- Noise texture overlay (3.5% opacity, mix-blend-mode: overlay)

---

## [v24.3] — 2026-04-18 · UI refinements base (pre-v25)

### Added
- Dark mode auto scheduler (`🕐 Auto` pill) — theme follows local clock, light 7 AM–7 PM, dark otherwise
- 5-minute recheck interval to handle transition boundaries
- Toast notifications via `showSync()`

---

## [v22–v23] — Pre-April 2026 · Foundation

### Core functionality
- Recommendation engine scoring chassis options against form inputs
- Product catalog (CORIOmaster, CORIOgrafx line)
- Form fields: project context, deployment environment, LED screens, inputs, I/O needs, budget
- Result page with model hero, pills, deployment notes, alternatives
- 13-user login system with `cavitak@123` default + super for Dipenkumar
- `CAL-xxxxxxxx` ref ID generation
- Real-time logging to Google Sheet via Apps Script webhook
- localStorage fallback when offline
- Export to Excel (quotation, tender, summary sheets)

---

## Backend — Apps Script versions

### apps-script-backend.gs v25 (current)
- 67-column Submissions schema
- Upsert-by-refId logic
- 6 auto-created tabs: Submissions · Users · AuditLog · LoginAttempts · ResetRequests · Customers
- Scheduled triggers: `maybeQuarterEnd_` (28th monthly), `maybeYearEnd_` (Dec 30-31), `runNightlyBackup` (daily 2 AM IST)
- Salted password hashes + login rate limiting
- Server-side role scoping
- Customer CRUD + merge + delete
- Review email generation (quarterly HTML + annual HTML with YoY/QoQ/ecosystem metrics)

---

## Deployment conventions

- **Frontend**: Single-file HTML (~475 KB) with embedded CSS, JS, inline SVG
- **Hosting**: GitHub Pages at `https://dgcavitak-rgb.github.io/calico-configurator/`
- **Backend**: Google Apps Script webhook at fixed deployment URL (baked into HTML)
- **Storage**: Google Sheet (central) + browser `localStorage` (offline queue, per-user notifications, theme pref)
- **Libraries**: ExcelJS 4.3 via CDN, Chart.js (if used) via CDN
- **No framework**: Pure vanilla JS — no React, no build step

### Deploy checklist
1. Update Apps Script → Save → Deploy → Manage → New version → Deploy
2. Run one-time functions from editor (grant permissions first run):
   - `setupReviewTriggers` — schedules quarterly + yearly review emails
   - `setupNightlyBackupTrigger` — schedules 2 AM IST daily backup
3. Verify in Triggers panel: `maybeQuarterEnd_`, `maybeYearEnd_`, `runNightlyBackup`
4. Replace `index.html` on GitHub → commit → push
5. Wait ~60s for GitHub Pages propagation
6. Hard refresh (Ctrl+Shift+R) on all test devices

---

## Known pending items

### Must-haves
- **#3 Revision tracking** — max 3 versions per submission, tracked by `revision` field + prior-version preservation. Open questions: block after v3 vs overwrite, same refId vs new refId per version.

### Nice-to-haves
- PDF quote export alongside Excel
- Stale deal reminders (auto-ping after N days without update)
- Lost deal reason codes
- Pitch deck PPT generator
- WhatsApp share (text vs tokenized link — decision pending)
- Tender document upload (informational, doesn't drive form)
- Calendar integration
- Zoho CRM sync (long-term)
- Error monitoring service integration
- Submission-level rate limiting
- Form field validation patterns (email/phone client-side format check)
- Accessibility pass (aria-labels + roles for screen readers)

### Deferred
- Service account migration (long-term, keeps backend portable)
- Terms/Privacy pages
- Bootstrap endpoint wiring for first-boot Users tab seeding

### Parity port (reverse direction — Calico → BrightSign)
- Phase A: UX polish layer
- Phase B: Data integrity layer (fuzzy dupe, audit log, full CSV)
- Phase C: Security (salted hashes, rate limiting, server scoping)
- Mobile responsive layer
- Customers master list
- 1:1 Briefing view
- Review emails (quarterly + annual)
- Nightly backup
- Confirm v24.2.7 auth fix present

---

## Architecture notes

- **Frontend**: Single-file HTML (~475 KB, ~10K lines) with embedded CSS + JS
- **Hosting**: GitHub Pages (free, always-on, global CDN)
- **Backend**: Google Apps Script Webhook (free tier, serverless)
- **Storage**: Google Sheet (6 tabs) + browser localStorage (per-user notifications, offline queue, theme pref)
- **Auth**: SHA-256 salted hashes, server-verified, session-token stored in memory only
- **Deploy speed**: < 2 minutes end-to-end (Apps Script save + GitHub push + CDN propagation)
- **No runtime dependencies on paid services** — entire stack runs on Google's free tier

---

*Maintained by: Dipenkumar Gajjar · National Product Manager · Cavitak Marketing Pvt Ltd*
*Last updated: 2026-04-20 · v25.7*

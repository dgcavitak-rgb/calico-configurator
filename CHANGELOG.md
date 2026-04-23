# Changelog — CALICO PRO Configurator

All notable changes to the Cavitak tvONE CALICO PRO Configurator web application.
Built for Cavitak Marketing Pvt Ltd · National Product Manager: Dipenkumar Gajjar.

Versions follow semantic-ish conventions: MAJOR.MINOR[.PATCH].
Frontend and Apps Script backend are versioned independently when they diverge.

---

## [v25.8] — 2026-04-23 · BrightSign-style header redesign + popover stability

### Changed — Header completely rebuilt
- **2-row clean layout** inspired by BrightSign Selector's header
- **Row 1 (top):** Brand (left) · User name + role pill · 3-icon theme switcher · 🔔 bell · DG initials avatar · Status chip · Sign out
- **Row 2:** Flat nav tabs with gold underline on active tab (no borders, no competing button styles)
- **Removed:** 4-group layout with red vertical separators, boxy nav buttons, big "🌙 Dark ▾" dropdown pill
- Subtle border between header rows instead of red separator lines
- Tab icons (＋ ◷ ▦ ◉ ◈ ◎) paired with labels for visual scanning

### Added — Theme switcher trio
- 3 circular icon buttons in one pill: 🌙 (Dark) · ☀️ (Light) · 🕐 (Auto 7AM–7PM)
- Click any icon → instant theme set, no dropdown needed
- Active mode highlighted with gold circle glow
- Legacy `themePill` + dropdown menu code kept for backward compat (hidden)

### Added — User avatar
- 36px initials circle next to user name (e.g. "Dipenkumar Gajjar" → "DG")
- `_initialsFor(name)` helper — last-word + first-word initials
- Click avatar OR name → opens Profile page

### Added — Active tab highlighting
- `updateActiveNavTab_(view)` called from `showView()` — maps each view to its tab
- Gold underline + glow moves as user navigates
- Also updates theme-icon active state when mode changes

### Added — Sign out button
- Replaces red "Exit" button with subtle grey outline "Sign out"
- Red color appears only on hover (less aggressive)

### Fixed — Theme menu + Notification panel bleed-through
- Both popovers were rendering semi-transparent with page content visible through them
- **Root cause:** `.app-header` has `backdrop-filter: blur(24px)` which creates a stacking context AND filter boundary that clips child absolutely-positioned popovers
- **Fix:** On first open, popovers are reparented to `document.body` via `appendChild()` — escapes the header's stacking context entirely
- Position calculated via `getBoundingClientRect()` on trigger element (pill or bell) with viewport-edge clamping
- Both now use `position: fixed` + opaque backgrounds + `z-index: 99999`
- Auto-close on scroll + window resize
- Applied identical pattern to theme dropdown AND notification panel

### Fixed — Directory + Review pages showed empty
- Duplicate `<div id="customersView">` in HTML — browser picked the outer (empty) wrapper when showing the view
- Root cause: earlier `str_replace` replaced inner content but didn't remove the old outer wrapper
- Fixed by deduplicating the HTML structure
- Added ID uniqueness validation to pre-deploy checks

### Fixed — Login page theme pill invisible
- Used old `.theme-toggle` CSS class that was deleted when theme pill was unified
- Rebuilt with dedicated `.theme-pill-login`: 1.5px gold border, dark backdrop with blur, fixed positioning
- Light-mode variant uses cream background + bronze border

### Added — Two proper theme-specific logos
- `tvone-logo-dark.png` — colored arrows + WHITE "tvONE" text (for dark theme)
- `tvone-logo-light.png` — colored arrows + DARK "tvONE" text (for light theme)
- Both 690×362 px, transparent backgrounds
- Generated programmatically from dark source via PIL color replacement
- CSS auto-swap via `[data-theme="light"]` selector

### Fixed — formView transparent bleed-through
- `formView` was visible by default, causing other views to appear overlaid
- Added `class="hidden"` to match all other views
- Login flow explicitly reveals it

### Added — 10-digit phone enforcement confirmed
- Verified all 3 phone fields (profile, customer, team user) have:
  - `maxlength="10"` + `pattern="[0-9]{10}"` + `inputmode="numeric"`
  - Live-filter: `oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)"`
  - Server + client validation on save

### Fixed — Close month dropdown was empty
- HTML had `<!-- Populated dynamically on load -->` comment but no code ever populated
- Added `populateCloseMonths_()` — generates next 18 months from current
- Called from `initScreens()` on every form load

### Confirmed — Password reset flow works
- Super clicks 🔑 Reset → backend sets hash = SHA256(`cavitak@123` + new salt) + `mustChange=TRUE`
- User logs in with `cavitak@123` → frontend detects `mustChange` → forces password change modal
- Approved forgot-password requests follow same flow

### Files in release
- `index.html` (frontend — 487 KB)
- `apps-script-backend.gs` (unchanged from v25.6 — 108 KB)
- `tvone-logo-dark.png` (new — 32 KB)
- `tvone-logo-light.png` (new — 29 KB)
- `CHANGELOG.md` (this file)

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

---

## [v25.6.2] — 2026-04-20 · Professional audit fixes

### Added
- **Global error handlers** (`window.onerror` + `unhandledrejection`) — every uncaught JS error now logs to console with `[GLOBAL ERROR]` / `[UNHANDLED PROMISE]` prefix + stack trace
- **Customer Delete button** (Super only) — removes from master list with full-warning confirmation; existing deals that reference the name stay intact

---

## [v25.6.1] — 2026-04-20 · Table trimmed to 5 columns

### Changed
- Desktop + mobile history table reduced from 14-16 columns to **5 columns everywhere**
- New column set: Project · Stage · End-user · Partner/SI · Edit
- Removed columns accessible via row-tap detail modal
- Removed `min-width: 780px` that was forcing horizontal scroll on mobile

---

## [v25.6] — 2026-04-19 · BrightSign parity port

### Added (ported from BrightSign v24.2)
- Forgot Password flow (modal + ResetRequests sheet + Super approve/deny)
- Branded login splash with progress bar
- Duplicate project warning with jump-to-edit
- Relative lastLogin timestamps ("2h ago", "yesterday")
- Stay-signed-in countdown banner
- Bulletproof Edit flow with multi-layer fallback

### Sanitization pass
- Removed all mechanism-revealing language from user-facing text
- "submissions" → "deals" everywhere user sees it
- "Backend" → "Status" / "All systems operational"
- "Syncing" → "Preparing" / "Finalizing"
- "Network error" → "Connection issue — please try again"
- "Google Sheet" references stripped

---

## [v25.5] — 2026-04-19 · Mobile responsive layer

- Full mobile CSS breakpoint at `max-width: 640px`
- Single-column layout for form fields on mobile
- Full-screen modals on mobile
- Touch-sized buttons (min-height 36px)

---

## [v25.4] — 2026-04-18 · Phase C security hardening

- Salted password hashes (per-user random salt)
- Rate limiting on login (5 failures in 10 min → 15 min lockout)
- Server-side data scoping (backend re-validates role)
- AuditLog tab for all edit history

---

## [v25.3] — 2026-04-18 · Deal value + weekly digest + theme sync

- Deal value field (INR) with live formatting (₹L / ₹Cr)
- Pipeline value strip on Dashboard
- Weekly digest email (Mondays 8 AM IST)
- Theme preference server-persisted across devices

---

## [v25.2] — 2026-04-18 · Data integrity

- Fuzzy duplicate detection (Levenshtein on project + end-user)
- Full CSV export (67-column dump)
- Edit audit log with before/after values

---

## [v25.1] — 2026-04-18 · UX polish

- Personal stats strip on Dashboard for non-privileged users
- Detail modal on row tap
- Bulk actions bar with stage-apply for Super
- Keyboard shortcuts (Esc / Enter / /)

---

## [v25.0] — 2026-04-18 · BrightSign feature port base

- Password salting + rate limiting
- History search (broad match)
- Notification bell with per-user localStorage
- Customers master list with CRUD + Super merge
- 1:1 Briefing view
- Quarterly + Annual review emails
- Nightly backup to hidden `Backup_YYYY-MM-DD` tabs
- `dealSource` auto-classification (OEM vs Cavitak)

---

## [v24.4] — 2026-04-19 · Dark cinematic theme overhaul

- Dark green (`#1B4332`) + gold (`#D4AF37`) + emerald palette
- Manrope + Fraunces + JetBrains Mono typography
- Glass-morph cards with backdrop-filter blur

---

## [v24.3] — 2026-04-18 · Auto theme scheduler

- Dark mode auto pill → theme follows local clock (light 7 AM–7 PM)
- 5-minute recheck interval

---

## [v22–v23] — Pre-April 2026 · Foundation

- Recommendation engine + CORIOmaster / CORIOgrafx catalog
- Form fields for project context, deployment, LED screens, I/O, budget
- 13-user login with `cavitak@123` default + super for Dipenkumar
- Real-time Google Sheet logging via Apps Script webhook
- localStorage offline fallback
- Excel export (quotation, tender, summary)

---

## Backend — Apps Script versions

### apps-script-backend.gs v25 (current, unchanged since v25.6)
- 67-column Submissions schema
- Upsert-by-refId logic
- 6 auto-created tabs: Submissions · Users · AuditLog · LoginAttempts · ResetRequests · Customers
- Scheduled triggers: `maybeQuarterEnd_` · `maybeYearEnd_` · `runNightlyBackup`
- Salted password hashes + login rate limiting
- Server-side role scoping
- Customer CRUD + merge + delete
- Review email generation (quarterly + annual HTML)

---

## Known pending items

### Must-haves
- **#3 Revision tracking** — max 3 versions per submission (design questions open)

### Nice-to-haves
- PDF quote export alongside Excel
- Stale deal reminders
- Lost deal reason codes
- Pitch deck PPT generator
- WhatsApp share
- Tender document upload (informational)
- Calendar integration
- Zoho CRM sync (long-term)
- Form validation patterns (email/phone client-side format check)
- Accessibility pass (aria-labels + roles)

### Parity port (Calico → BrightSign)
- Phase A: UX polish layer
- Phase B: Data integrity layer
- Phase C: Security layer
- Mobile responsive
- Customers master list
- 1:1 Briefing
- Review emails (quarterly + annual)
- Nightly backup

---

## Architecture notes

- **Frontend:** Single-file HTML (~487 KB, ~10.7K lines) with embedded CSS + JS
- **Hosting:** GitHub Pages at `https://dgcavitak-rgb.github.io/calico-configurator/`
- **Backend:** Google Apps Script webhook at fixed deployment URL (baked into HTML)
- **Storage:** Google Sheet (6 tabs) + browser localStorage (offline queue, per-user notifications, theme pref)
- **Auth:** SHA-256 salted hashes, server-verified, session token in memory only
- **No runtime dependencies on paid services** — entire stack on Google's free tier

---

*Maintained by: Dipenkumar Gajjar · National Product Manager · Cavitak Marketing Pvt Ltd*
*Last updated: 2026-04-23 · v25.8*

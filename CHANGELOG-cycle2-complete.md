# Changelog — Cycle 2 COMPLETE (2a + 2b + 2c + 2d, both apps)

Date: 2026-04-24

---

## Deploy-ready versions — FINAL

| Component | Version | File |
|---|---|---|
| BrightSign frontend | **v24.11** | `brightsign-v24-11.html` |
| BrightSign Apps Script | **v24.9.0** | `bs-backend-v24-9.gs` |
| tvONE frontend | **v25.16** | `tvone-v25-16.html` |
| tvONE Apps Script | **v25.14** | `tv-backend-v25-14.gs` |

**What to deploy since the last round:** only the tvONE frontend (`tvone-v25-16.html`). Everything else is unchanged and already deployed or shipped.

---

## What's new in tvONE v25.16

### Cycle 2(c) — Super profile polished header (tvONE, finally)

When a Super user opens the Team tab, a forest-green gradient card with gold accents now appears above the reset-requests panel and roster table:

- **Header row:** gold avatar circle with initials · name · "SUPER" pill · role · last login
- **4 stat cards:**
  - **Active users** — live fetch from `action=listusers`, filtered by `active !== 'FALSE'`
  - **Total deals** — count of entries in the module-scoped `centralLog`
  - **Open pipeline** — sum of `dealValueINR` for open deals (₹ Cr / ₹ L / ₹K formatted)
  - **Pending resets** — live fetch from `action=resetrequest_list`, filtered to `status === 'pending'`
- **3 action buttons:**
  - "➕ Invite user" (opens `openAddUserModal()`)
  - "📊 Go to Review" (calls `showView('briefing')`)
  - "🔑 Review N pending" (appears only when there are pending reset requests; scrolls to `#resetRequestsCard`)

### Implementation choices

- **Option A chosen** (as per your confirmation): two extra fetches per Team tab open rather than patching existing load functions to cache globally. Minimal blast radius.
- **Skeleton-then-fill pattern:** stat cards initially render with "…" placeholders; `Promise.all` fetches for team count + reset count fire in parallel and the card re-paints once both resolve. Typical latency: under 1 second on decent connection.
- **tvONE theme:** forest `#1a3a2e → #0f4f3b` gradient, gold `#D4AF37` accents, cream `#F5F1E8` text. Matches the existing tvONE CALICO identity rather than cloning BrightSign's indigo-violet.
- **Non-Super users:** see no change. The container stays `display:none` and the fetches never fire.

---

## Full Cycle 2 summary — what shipped

### BrightSign v24.11

| Sub-cycle | Feature | Status |
|---|---|---|
| 2a | Comparison dropdown + 2-column card | ✅ |
| 2a | Per-period Plan of Action textarea | ✅ |
| 2a | Per-deal PoA removal from form | ✅ |
| 2b | Forward funnel drilldown table | ✅ |
| 2c | Super profile polished header | ✅ |
| 2d | 3-sheet Excel export | ✅ |

### tvONE v25.16

| Sub-cycle | Feature | Status |
|---|---|---|
| 2a | Comparison dropdown + 2-column card | ✅ |
| 2a | Per-period Plan of Action textarea | ✅ |
| 2a | Per-deal PoA removal from form | ✅ |
| 2b | Forward funnel drilldown table | ✅ |
| 2c | Super profile polished header | ✅ |
| 2d | 3-sheet Excel export | ✅ |

### Backends (bs-backend v24.9 / tv-backend v25.14)

| Feature | Status |
|---|---|
| `sales_history_aggregate` action (FY-aware period math) | ✅ |
| `review_note_get` / `review_note_upsert` actions | ✅ |
| `ReviewNotes` sheet auto-creation | ✅ |

---

## Deploy — single file this round

1. Rename `tvone-v25-16.html` → `index.html`
2. Commit + push to the tvONE GitHub Pages repo
3. Hard refresh (Ctrl+Shift+R)

BrightSign v24.11 from the previous round is already the shipped version. Backends from the Cycle 2a round are already deployed. No other actions.

---

## Verification — tvONE 2c

1. Log in to tvONE as Super (dipenkumar).
2. Click the Team tab.
3. **Expected immediately:** forest-green gradient card at the top with your avatar, name, SUPER badge, role, last-login timestamp, and 4 stat boxes.
4. "Active users" and "Pending resets" briefly show `…` then populate (parallel fetches resolving).
5. "Total deals" and "Open pipeline" populate instantly from the in-memory `centralLog`.
6. Click "➕ Invite user" → existing Add Team Member modal opens.
7. Click "📊 Go to Review" → navigates to the Review view.
8. If pending reset requests exist, a red "🔑 Review N pending" button appears and scrolls to the reset panel when clicked.
9. Log out, log in as non-Super (mohit or rahul) → Team tab doesn't load (non-Super can't see Team anyway). On Profile tab: no gradient card. Existing profile UI unchanged.

---

## Anything still pending after this release?

**Outside Cycle 2 (carryover from earlier sessions, not shipped):**

1. **BrightSign Series 5 vs Series 6 discrepancy** in the tender specification Excel (HD226/HD1026/XD236/XD1036 classification per the official BrightSign feature matrix)
2. **v24.2.7 auth fix port to Green Hippo** — if a Green Hippo selector app exists or gets built, the `authCheckAgainstSheet` fix from that session needs porting
3. **Green Hippo selector app itself** — noted as not prioritized in earlier notes

These are separate tracks from Cycle 2 and weren't scoped into this cycle. Handle when ready.

---

*Maintained by: Dipenkumar Gajjar · National Product Manager · Cavitak Marketing Pvt Ltd*

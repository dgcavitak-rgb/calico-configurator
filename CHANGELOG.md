# v25.9 — 2026-04-23 · Project Context standardization (13-field spec)

Frontend-only patch. Aligns tvONE's Project Context section with the unified 13-field spec shared between tvONE and BrightSign. No backend changes required — the Submissions sheet schema is already richer than what the UI now captures, so old columns remain populated via backward-compat mappings.

## Rationale

Per Dipenkumar's decision: Project Context on both apps should be identical. That gives the team a consistent data-entry experience across tvONE and BrightSign, and unifies reporting. The 10-field spec is: Project Name · End-User Name · Venue Type · Consultant · Partner/SI · City+State · Deal Stage · Lead Source · Expected Closure · Outcome · Partner Contact (Name, Mobile, Email). Plus two housekeeping items — a standardized Venue Type dropdown (34 options in 7 groups) and a standardized Stage list.

## Added

- **Partner Contact — Name / Mobile / Email** — the single `f_contact` text field is split into three validated fields. Mobile enforces 10-digit numeric format. Email enforces valid format via `type="email"` + live regex check (field border turns red on invalid).
- **Lead Source** required dropdown (OEM / Cavitak). Wires to the existing `dealSource` field on the payload for backward compatibility — the `leadSource` column is now the canonical source on the Sheet going forward.
- **Outcome** explicit dropdown (Open / Won / Lost / On hold). Moves the field from an auto-derived hidden value to an explicit user selection so the Review tab's win-rate analytics are accurate.
- **Expected Closure** promoted from the Technical section up to Project Context. Same smart-dropdown logic (`populateCloseMonths_()` populates next 18 months); no behavior change.
- **`autoFillStateFromCity()` helper** — when user picks a City from the existing regional-tiered dropdown, the State dropdown auto-fills from a mapping of 100+ Indian cities to their states. User can still override manually.
- **`validateEmailInline()` helper** — visual red/green feedback as user types in any email field.

## Changed

- **Venue Type dropdown** — 29-option flat list replaced with a 34-option list in 7 `<optgroup>` sections (Corporate & Office · Education · Retail & Hospitality · Healthcare & Public · Transit & Infrastructure · Venues & Entertainment · Other). Matches BrightSign v24.7.0 exactly so reporting is comparable across apps.
- **Deal Stage dropdown** — 7-option list (Lead / Qualified / Proposal-Quoted / Design-Technical / Won-Booked / Lost / On Hold) replaced with BrightSign's simpler 5-option list (Lead / Opportunity / Proposal / Negotiation / Order). Rationale: "Won / Lost / On Hold" are Outcome states and cause semantic overlap with the Outcome field. Pure-stage-only is cleaner for funnel analytics.
- **City + State** — still two separate dropdowns, but visually grouped under a "City, State" label with auto-fill from city. Stored as separate fields on the Sheet for clean State-level analytics.
- **Payload builder, validation, CSV export, Excel Summary, row detail modal, editPastSubmission prefill** — all updated to use new field names. Legacy `contact` string column stays populated (name · phone · email concatenated) so old queries continue to work.
- **editPastSubmission** — when opening an old entry, if the new `partnerContact*` fields are absent but the legacy `contact` string exists, a best-effort parser splits "Name · Phone · Email" back into the three separate fields.

## Removed

- **Venue name** text field (`f_venueName`) — replaced by the Venue Type dropdown. No data migration; old entries keep their `venueName` column on the Sheet but it's no longer read/written by the frontend.

## Not changed

- **Recommendation engine** (CORIOmaster / CORIOgrafx selection logic) — untouched.
- **BOM generation** — untouched.
- **Excel quote export** — same 3-sheet structure (Quote / Technical Specification / BOM); only the "Primary Contact" row in Summary now shows 3 rows.
- **Apps Script backend** — no schema changes. The Submissions sheet has all the columns needed already (partnerContactName, partnerContactPhone, partnerContactEmail, venueType, state, leadSource, outcome) per v25.0-25.8 schema. Any new columns required will be auto-created on first write with the appropriate header.
- **Review tab** — Quarterly, Annual, 1:1 Briefing panels unchanged. YoY growth badges still compute against prior-year Submissions data; SalesHistory sheet integration for prior-FY SAP reference data is still pending per separate discussion.
- **Deal Value (INR)** — `f_dealValueINR` stays on the form (in Technical section). Not affected by this release.

## Files in release

- `tvone-v25-9.html` — frontend only (apps-script-backend.gs unchanged)

## Deploy

1. Rename `tvone-v25-9.html` → `index.html`
2. Commit to GitHub repo, push
3. Wait ~60 seconds for GitHub Pages propagation
4. Hard refresh (Ctrl+Shift+R) on all active browsers
5. Verify: open New Config → Project Context should show 13 fields in the new order → fill a test entry → confirm Save succeeds → check Google Sheet has partnerContactName/Phone/Email columns populated plus legacy `contact` column

## Validation run (during build)

- 17/17 surgical edits on single-anchor matches
- All 3 inline `<script>` blocks parse cleanly via node's `new Function()` check
- Tag balance clean (1 each of html/head/body/style; 3 script/3 /script)
- No duplicate `f_*` IDs
- Frontend size delta: +10.7 KB (487 → 497 KB)

## Known limitations

- **Legacy `contact` column** on existing Submissions rows stays as-is; best-effort parser splits it on edit but is heuristic (finds a 10-digit string for phone, email via regex, rest as name). Entries with unusual formatting may need manual cleanup.
- **CITY_TO_STATE mapping** has 100+ cities but isn't exhaustive. Pick a city not in the map → State dropdown stays unchanged and user picks manually.
- **Stage list change** — users who had deals at "Qualified" / "Design-Technical" in the old stage list will find those options gone. Either edit those deals to pick a new stage, or wipe the Sheet per your stated plan.

## Pending (tracked separately)

- Port the v24.2.7 auth fix to tvONE (verified not needed — tvONE uses different auth pattern)
- SalesHistory sheet tab for past-year SAP reference data (sheet-based per earlier decision)

# Handoff: Proposed vs agreed (Smart Home Ops, modules 3 + 4 · quotes & jobs, block B)

## Overview

He sends the proposed number to her on WhatsApp himself. Block B makes sure he comes back to the app and records **what she actually agreed**. Owner-only.

- **B1, phone (390):** a bottom sheet over the sent quote: "What did she agree to?"
- **B2, phone (390):** the same sheet after he taps "She declined": an optional reason, then confirm.

**Phone only.** No laptop layout in this handoff. A (quote builder), C (job recording), D (quote list) and E (job list) are **out of scope**. They appear only as link targets.

**Scope: UI and UX only.** Where this says a value is **supplied**, the UI displays it and does not compute it. Supplied values:
- customer surname and area, quote number, "sent … ago" text
- the proposed total
- the floor (`money.cost_total_pesewas`)
- the difference from proposed, the profit at the typed figure, and the headroom above the floor (all update as he types; the UI shows them, it doesn't derive them)

## About the design files

- `B_proposed_agreed.dc.html` is the **live reference**. Open it in a browser with `support.js` beside it. Only **section B** is in scope.
- **The notes cards beside the frames are documentation. Do not build them.**
- `tokens.css` is authoritative (same file as the A and D handoffs).

## Fidelity

**High-fidelity.** Colours, type, spacing, radii and copy are final.

---

## Where it lives

- **Not a separate route.** It's a bottom sheet on the quote's own route.
- It **opens automatically** whenever a quote with status `sent` is opened (from D's "Record her answer ›" row, or anywhere else). It's the first thing he sees.
- Behind it: the quote header (`‹ Quotes`, `<Surname> — <area>`, `Quote <no> · sent <n> days ago · prices frozen`) under a scrim.
- The amber mode band is on (`His view · cost on screen` / `Owner`). There's **no "Show her"** here: the sheet shows his cost and profit.

## B1: "What did she agree to?"

Sheet: pinned to the bottom, full width, `--bg`, 1px `--line` top border, radius `10px 10px 0 0`, padding `18px 16px 20px`, gap 16. Scrim `--fg` at 25%.

From top to bottom:
1. **Title:** `What did she agree to?`, display 20/600.
2. **Proposed row** (space-between): `You proposed` 14px `--fg-2`; the amount in mono 16, `10px 12px`, **1px dashed `--fg-3`**, radius 8. Read-only (dashed = derived).
3. **Agreed field** (the one field with focus on open):
   - Label `She agreed to`, 14/500, gap 6.
   - Box: 1px solid `--action` + 2px `--action` outline at offset -1, radius 8, `--bg`.
   - Prefix cell `GH₵`: mono 16 `--fg-2`, `14px 12px`, 1px `--line` right border.
   - Value: mono 26, right-aligned, `8px 14px`. Numeric keyboard.
4. **Gap box:** `12px 14px`, 1px `--risk` border, radius 8, gap 4.
   - Line 1 (space-between, mono 13): `−<n> from proposed` in `--fg-2` · `profit <n>` in `--fg`.
   - Line 2 (12px `--fg-2`): `Still <n> above your floor of <n>.`
5. **Primary:** `Accept at <typed figure> · creates the job`. Min-height 52, display 16/600, `--action` fill, `--bg` text, radius 10. The label follows the typed figure.
6. **Secondary:** `She declined`. Min-height 48, 14/500 `--fg-2`, transparent, 1px `--line`, radius 8. Opens B2.

On accept: the quote becomes accepted and the API returns a `job_id`. Go to that job (C) so a deposit has somewhere to land.

## B2: Mark declined

Same sheet, content swapped in place (no second sheet). Padding `18px 16px 20px`, gap 14.
1. **Title:** `Mark declined`, display 20/600.
2. **Reason:** textarea, 3 rows, 16px/1.5, 1px `--line`, radius 8, padding 12, no resize. Placeholder: `Why, if she said. Most declines are silence; leave it empty.` Optional.
3. **Buttons** (row, gap 8):
   - `Declined`: flex 1, min-height 48, display 15/600, `--risk` fill, `--bg` text, radius 8.
   - `Back`: min-height 48, `0 16px`, 14/500 `--fg-2`, no border. Returns to B1 with the typed agreed figure kept.

On decline: the quote becomes declined and he returns to D (it appears under Answered, with the reason if one was typed).

---

## Interactions & behaviour

- The agreed field takes focus when the sheet opens; the numeric keyboard is up.
- The gap box and the primary label update as he types.
- Inputs on focus: `outline: 2px solid --action; outline-offset: -1px`.
- Primary hover `--action-hover`, active `translateY(1px)`. Transitions `--motion`; sheet in/out `--motion-sheet`.
- Hit targets ≥ 44px (all drawn at 48–52).
- **Offline:** keep the sheet; show the A-style mono 11 `--risk` `no signal` in the quote header. Accept and Declined need a connection (accept must return a job).

## Not drawn (decide before build)

- The agreed field **empty** (when he clears it): what the primary and gap box show.
- Agreed **above** proposed (gap box wording with `+`).
- Agreed **below the floor** (the gap box's line 2 wording).
- Accept/decline **failure** (API error) state.

## What the UI needs to render

Fields only, not a data model: customer surname + area, quote number, sent-ago text, proposed total, floor, and for the typed figure: difference, profit, headroom over floor. After accept: `job_id`.

## API notes

- **C6 (gap report):** the agreed total is set on `quote.accept` and then editable as `job.agreed_total_pesewas`. Confirm which is the record before build.
- **C1:** quote detail has no customer name/house label; the header needs both.
- **Cancel releases the quote** (`/jobs/{id}/cancel`), so a sent → accepted quote can come back to B1.

## Copy

Use the exact strings above and in the reference. Money is `GH₵` + grouped integer (`7,500`), mono, tabular figures.

## Files

- `B_proposed_agreed.dc.html`: live reference, section B only.
- `support.js`: runtime for the reference. Don't ship it.
- `tokens.css`: design tokens.

# Handoff: Quote lifecycle, Draft → Waiting → Answered (Smart Home Ops, modules 3 + 4 · quotes & jobs)

## Overview

This handoff covers what happens to a quote after it exists as a draft: he sends it, waits for her, and records her answer. Owner-only.

It adds **B3, the laptop version of "What did she agree to?"**, and the **edge states** for B on both phone and laptop. It ties A, D and B together as one flow. A, D and phone B already have handoffs; this one doesn't repeat them.

| Status | Where it sits in D | Screens |
|---|---|---|
| `draft` | Drafts tab / column | D → A (builder) ⇄ her view |
| `sent` | Waiting tab / column | D → B1 (phone) / **B3 (laptop)** |
| `accepted` | Answered | → C (the job) |
| `declined` | Answered | → D |

**Scope: UI and UX only.** Where a value is **supplied**, the UI displays it and doesn't compute it. Supplied values: proposed total, floor, the difference from proposed, the profit and floor headroom at the typed figure, and whether the typed figure is under the floor. Also supplied: customer surname and area, quote number, "sent … ago" text, and `job_id` after accept.

## Files

- `Quote_Lifecycle_Journey.dc.html`: the flow map. Read it first. It's documentation, so don't build it.
- `Quotes_Jobs_Screens.dc.html`: the live reference. **Section B (B1, B2, B3) is in scope.** A and D are only there for context and already have their own handoffs (`design_handoff_quote_builder/`, `design_handoff_quote_list/`, `design_handoff_proposed_agreed/`).
- `tokens.css`: authoritative tokens (the same file as the other quotes handoffs).
- `support.js`: runtime for the reference files. Don't ship it.
- **The notes cards and the "Try" chip row under B3 are documentation. Don't build them.**

## Fidelity

High-fidelity. Colours, type, spacing, radii and copy are final.

---

## The flow, step by step

1. **Drafts (D).** Last edited first. The row shows `edited <time> ago`. A tap opens A.
2. **Build (A).** Amber owner view. `Show her` flips to the dark customer view; a 900 ms hold returns.
3. **Send.** He sends the total to her on WhatsApp himself; the app doesn't send anything. Back in A he taps **Mark sent** → status `sent` and prices freeze.
   - If labour is empty, the send card shows `Labour not set. Sending will be refused until you type it.` and he stays in Draft.
   - **What he sees after Mark sent isn't decided.** See Open decisions. Stub it: go back to D on the Waiting tab.
4. **Waiting (D).** Oldest first. The row shows the days-waiting number and `Record her answer ›`.
5. **Her answer (B).** Opening any `sent` quote opens B straight away: the B1 sheet on the phone, the B3 dialog on the laptop.
   - Accept → `accepted` → go straight to the job (C) using `job_id`.
   - She declined → optional reason → `declined` → back to D, Answered.
   - Not yet (laptop Esc, phone `‹ Quotes`) → back to D. The quote stays `sent`.
6. **Answered (D).** Last 30 days. Accepted rows show the chip `accepted <date>` and `Job <no> ›`. Declined rows show a grey chip and the reason, if there is one.

**The way back:** cancelling a job releases the quote (`accepted` → `sent`). The next time it's opened, B appears again. No extra UI is needed for this.

---

## B3: laptop, "What did she agree to?"

**Route:** the quote's own route, the same as phone B. It's a **dialog**, not a new page, and it opens automatically when a `sent` quote is opened at ≥ 900px.

**Behind it:** the A2 layout, read-only and frozen. Left rail: `Quotes ›`, `<Surname> — <area>`, mono 11 `Quote <no> · sent <n> days ago · prices frozen`, then the rooms with their totals. The centre is the line table without editing controls. The right rail has the `Proposed` card. Amber mode band on. No `Show her`.

**Scrim:** `--fg` at 25%, covering everything below the mode band (the band stays visible). Clicking the scrim does nothing.

**Dialog:** 640 wide, centred, 150px from the top of the frame. `--bg`, 1px `--line`, radius 10, shadow `0 10px 30px` `--fg` at 16%.

- **Header** (`18px 12px 16px 24px`, 1px `--line` bottom border, space-between):
  - Left: `What did she agree to?` display 22/600. Under it, mono 12 `--fg-2`: `<Surname> — <area> · Quote <no> · sent <n> days ago`.
  - Right: `Esc` key cap (mono 11, `2px 6px`, 1px `--line`, radius 4) followed by `Not yet`, 14/500 `--fg-2`, min-height 36.
- **Body** (`22px 24px 24px`, gap 18):
  1. **Two columns** (equal widths, gap 16, aligned to the bottom):
     - `You proposed` 14 `--fg-2`, over a 56px box: **1px dashed `--fg-3`**, radius 8, `GH₵` mono 16 `--fg-2` on the left and the amount in mono 22 on the right. Read-only.
     - `She agreed to` 14/500, over a 56px box: 1px `--action` + 2px `--action` outline at offset -1, radius 8. A `GH₵` prefix cell (mono 16 `--fg-2`, 1px `--line` right border), then the input: mono 26, right-aligned, numeric. **It has focus on open.**
  2. **Gap box** (`12px 14px`, radius 8, gap 4): see "Edge states" for the border.
     - Line 1 (space-between, mono 14): `<±n> from proposed` (`--fg-2`) · `profit <n>` (`--fg`).
     - Line 2, 13px: the floor line.
  3. **No-signal line** (only when offline): mono 12 `--risk`, `no signal · accepting and declining need a connection. What you've typed is kept.`
  4. **Buttons** (row, gap 10):
     - Primary, flex 1, min-height 52, display 16/600, radius 10, `--action` / `--bg`: `Accept at <typed> · creates the job`, followed by an `Enter` key cap (mono 11, 1px currentColor, radius 4, 80% opacity).
     - Secondary, min-height 52, `0 20px`, 14/500 `--fg-2`, transparent, 1px `--line`, radius 8: `She declined`. Hover: border `--fg-3`.

**Decline step (same dialog, content swapped in place):**
- Header: `Mark declined` display 22/600. Under it, mono 12 `<Surname> — <area> · Quote <no> · proposed <n>`.
- `Reason · optional` (14/500, with `· optional` in 400 `--fg-2`). Textarea: 3 rows, 15/1.5, 1px `--line`, radius 8, padding 12, no resize, focus outline 2px `--action`. Placeholder: `Why, if she said. Most declines are silence; leave it empty.`
- Buttons: `Declined`, flex 1, min-height 48, display 15/600, `--risk` fill, `--bg` text, radius 8. Then `Esc` key cap + `Back`, 14/500 `--fg-2`, no border. Back keeps the typed figure.

**Keyboard:**
- Enter in the agreed field = Accept (only when Accept is enabled).
- Esc on the answer step = Not yet: close and go back to D, still `sent`.
- Esc on the decline step = Back.
- Focus is trapped in the dialog. Tab order: agreed field → Accept → She declined → Not yet.

**After the action:** the same as phone. Accept → C (job) via `job_id`. Declined → D, Answered. Not yet → D, Waiting. The dashed "Prototype · where he lands" card in the reference stands in for those navigations. Don't build it.

## Edge states (apply to B1 phone and B3 laptop)

These were "Not drawn" in the phone B handoff. B3 draws them; use the same rules on B1.

| State | Gap box | Floor line | Primary |
|---|---|---|---|
| **Empty** (field cleared) | 1px **dashed** `--fg-3`; line 1 hidden | `--fg-2` `Type the figure she agreed to. The difference and your profit show here.` | Disabled: `--surface` fill, `--fg-3` text, label `Type what she agreed to`, not-allowed cursor |
| **Below proposed** (normal) | 1px solid `--risk` | `--fg-2` `Still <n> above your floor of <floor>.` | Enabled |
| **Same as proposed** | 1px solid `--risk` | as above; line 1 reads `same as proposed` | Enabled |
| **Above proposed** | 1px solid `--risk` | as above; line 1 reads `+<n> above proposed` | Enabled |
| **Under the floor** | **2px** solid `--risk` | `--risk` 600: `<n> below your floor of <floor>. You can still accept, but the job loses money.` | **Still enabled.** It's his call |
| **No signal** | unchanged | unchanged | Accept and Declined disabled (same disabled style); no-signal line shown; typed figure and reason kept |
| **API error** on accept/decline | unchanged | unchanged | Not drawn. Suggest: the no-signal line slot shows `--risk` `Couldn't save. Nothing changed; try again.` Buttons re-enabled |

Whether a figure is "under the floor" is **supplied**. The UI only switches styles on it.

On the phone, the edge states keep B1's sizes (gap box mono 13 / 12px, primary min-height 52, no key caps).

## Responsive

Below ~900px use B1/B2 (bottom sheet). At ~900px and above use B3 (dialog). Same route, same data.

## Interactions & motion

- Dialog in/out `--motion-sheet`. Colour, border and background transitions `--motion`.
- Primary: hover `--action-hover`, active `translateY(1px)`.
- The gap box, floor line and primary label update on every keystroke.

## Open decisions (not designed; stub them)

1. **After Mark sent** (journey step 04). Options on the map:
   - a toast `Sent · waiting on her`, then D on the Waiting tab
   - stay on the quote, read-only
   - open B straight away

   Not decided. Stub with the first option.
2. **The read-only view of a declined quote** (D → declined row). Stub it.
3. **Reopening a sent quote** (sent → draft, gap D3) is in the API but not in the brief. Don't build it.
4. **API error copy:** confirm the suggested wording above.

## API notes

- **C6:** the agreed total is set on `quote.accept` and is later editable as `job.agreed_total_pesewas`. Confirm which one is the record.
- **C1:** quote detail has no customer name or house label, and both B headers need them.
- `/send` refuses a derived-zero labour charge. Show it as A's prompt, not as an error.
- `/jobs/{id}/cancel` releases the quote back to `sent`.

## What the UI needs to render

These are fields only, not a data model:
- Per quote: number, status, surname, area, sent-ago text, proposed total, floor.
- For the typed figure: the difference, the profit, the headroom or shortfall against the floor, and an under-floor flag.
- After accept: `job_id`.
- Connection state.

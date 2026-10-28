# Handoff: Recording the job (Smart Home Ops, modules 3 + 4 · quotes & jobs, block C)

## Overview

He sits at a desk at about 9pm, after the fit-out. The job was created when she accepted (B). Most lines went in as quoted, so this screen is for **correcting, not entering**: he changes the few things that were different, checks the money, and completes the job.

- **C1, laptop (1440).** Owner-only, so it uses the light theme and has **no audience band**.

A, B, D and E are out of scope. They appear only as link targets. There's no phone version of C (see Open decisions).

**Scope: UI and UX only.** Build the layout, states and interaction behaviour described here. This handoff doesn't specify how anything is calculated or stored. Where a value is **supplied**, the UI displays it and doesn't compute it.

Supplied values:
- **Header:** job number, customer surname and area (gap C1), the source quote number, the accepted date and agreed figure, the fitted date, and the status.
- **Lines:** the pre-filled fitted quantities, the quoted item name for swaps (gap C2), and the line totals for charged and cost.
- **Profit card:** profit, charged, cost split into devices and misc, and the variance against the quote.
- **Money:** payments, received, owed.
- **Costs:** the costs, the estimate, and the difference from the estimate.
- **Completing:** the device count on the button area, the consequence sentence for each job type, and the house effects / negative stock returned by `/complete`.

## Files

- `C_job_recording.dc.html` is the **live, clickable reference**. Open it in a browser with `support.js` beside it. **Only section C is in scope**; ignore the other blocks.
- **The four notes cards under the frame are documentation. Don't build them.**
- `tokens.css` holds the authoritative tokens. It's the same file as the other quotes handoffs.

## Fidelity

High-fidelity. Colours, type, spacing, radii and copy are final.

---

## Layout (C1)

Frame: 1440 wide, `--bg`, 1px `--line`, radius 10.

1. **App bar.** `--fg` fill, `12px 24px`. On the left, `Smart Home Ops` display 15/600. On the right, mono 11 `saved · <time>` in `--fg` at 80%. While saving or offline, this slot shows status only (see States).
2. **Module tabs.** `--surface`, `8px 20px 0`, 1px `--line` bottom border. Tabs are 13/500 `--fg-2`, padding `10px 14px`. `Jobs` is active: 600 `--fg` with a 2px `--action` underline.
3. **Body grid.** `minmax(0,1fr) 420px`, gap 32, padding `24px 32px 32px`.
   - Left column (gap 24): header → job type → lines → complete bar.
   - Right column (gap 16): profit card → charged/received/owed → costs.

### Header
- `Jobs ›` 13 `--fg-2` (back to E).
- `Job <no> — <Surname>, <area>` display 22/600.
- 13 `--fg-2`: `From <quote no>` (a link to the quote) ` · accepted <date> at GH₵ <agreed> · fitted <date>`.
- On the right, a status chip: mono 11, `5px 9px`, radius 6, 1px `--action` border and `--action` text, `in progress`. Once completed it reads `completed`, with `--fg-3` border and `--fg-2` text.

### "What this job does to her house"
A card: padding 20, 1px `--line`, radius 10, gap 12.
- Title: display 18/600.
- **Four choice tiles** in a 4-column grid, gap 8. Each tile is padding `12px 14px`, radius 8, left-aligned. Name is display 16/600; short is 13 at 85% opacity.

  | Tile | Short |
  |---|---|
  | Install | adds to her house |
  | Upgrade | adds beside what's there |
  | Repair | swaps one out |
  | Relocation | moves one |

  - Selected: `--action` fill and border, `--bg` text.
  - Unselected: `--bg`, 1px `--line`, `--fg` text.
  - It's a single-select radio group, not a dropdown.
- **Consequence sentence.** 15/1.55, padding `12px 14px`, `--surface`, radius 8. It updates as soon as he picks a tile. The copy is supplied per type; the reference uses:
  - Install: `Completing adds these <n> devices to her house record, in the rooms shown. Use this for a first fit-out.`
  - Upgrade: `Completing adds these <n> devices alongside what she already has. Nothing already on her record is touched.`
  - Repair: `Completing takes the replaced units off her house record and puts these in the same rooms. Her device count stays the same.`
  - Relocation: `Completing moves devices already on her record to the rooms shown. Nothing new is added to her house.`

### Lines
**Toolbar** (space-between):
- On the left, `Lines` display 18/600 followed by `<n> differ from the quote` 14 `--fg-2`.
- On the right, a segmented control (`--surface`, 1px `--line`, radius 8, padding 3) with two options: `Differences · <n>` and `All · <n>`. Each option is 13/600, `7px 12px`, radius 6. The active one is `--bg` with `--fg` text; the inactive one is transparent with `--fg-2` text.
- Next to it, the `+ Add line` button: display 14/600, `--bg`, 1px `--line`, radius 8, `9px 14px`, shadow `0 1px 3px` `--fg` at 8%.

**Table:** 1px `--line`, radius 10, overflow hidden.
- Columns: `minmax(0,2.6fr) 0.9fr 0.6fr 0.8fr 0.9fr 0.9fr 0.9fr minmax(0,1.8fr)`, gap 12.
- Order: Item · Need · Quoted · Fitted · Change · Charged · **Cost · owner** · Note.
- Header row: `10px 16px`, `--surface`, mono 10 uppercase with 0.1em tracking, `--fg-3`. Quoted, Fitted, Charged and Cost are right-aligned. **The Cost header is `--risk` (amber)**, because it's owner-only data.
- **Room group row:** `8px 16px`, `--bg` at 98.5%, mono 11 uppercase with 0.08em tracking, `--fg-2`.
- **Line row:** `10px 16px`, 1px `--line` at 94% bottom border.
  - Item: 14. For a swap, a second line in mono 11 `--fg-2` reads `quoted: <quoted item name>`.
  - Need: mono 11 `--fg-2`.
  - Quoted: mono 13 `--fg-2`, tabular numerals. `—` when the line was added on the day.
  - **Fitted:** an input 56 wide, right-aligned, mono 14, tabular numerals, radius 8, `6px 8px`, numeric. Focus: 2px `--action` outline at offset -1.
  - Change: a chip (see below).
  - Charged and Cost: mono 13, tabular numerals, right-aligned. Cost is in `--fg-2`.
  - Note: 13/1.4 `--fg-2`.

**The unchanged / changed rule.** This is the existing system rule: dashed means system-set, solid means he edited it.

| | Unchanged (as quoted) | Changed |
|---|---|---|
| Row bg | `--bg` | `--action-tint` |
| Item / figures ink | `--fg-2`, 400 | `--fg`, 500 |
| Fitted input border | 1px **dashed** `--fg-3` | 1px **solid** `--action` |
| Change chip | none | shown |

**Change chip:** mono 11, `3px 7px`, radius 6, `--bg` fill, 1px border, no wrapping. Which chip applies comes from the data; the UI only renders it.

| Chip | Colour | When |
|---|---|---|
| `+n` / `−n` | `--action` | fitted ≠ quoted |
| `swapped` | `--action` | a different item was fitted (shows the `quoted:` line) |
| `added` | `--action` | there was no quote line (Quoted `—`) |
| `not fitted` | `--risk` | fitted 0 (gap B2: it comes back at qty 0) |

**Differences view (default):**
- Only changed rows are shown. Group rows with no changed lines are hidden.
- Below the table there's a full-width button: `12px 16px`, `--surface`, 13 `--fg-2`, left-aligned, reading `<n> lines fitted as quoted · show all`. Clicking it switches to All.

**All view:** every row, grouped by room.

Editing Fitted updates that row's state, chip, Charged and Cost, the toolbar count, the profit card and the complete sentence, all straight away.

### Complete bar
- Padding 20, 1px `--line`, radius 10, `--surface`, space-between, gap 24.
- On the left, 14/1.6 `--fg-2`, max-width 640: `Completing draws <n> devices from stock and writes them to her house record as <type>. After this the job is settled. Late receipts can still be added as costs.`
- On the right, the `Complete job` button: display 16/600, `--action` / `--bg`, radius 10, `14px 24px`, hover `--action-hover`.

### Profit card (right)
- `--fg` fill, `--bg` text, radius 10, padding 20, gap 6. It's the only dark card on the screen.
- Label: mono 10 uppercase, 0.12em tracking, 80%: `Profit on this job · owner only`.
- Figure: mono 30/500, tabular numerals: `GH₵ <profit>`.
- Breakdown: 13/1.5, 80%: `Charged <n> − cost <n> (devices <n> + misc <n>)`.
- Variance: mono 12, 80%, with an 8px top padding and a 1px `--fg-2` top border: `vs quote: expected <n> at the agreed price · ±<n>`.

### Charged, received, owed
A card: padding 20, 1px `--line`, radius 10, gap 12. Title display 18/600.
- **Charged row** (label + input, space-between):
  - Label: 14/500 `Charged`, with 12 `--fg-2` `agreed on the quote: <agreed>` below it.
  - Input: 120 wide, mono 15, right-aligned, radius 8, `9px 10px`, numeric. It's **dashed `--fg-3`** while it equals the agreed figure and **solid `--action`** once he's edited it (gap C6: which one is the record).
- **Payments list** (1px top border):
  - Each row is a grid `56px 1fr auto`, `10px 0`, 14. Date in mono 12 `--fg-2`. Method with a ref in mono 11 `--fg-2` (`Mobile money · MTN 7781`). Amount in mono, tabular numerals.
  - `+ Record a payment`: 13/500 `--action` text link. **The dialog isn't designed**, so stub it.
- **Three tiles** (3-column grid, gap 8; each tile `10px 12px`, radius 8):
  - Charged and Received: `--surface` fill, 12 `--fg-2` label, mono 16 figure.
  - **Owed:** transparent, 1px `--risk` border, `--risk` label, mono 16/600 `--risk` figure.
  - When owed is 0, show `--surface` and `--fg` with no amber. When overpaid (`balance_state: overpaid`), label it `Overpaid` in `--action`. Neither of these is drawn.

### Costs
A card: padding 20, 1px `--line`, radius 10, gap 10.
- Header (baseline, space-between): `Costs` display 18/600. On the right, mono 12 `--risk`: `<actual> vs <estimate> estimated · ±<n>`.
- Each row is a grid `1fr auto auto`, gap 10, `9px 0`, 14:
  - The label, plus an optional `receipt` tag (mono 10, `2px 6px`, radius 5, `--surface`, `--fg-2`) when a receipt is attached (gap B3).
  - The source tag (mono 10, `2px 6px`, radius 5, `--fg-2`): `field` has a **solid** `--fg-3` border; `desk` has a **dashed** one.
  - The amount, mono, tabular numerals, 64 wide, right-aligned.
- `+ Add a cost`: 13/500 `--action` link. Stub it.
- Footnote, 12/1.5 `--fg-2`: `"field" = thrown at the job from his phone on the day. "desk" = added afterwards. A field figure is the one to trust.`

---

## States

| State | What changes |
|---|---|
| **In progress** (drawn) | Everything editable as above |
| **Completed** (not drawn) | Status chip `completed`. Fitted inputs, the Charged input, job type tiles, `+ Add line` and the Complete bar are gone, and figures render as plain text. Only `+ Record a payment` and `+ Add a cost` remain. **No reopen** (gap D1) |
| **Cancelled** (not drawn) | Status chip `cancelled` in `--fg-3`. Read-only. The quote goes back to Waiting (B) |
| **Saving / offline** | App bar slot shows `saving…` / `no signal · changes kept`, in `--risk` when offline. Complete is disabled while offline |
| **Negative stock on complete** | `/complete` returns `negative_stock`. Not drawn; see Open decisions |

## Interactions

- Edits save as he goes; there's no Save button. The `saved · <time>` text updates after each save.
- The Differences / All toggle is view-only and isn't persisted.
- Picking a job type swaps the consequence sentence and the "as <type>" in the complete bar instantly.
- Transitions: colour and border use `--motion`.
- Keyboard: Tab moves through the Fitted inputs top to bottom. Enter in a Fitted input moves to the next row's Fitted.

## Open decisions (not designed; stub them)

1. **Complete confirmation.** Either one tap, or a confirm step listing the house effects and any negative stock from `/complete`. Stub it as one tap followed by the completed state.
2. **The Record a payment dialog** (method, ref, amount, date). Deferred to block I (payments detail).
3. **+ Add line / swap picker.** It reuses the A item picker (gap C8: recency sort).
4. **Deposit on the phone right after Accept.** B's Accept lands on C on a phone, but C has only been designed at 1440. On small screens, stub C as a single column in this order: header → charged/received/owed → lines (All view) → costs → complete. Confirm the order.
5. **Owed = 0, overpaid, completed and cancelled visuals.** Not drawn. Follow the rules in States.

## API notes

- **C1:** job detail has no customer name or house label.
- **C2:** swaps return ids only, but the `quoted:` line needs the item name.
- **C5:** the suggested deposit isn't in the API, and the UI must not compute 60%.
- **C6:** the agreed total is on both the quote and the job. Which one does Charged edit?
- **C7:** "charged" is ambiguous on a job with no quote (block H).
- **C11:** what does a cancelled job owe?
- **D1:** reopen exists in the API, but the brief says no. Don't expose it.
- **B2 / B3 / B5:** missing lines come back at qty 0 (`not fitted`); receipts are assumed; repairs are recorded per room.
- `/complete` returns `house_effects` and `negative_stock`, ready for open decision 1.

## What the UI needs to render

These are fields only, not a data model:
- **Job header:** no, surname, area, quote no, accepted date, agreed, fitted date, status, job type.
- **Per line:** room, item name, quoted item name, need, quoted qty, fitted qty, change kind and value, charged, cost, note.
- **Counts:** differing, total, as-quoted, fitted devices.
- **Money:** profit, charged, cost devices, cost misc, expected, variance, payments (date, method, ref, amount), received, owed, balance state.
- **Costs:** label, source, receipt flag, amount, the estimate, the difference.
- **Status:** save state and connection state.

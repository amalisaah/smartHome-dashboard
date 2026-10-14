# Handoff: Building a quote (Smart Home Ops, modules 3 + 4 · quotes & jobs, block A)

## Overview

Block A is the quote builder. He builds the quote in the customer's living room with her watching, usually on his phone, sometimes on a laptop. It is the first surface with **two audiences**: his view (with cost and profit) and her view (customer-safe). He can turn the device round to show her.

- **A1, phone (390):** his view (building by room or by need, line editing, item picker, money sheet) and her view.
- **A2, laptop (1440):** the same quote, with the same lines and money, as a three-column desk layout and her view.

B (proposed vs agreed), C (job recording) and the quote list are **out of scope**. They appear only as links and breadcrumbs.

**Scope: UI and UX only.** Build the layouts, states and interaction behaviour described here. This handoff does not specify pricing, how the materials figure is derived, how profit or floor is computed, stock rules, sync or conflict handling. Where it says a value is **supplied**, the UI displays it and does not compute it.

Supplied values include:
- every line total and cost
- the device total and device cost
- proposed total, expected profit and floor
- the derived materials figure
- stock warnings (held count, lead days)
- each item's default need
- rooms (from the house record)
- the catalogue search results
- save state, and the per-room line counts and totals

Single user, no login, no roles.

## About the design files

- `A_quote_builder.dc.html` is the **live, clickable reference**. Open it in a browser (it needs `support.js` beside it). Only **section A** is in scope; ignore B and C. The two Tweaks props (`offline`, `startInHerView`) are for previewing states and are not features.
- **The notes cards beside and under the frames are documentation. Do not build them.**
- `tokens.css` holds the design tokens and is authoritative. It includes the **audience mode** extension: `--band`, `--hold-reveal`, and the `.audience-customer` dark scope.
- Hover, focus and press states are specified below.

## Fidelity

**High-fidelity.** Colours, type, spacing, radii and copy are final. Match metrics exactly.

---

## The cost wall (audience mode): get this right first

His view and her view must be unmistakable **at arm's length, in glare or at dusk**.

1. **Brightness carries the mode.**
   - His view is the app's normal **light** theme, with a full-width amber **mode band** at the very top.
   - Her view fills the whole screen **dark** (`.audience-customer` tokens).
   - There's no partial state: nothing light shows in her view, and nothing in his view is dark except the two cues in rule 4.
2. **Different layouts, not hidden columns.**
   - Her view is a separate screen: big title, one row per need, a total.
   - It is **not** his screen with cost hidden by CSS.
   - It must render **only from customer-safe data**. If a cost value is never in her view's data, a bug can't reveal it. Omit fields; never style them away.
3. **Switching is easy one way and hard the other.**
   - **His → hers:** one tap on `Show her`. It closes any open sheet or expanded line first.
   - **Hers → his:** press and **hold** `Hold to go back` for `--hold-reveal` (900ms). A fill bar grows across the pill (`width` linear over 900ms).
     - Releasing early, or the pointer leaving the pill, cancels the hold and the bar snaps back (120ms ease-out).
     - A tap does nothing.
     - The label is neutral and never mentions cost.
4. **In his view, dark means "hers".** Only two things in his view are dark:
   - the `Show her` button, which looks like the screen it opens
   - the 3px top edge on the "On her quote" box
   His money figures stay light with an amber edge. (This suspends the usual dark money card inside owner mode.)
5. **The mode band** (`--band-h` 32px): fill `--band`, text `--fg`, mono 11/600, `.14em` tracking, uppercase. It reads `His view · cost on screen` on the left and `Owner` on the right. It's on every owner-side screen of this surface, including when a sheet is open.

On the laptop, each mode has its own switch state: switching the laptop doesn't switch the phone.

---

## A1: Phone, his view (390 × 844)

The column from top to bottom: mode band, header, controls row, room chips (by room only), scroll area, money bar. Sheets overlay all of it except the band.

**Header** (`12px 16px 14px`, gap 4):
- **Row 1:** `‹ Quotes` 14px `--fg-2` on the left. Save state on the right in mono 11 with a 7px dot:
  - online: `--action` dot, `saved · <time>` in `--fg-2`
  - offline: `--risk` dot and text, `no signal · held on phone`
- **Title:** `<Surname> — <area>` in display 20/600.
- **Meta:** mono 11 `--fg-2`, `Quote <no> · draft · <level label>`.

**Controls row** (`0 16px 12px`, gap 8):
- **Segmented control** `By room | By need` (flex 1):
  - Track: `--surface` with a 1px `--line` border, radius 8, padding 3.
  - Segments: min-height 40, 14/600, radius 6. The active segment is `--bg` with `--fg` text; the inactive one is transparent with `--fg-2` text.
- **Off toggle:** min-height 48, `0 12px`, mono 12 `--fg-2`, transparent, **1px dashed `--fg-3`**, radius 8. The label is `<n> off`, or `Hide off` while switched-off lines are shown.

**Room chips** (by room only; a horizontal scroll with no visible scrollbar, `0 16px 12px`, gap 8):
- One chip per room from the house record, in walk order.
- Chip: min-height 44, `0 12px`, 14/500, radius 8, no wrap. After the name, a mono 11 line count at 0.8 opacity (blank when the room is empty).
- Active chip: bg and border `--action`, text `--bg`. Inactive: transparent, 1px `--line`, `--fg-2`.
- Rooms are never typed or created here.

**Scroll area: by room.** It has a 1px `--line` top border.
- **Adding to header**, sticky at top (`12px 16px`, `--surface`, 1px `--line` bottom):
  - Micro label `Adding to` (mono 10, `.14em`, uppercase, `--fg-3`) over the room name in display 18/600.
  - On the right, the primary `+ Add` button: min-height 48, `0 20px`, display 16/600, `--action` bg, `--bg` text, radius 8.
- **Line row** (a full-width button, `12px 16px`, min-height 56, 1px `--divider` bottom):
  - **Left column**, gap 3:
    - item name 15/500
    - mono 11 `--fg-2` meta `×<qty> · <need>`
    - if short of stock, mono 11 `--risk` `only <n> held · <d> d lead` or `not held · <d> d lead`
    - if there's a note, 13px/1.4 italic `--fg-2` `"<note>"`
  - **Right column**, right-aligned: mono 15 line total, and under it mono 11 `--fg-2` `cost <line cost>`.
  - Tapping the row expands it. Only one line is expanded at a time; tapping again collapses it.
- **Expanded line** (`4px 16px 16px`, `--surface`, gap 14):
  1. `Quantity` 13px `--fg-2`, with a stepper on the right: 1px `--line`, radius 8, 48×48 `−`/`+` buttons on `--bg`, and a 52px mono 18 value between them. The minimum is 1; removing a line is the switch-off button, not quantity 0.
  2. `Need · from its group, change if you solved it differently` 13px `--fg-2`, then the **eight fixed needs** as chips (wrap, gap 6): mono 12, min-height 36, `0 10px`, radius 6. In order: lighting, switching, security, climate, power, networking, sensors, control.
     - Selected: `--action` bg and border, `--bg` text.
     - The item's group default, when not selected: **1px dashed `--fg-3`**.
     - Others: 1px `--line`, `--fg-2`.
  3. **Note input:** 16px, min-height 48, `--bg`, 1px `--line`, radius 8, `12px`. Placeholder `Note — optional, e.g. no neutral in the box`. Focus: 2px `--action` outline at offset -1.
  4. **Switch-off button:** full width, min-height 48, 14/500 `--fg-2`, transparent, 1px `--line`, radius 8. Label `Switch this line off · she said no`. It collapses the line.
- **Empty room:** `Nothing in <room> yet. Tap + Add.`, centred, 14px `--fg-2`, `32px 16px`.
- **Switched-off rows** (only while the off toggle is on, under the active rows):
  - Layout: `10px 16px`, min-height 56, 1px **dashed** `--line` bottom, `--fg-3` text.
  - Name 15px struck through, with mono 11 `×<qty> · off since <date>` under it.
  - On the right, a `Switch on` button: min-height 44, `0 12px`, 13/500 `--action`, 1px `--line`, radius 8.
  - A switched-off line is never deleted. It's out of every total and out of her view.
- **Other rooms:** micro label `Other rooms` (`16px 16px 6px`), then one row per other room:
  - Layout: min-height 48, `10px 16px`, 1px `--divider` bottom, `--fg-2`.
  - Room name 14px with mono 11 `· <n> lines` or `· empty`. Mono 13 room total on the right.
  - Tapping a row makes that room active.

**Scroll area: by need.** It's the same lines grouped by need, as a read-only sanity check.
- **Group header** (`12px 16px`, `--surface`, 1px `--line` bottom): need name in display 18/600 with mono 12 `--fg-2` `· <n> points`; mono 14 group total on the right.
- **Rows** (`10px 16px`, min-height 48): name 15/500, mono 11 meta `×<qty> · <room>`, and the total and cost on the right as in by-room.
- Only needs with lines appear.

**Added toast** (after each add from the picker):
- Absolute, `left/right 12px`, `bottom 100px`, `12px 14px`, bg `--fg`, text `--bg` 14px, radius 10.
- Reads `Added <item> → <room>`. It dismisses after 1.8s and each new add resets the timer.

**Money bar** (pinned, `12px 12px 16px`, `--surface`, 1px `--line` top). It's a grid `minmax(0,1fr) auto auto`, gap 8:
1. **Proposed:** micro label over mono 20/500 `GH₵ <total>`. If labour isn't set, a mono 11 `--risk` line reads `labour not set`.
2. **Profit button** (opens the money sheet): min-height 56, `8px 12px`, `--bg`, **1px `--risk`** border, radius 8.
   - Micro label `Profit` in `--risk`.
   - Mono 18/500 `GH₵ <profit>`.
   - Mono 11 `--fg-2` `floor <floor>`.
3. **Show her** (the switch): min-height 56, `8px 14px`, bg **`oklch(0.19 0.012 260)`** (the customer `--bg`), radius 8, no border. Display 16/600 `Show her` in `oklch(0.95 0.004 260)`, with mono 10 `one tap` in `oklch(0.74 0.008 260)` under it.

### A1 item picker (bottom sheet)

- **Scrim:** `--scrim`. **Sheet:** bottom-anchored, 74% height, `--bg`, 1px `--line` top, radius `10px 10px 0 0`, `--elev-sheet`.
- **Sheet header** (`14px 16px`):
  - Micro label `Adding to · tap to add`; it becomes `Adding to · <n> added` after the first add.
  - Room name in display 18/600.
  - A primary `Done` button: min-height 48, `0 18px`, display 15/600.
- **Search input** (`0 16px 10px`): 16px, min-height 48, `--surface`, 1px `--line`, radius 8. Placeholder `Search name or keyword`. It searches name and group.
- **Result row** (a full-width button, `10px 16px`, min-height 56, 1px `--line` bottom, pressed bg `--match-highlight`):
  - Left: name 15/500 over mono 11 meta `<group> · <n> held`, or `<group> · not held · <d> d` in `--risk`.
  - Right: mono 14 sell price over mono 11 `--fg-2` `cost <cost>`.
- **Behaviour:**
  - A tap adds the item to the **active room** and the sheet **stays open** for the next tap.
  - Tapping an item already in that room adds 1 to the existing line instead of creating a second line.
  - A new line takes the item's group as its need.
  - `Done` closes the sheet.

### A1 money sheet (bottom sheet)

- Same scrim and sheet chrome as the picker, max-height 88%, `16px`, gap 16. Header `Money` (display 18/600) with a `Close` text button on the right.
- **"On her quote" box** (`14px`, 1px `--line`, **3px top border in the customer `--bg` `oklch(0.19 0.012 260)`**, radius 10, gap 10):
  - Micro label `On her quote` in `--fg`.
  - `Devices · from the catalogue` with the value in a **dashed** mono 14 box (`8px 10px`, 1px dashed `--fg-3`, radius 8). It's read-only.
  - `Labour · your judgement`: a numeric input, 130px wide, right-aligned, mono 16, min-height 44, **solid** 1px `--fg-3`. It's **empty until he types it** (placeholder `Type it`); never prefill 0.
  - `Materials charge` with a sub-label: a numeric input styled like Labour.
    - When he hasn't typed: the **dashed** border, the supplied derived figure as placeholder, and the sub-label `from your estimate · type to override`.
    - Once he types: solid, and the sub-label `set by you`.
    - Clearing the field returns it to derived.
  - `Itemise her view · only if she insists`: a switch, 48×28 pill with a 22px knob in `--bg`. Track `--action` when on, `--line` when off; the knob slides left to right.
- **"Yours only" box** (same box, **3px top border `--band`**):
  - Micro label `Yours only · never on her quote` in `--risk`.
  - `Misc cost estimate` with the sub-label `cable, trunking, fuel`: numeric input, solid **1px `--risk`** border, focus outline `--risk`.
  - `Device cost`, with mono 14 `--fg-2` read-only.
- **Two figure cards** in a 2-column grid, gap 10. Each is `14px`, `--bg`, radius 10:
  - `Expected profit`: 1px `--risk` border, micro label in `--risk`, mono 24/500 value, 12px `--fg-2` `on <proposed> proposed`.
  - `Floor`: 1px `--line` border, mono 24/500 value, 12px `--fg-2` `below this you lose money`.
- Editing any field updates the money bar live (with supplied recomputed values).

## A1: Phone, her view

The whole screen uses `.audience-customer` tokens. There's no band, no header chrome and no cost anywhere.
- **Scroll column** (`48px 24px 24px`, gap 28):
  - Mono 12 `.12em` uppercase `--fg-2` `Quote · <date>`.
  - Display 32/600 `For the <surname> home`, with `-0.02em` tracking and 1.1 line height.
  - 15px `--fg-2` `<level>, adjusted to your house · <n> rooms`.
- **One row per need that has lines**, then `Installation` (labour) and `Materials`:
  - Row: `16px 0`, 1px `--line` bottom.
  - Display 20/500 label on the left, mono 20 total on the right.
  - **Itemised on:** under each need, 14px `--fg-2` rows `<qty> × <item> · <room>`, with the mono line total on the right.
- **Total:** `16px` top padding, **2px `--fg` top border**. Display 22/600 `Total` and mono 30/500 `GH₵ <proposed>`.
- **Hold pill**, pinned under the scroll and centred (`12px 24px 24px`):
  - 200px wide, min-height 48, radius 999.
  - `--surface` bg, 1px `--line` border, 13px `--fg-2` label `Hold to go back`.
  - The fill bar is `--line`, growing from the left.
  - Disable text selection and touch scrolling on the pill.

---

## A2: Laptop, his view (1440 × 900)

From the top:
- the mode band (`0 24px`)
- the app bar (`--fg`, `12px 24px`): `Smart Home Ops` in display 15/600, and save state in mono 11 on the right (`saved · <time>`, or `no signal · held on this laptop` in `--band`)
- the module tabs, with `Quotes` active (2px `--action` underline)
- the body: `grid-template-columns: 220px minmax(0,1fr) 320px`, filling the rest of the height. Each column scrolls on its own.

**Left rail** (`20px 12px`, 1px `--line` right, gap 4):
- `Quotes ›` 13px `--fg-2`, then display 20/600 `<Surname> — <area>`, then mono 11 `Quote <no> · draft · <level>`.
- The **By room / By need** segmented control (the A1 control at 13/600, `7px 0`).
- Micro label `Rooms · from the house`.
- **Room buttons** (`10px 12px`, radius `0 8px 8px 0`, a 2px left border):
  - name 14px, over mono 11 `--fg-2` `<n> lines` or `empty`; mono 12 room total (or `—`) on the right
  - active: `--surface` bg, `--action` left border, name 600
  - hover: `--surface`
  - clicking a room selects it **and** switches to By room

**Centre, by room:**
- **Room header** (`20px 24px 14px`, 1px `--line` bottom):
  - display 22/600 room name with mono 12 `--fg-2` `<n> lines · <room total>`
  - on the right, the dashed off toggle (`6px 10px`, mono 12)
- **Type-ahead add field** (flex 1): 15px, `11px 14px`, 1px `--line`, radius 8.
  - Placeholder: `Add to <room> — type a name or keyword, Enter adds the top match`.
  - Focus: 2px `--action` outline and an `--action` border.
  - After an add, a mono 12 `--action` `✓ Added <item> → <room>` sits beside it (the same 1.8s toast).
- **Results dropdown** (shown while the field has text): absolute under the field, `left/right 24px`, max-height 360 with scroll, `--bg`, 1px `--line`, radius 10, `--elev-2`.
  - Rows use `grid-template-columns: minmax(0,1fr) 110px 150px 90px 90px`, gap 12, `10px 14px`, 1px `--divider` bottom, hover `--surface`.
  - Columns: name 14/500, mono 11 group, mono 11 stock (`<n> held` in `--fg-2`, or `not held · <d> d lead` in `--risk`), mono 13 sell price, mono 12 `--risk` cost.
  - **No match:** `Nothing in the catalogue matches. Add it there first; it isn't created from a quote.`
- **Keyboard:**
  - Enter adds the **top** match to the active room and keeps the query and focus, so Enter again adds another.
  - Esc clears the field.
  - Clicking a result adds it.
  - Adding an item already in the room adds 1 to its line.
- **Line table:**
  - Header row (sticky, `--surface`, `10px 24px`, micro labels): `Item · Need · Qty · Total · Cost · owner (in --risk) · Note`, plus an unlabelled action column.
  - Every row uses `grid-template-columns: minmax(200px,2fr) 120px 120px 96px 80px minmax(0,1fr) 84px; gap: 12px; padding: 10px 24px`, with a 1px `--divider` bottom.
  - **Item:** name 14/500, plus the stock warning as in A1 (mono 11 `--risk`).
  - **Need:** a native select listing the eight needs. Mono 12, `6px 8px`, radius 8. **1px dashed `--fg-3`** while it's the item's group default, **solid** once he changes it.
  - **Qty:** stepper with 1px `--line`, radius 8, 36×34 buttons on `--surface`, and a 40px mono 14 value. The minimum is 1.
  - **Total:** mono 14 line total, with mono 11 `--fg-2` `@ <unit>` under it.
  - **Cost:** mono 13 `--fg-2`.
  - **Note:** inline input, 13px, transparent with no border until hover (1px `--line`). Focus: 2px `--action` outline and `--bg` background. Placeholder `—`.
  - **Switch off:** 12/500 `--fg-2`, 1px `--line`, radius 8, `6px 8px`; hover border `--fg-3`.
  - **Switched-off rows** (while the toggle is on): `10px 24px`, 1px dashed `--line` bottom, `--fg-3`. Name struck through, mono 11 `×<qty> · off since <date>`, and a `Switch on` button (12/500 `--action`, 1px `--line`).
  - **Empty room:** `Nothing in <room> yet. Start typing above.`

**Centre, by need** (read-only, `20px 24px`, gap 16):
- Intro line, 14px `--fg-2`: `The same lines grouped by need: a sanity check, not an editor. Pick a room on the left to edit.`
- One card per need: 1px `--line`, radius 10.
  - Header: `--surface`, `10px 16px`. Display 16/600 name, mono 12 `· <n> points`, and the total on the right.
  - Rows use `grid-template-columns: minmax(0,1fr) 200px 100px 100px`, `9px 16px`: name, mono 12 meta `×<qty> · <room>`, mono total, and mono 12 cost.

**Right rail** (`20px`, `--surface`, 1px `--line` left, gap 16, scrolls):
- The **"On her quote"** and **"Yours only"** boxes as in the A1 money sheet:
  - The boxes are `16px`, `--bg`, 1px `--line`, radius 10, with the same 3px top edges.
  - Inputs are 120px, mono 14, `8px 10px`. The itemise switch is 44×26 with a 20px knob.
- Expected profit and floor sit at the bottom of the "Yours only" box: a 2-column grid above a 1px `--divider`, mono 22/500 values, and the `Expected profit` label in `--risk`.
- **Send card** (pinned to the bottom of the rail with `margin-top: auto`; `16px`, `--bg`, 1px `--line`, radius 10, gap 12):
  - Micro label `Proposed` with mono 26/500 `GH₵ <proposed>`.
  - When labour is empty: 12px `--risk` `Labour not set. Sending will be refused until you type it.`
  - A 2-column grid of buttons, each `12px 0`, display 15/600, radius 8:
    - `Mark sent`: secondary, `--bg` with a 1px `--line` border. **Out of scope:** stub its action.
    - `Show her`: customer `--bg` with customer `--fg` text, no border.

## A2: Laptop, her view

`.audience-customer` across the whole 1440 × 900 frame. There's no band, app bar or tabs.
- The content column is **760px**, centred and scrollable, `72px 0 32px`, gap 36.
- Type is scaled up for reading across a table:
  - eyebrow: mono 13 `--fg-2`
  - title: display **48**/600, `-0.02em`
  - subline: 18px `--fg-2`
  - need rows: `20px 0`, display **28**/500 label, mono **28** total
  - itemised lines: 17px `--fg-2`
  - total row: `20px` top padding, 2px `--fg` top border, display **32**/600 `Total`, mono **44**/500 amount
- **Hold pill**, centred at the bottom (`16px 24px 32px`): 220px wide, min-height 44, `--surface`, 1px `--line`, 13px `--fg-2`. The same 900ms hold behaviour; a trackpad click can't flip it back.

---

## Interactions & behaviour

**Hover / focus / press:**
- Inputs on focus: `outline: 2px solid --action; outline-offset: -1px`. The Misc cost input uses `--risk`. Never remove an outline without replacing it.
- Primary buttons: hover `--action-hover`, active `translateY(1px)`.
- Secondary buttons and chips: hover border `--fg-3`.
- Phone press: bg `--surface` on rows and chips, `--match-highlight` on picker results.
- Laptop room buttons and dropdown rows: hover `--surface`.
- Links: underline on hover.
- Transitions: `--motion` on colour and background only. Sheets open with `--motion-sheet`. The mode switch is **instant** (no cross-fade, so there's never a frame that mixes the two views).

**Keyboard (laptop):**
- The add field: Enter adds the top match, Esc clears.
- Tab order: add field → line rows (need select → qty buttons → note → switch off) → right rail.
- In her view the hold pill is reachable with Tab and needs Space **held** for 900ms. Releasing early cancels.

**Edits are kept as he makes them.** There's no save button. The header or app bar shows the save state.

**Offline (phone):** nothing blocks or waits. Adds and edits show straight away, and the header shows `no signal · held on phone` with the `--risk` dot.

**Responsive:** below ~900px use A1, at ~900px and above use A2. There is no third layout.

**Loading:** render the header, room chips and rail, and the money bar frame straight away. Use skeleton rows (`--surface` at real heights) for the lines. No full-page spinner.

## What the UI needs to render

Fields only. This is not a data model.

- **Quote header:** customer surname, area, quote number, status, level label, save state.
- **Rooms** (from the house): name, line count, room total.
- **Per line:**
  - item name, quantity, need, and the item's group default need
  - note
  - line total, unit price and line cost
  - stock held and lead days (short or not held), as supplied
  - switched-off flag and date
- **Picker / type-ahead results:** name, group, held count or lead days, sell price, cost.
- **Money:**
  - device total and device cost
  - labour (empty or a value)
  - materials: the derived figure, his override (empty or a value) and a derived/overridden flag
  - misc cost estimate
  - proposed, expected profit and floor
- **Her view** (customer-safe data only): date, surname, level, room count, need group totals, labour, materials, total. When itemised: per-line qty, name, room and total. **No cost field may exist in her view's data.**

## Copy

Use the exact strings in the reference.
- The eight needs are fixed and lowercase: `lighting, switching, security, climate, power, networking, sensors, control`. Her view capitalises them.
- Money is shown as `GH₵ 7,952` for totals, and two-decimal figures (`373.00`) on lines.

## Files

- `A_quote_builder.dc.html`: live reference. Section A only; the notes cards are documentation.
- `support.js`: runtime for the reference. Don't ship it.
- `tokens.css`: design tokens, including the audience mode extension.

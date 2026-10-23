# Handoff: Starting a quote (Smart Home Ops, modules 3 + 4 · quotes & jobs, block G)

## Overview

This handoff covers the journey **from the quote list to the quote builder page**:

**Quote list (D, already built) → "+ New quote" → who's it for → which house → draft created → quote builder (A)**

The quote list already exists in the codebase. **Don't rebuild or restyle it.** The only change to it: "+ New quote" currently jumps straight to the builder. It must open G instead, over the list, which stays where it is underneath.

Owner-only.

- **G1, phone (390):** a bottom sheet over the quote list. Its content swaps in place between two steps: "Who's it for?" and "Which house?".
- **G2, laptop (1440):** one dialog over the quote list. Customers are on the left and that customer's houses are on the right.

**In scope:**
- G1 and G2.
- Rewiring the existing "+ New quote" button on D (phone and laptop) to open them.
- The hand-off into the builder (A) once the draft is created.
**Out of scope:** A, B, C, D, E and the Customers module screens. They appear only as link targets.
**Not included:** the level step. The draft is created with the default level (`custom`).

**Scope: UI and UX only.** The UI displays supplied values and doesn't compute them:
- the customer list, in recent-first order
- each customer's name and phone
- each customer's houses with their area and room count
- search results
- the new draft's id, returned when the draft is created

## About the design files

- `G_new_quote.dc.html` is the **live reference**. Open it in a browser with `support.js` beside it. Only **section G** is in scope; the other sections are context.
- `New_Quote_Journey.dc.html` is the journey map. It shows where G sits in the full flow.
- **The notes cards beside the frames are documentation. Do not build them.**
- In the reference, the "Prototype only" panel that appears after picking a house is a **stand-in**. In the build, picking a house navigates straight to A.
- `tokens.css` is authoritative (it's the same file used by the A, B and D handoffs).

## Fidelity

**High-fidelity.** Colours, type, spacing, radii and copy are final.

---

## Entry points

1. **The existing quote list (D1 phone, D2 laptop):** "+ New quote" opens G on step 1, over the list. **Change only the button's action.** The list's layout, tabs and search stay untouched. On cancel he's back on the list exactly as he left it (same tab, same search).
2. **Customer detail (Customers F):** "New quote" opens G with the customer already picked. On phone it opens on step 2; on laptop it opens with the left column selected.
   - If that customer has exactly one house with rooms, skip G and go straight to A.

## G1: phone

The quote list stays rendered behind, under a scrim (`--fg` at 25%). Tapping the scrim closes the sheet.

**Sheet**
- Pinned to the bottom, full width, max-height 640px.
- `--bg` background, 1px `--line` top border, radius `10px 10px 0 0`, padding `8px 0 20px`.
- Grabber: 36×4, `--line`, radius 2.
- The amber mode band stays visible above the scrim.

**Step 1: Who's it for?**
- **Header row:** the title `Who's it for?` (display 20/600) on the left. On the right, a `Cancel` text button: 14/500, `--fg-2`, min-height 44.
- **Search input** (focused on open):
  - min-height 48, 16px text, 1px `--action` border plus a 2px `--action` outline at offset -1, radius 8, `0 14px` padding.
  - Placeholder: `Name, phone or area`.
- **List label:** `RECENT` when the search is empty, `MATCHES` while typing. Mono 10, tracking 0.14em, `--fg-2`.
- **Customer rows** (scrolling list, top border `--line`):
  - min-height 60, padding `10px 16px`, divider `oklch(0.94 0.003 250)`.
  - Left side: the name (16/600) and the phone below it (mono 12, `--fg-2`).
  - Right side: mono 11 `--fg-2` meta text. It reads `no house yet` (no houses), the area (one house), or `<n> houses` (more than one).
- **No match:** `No customer matches "<query>". Add her below.` (14px, `--fg-2`).
- **Footer:** an outlined `+ New customer` button. min-height 48, 15/500 `--action` text, 1px `--line` border, radius 8. It goes to the Customers quick-add screen (Customers D3). After she's saved, he comes back with her already picked.

**When he taps a customer**
- She has exactly one house and it has rooms: the draft is created and the app goes to A. Step 2 is skipped.
- Otherwise: the sheet shows step 2 (the content swaps; there's no second sheet).

**Step 2: Which house?**
- `‹ <Customer>` back link: 14/500 `--action`, min-height 44. It returns to step 1 and keeps the search text.
- The title `Which house?` (display 20/600), with the sub-line `The quote's rooms come from the house.` (14px, `--fg-2`).
- **House row, with rooms:**
  - min-height 60, area name 16/600.
  - Right side: `<n> rooms` (mono 12, `--fg-2`) and a `›` in `--action`.
  - Tapping it creates the draft and opens A.
- **House row, no rooms:**
  - Not tappable. The area is 16/600 `--fg-2`, with `no rooms yet · can't quote` below it (mono 12).
  - Right side: an outlined `Add rooms ›` button (min-height 44). It goes to the visit and rooms screens (Customers A + B).
- **Customer with no houses:** `<Name> has no house yet. Add it and walk the rooms first.`
- **Footer:** an outlined `+ New house` button, styled like `+ New customer`.

## G2: laptop

**Dialog**
- 800×560, centred horizontally, 96px from the top.
- `--bg` background, 1px `--line` border, radius 10, shadow `0 10px 30px oklch(0.21 0.01 260 / 0.16)`.
- Behind it: a scrim over the quote list.
- It closes on Esc, on `Cancel`, or on a click outside.

**Header**
- `New quote` (display 20/600) on the left.
- On the right: an `Esc` key hint (mono 11, 1px `--line` border, radius 4) followed by `Cancel`.
- 1px `--line` bottom border.

**Body:** two equal columns with a 1px `--line` divider.
- **Left, `1 · Who's it for?` (14/600):**
  - Search: 14px text, `9px 12px` padding, focused on open.
  - `RECENT` / `MATCHES` label, then the customer list, scrolling.
  - Rows are styled like phone. The picked customer's row gets a `--surface` background and a 600 weight.
  - Footer: a `+ New customer` text link, top border `--line`.
- **Right, `2 · Which house?`:**
  - No customer picked yet: `--surface` background, title in `--fg-3`, and the sub-line `Pick a customer on the left first.`
  - Customer picked: `--bg` background, and the sub-line `<Name>. The quote's rooms come from the house.`
  - The house rows follow the same rules as phone. Below them, a `+ New house` text link.

**Changing customer** is one click on the left; the right column updates.

**Keyboard**
- Type in the search box.
- ↑ ↓ move through the customers; Enter picks one and moves focus to the houses.
- ↑ ↓ then Enter on a house creates the draft.
- Unlike phone, a customer with one house doesn't skip the house column on laptop: both columns are visible, so it's one extra click.

## On create

- Picking a house with rooms creates an empty draft against that house, with the level left at the default.
- Navigate to A (`A1` on phone, `A2` on laptop) on the house's first room.
- The new quote shows under D's Drafts.
- Until he picks a house, nothing is saved. Cancel leaves no trace.

## Interactions & behaviour

- Sheet and dialog in/out use `--motion-sheet`; the step swap uses `--motion`.
- Row hover (laptop) and active (phone) use a `--surface` background.
- Inputs on focus: `outline: 2px solid --action; outline-offset: -1px`.
- Hit targets ≥ 44px on phone.
- **Offline:** the list can show cached recent customers, but creating the draft needs a connection. Show the A-style `no signal` and disable house rows (not drawn; confirm the wording).
- **Draft creation fails:** keep the sheet or dialog open on the house step, with an inline error under the list (not drawn).

## Open (decide before build)

1. **No-rooms houses block the quote.** This is *assumed*, not yet confirmed by the owner. The alternative: allow the quote and add rooms later in A.
2. **Phone entry from a customer.** Customer detail (Customers F) is laptop-only so far.
3. **Wording** for offline and draft-creation failure.

## API notes

- Creating the draft: a `POST` with the customer and house returns the quote id. `level_label` is left at its default.
- **C1 (gap report):** quote detail lacks the customer name and house label, and A's header needs both. Pass them along from G, or fix the endpoint.
- The customer search and recent-first ordering need an endpoint that returns houses with room counts. Confirm one exists.

## Copy

Use the exact strings above and in the reference.

## Files

- `G_new_quote.dc.html`: the live reference (section G only).
- `New_Quote_Journey.dc.html`: the flow map, for context.
- `support.js`: the runtime for the references. Don't ship it.
- `tokens.css`: the design tokens.

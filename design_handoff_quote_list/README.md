# Handoff: Quote list (Smart Home Ops, modules 3 + 4 · quotes & jobs, block D)

## Overview

Block D is the quote list. He opens it to answer one question: **who do I chase?** Then he finds a quote by name, area or number. It's owner-only.

- **D1, phone (390):** three tabs (Waiting, Drafts, Answered) with search.
- **D2, laptop (1440):** the same three states shown as three columns side by side, with one search across all of them.

A (quote builder), B (proposed vs agreed), C (job recording) and E (job list) are **out of scope**. They appear only as link targets.

**Scope: UI and UX only.** Build the layouts, states and interaction behaviour described here. This handoff does not specify how quotes are fetched, sorted, filtered by date or searched on the server. Where it says a value is **supplied**, the UI displays it and does not compute it.

Supplied values include:
- each quote's status, number, level label and optional title
- the customer surname and house area (see gap C10)
- days waiting (sent quotes)
- the "edited … ago" text (drafts)
- the accepted or declined date, the declined reason and the linked job number
- the tab counts
- the row order within each state
- which answered quotes are recent enough to show

**No amounts appear anywhere on this list** (gap report B1). The amount is one tap in.

## About the design files

- `D_quote_list.dc.html` is the **live, clickable reference**. Open it in a browser (it needs `support.js` beside it). Only **section D** is in scope; ignore the other blocks.
- **The notes cards beside the frames are documentation. Do not build them.**
- `tokens.css` holds the design tokens and is authoritative. It's the same file as the quote builder handoff.

## Fidelity

**High-fidelity.** Colours, type, spacing, radii and copy are final. Match metrics exactly.

---

## Shared: the quote row

Both layouts use the same row content. Only the container differs (D1 is a flat list, D2 uses cards).

**Left column** (gap 3, `min-width: 0`):
1. **Name:** `<Surname> — <area>`, 16/600 on the phone, 15/600 on the laptop.
2. **Sub:** mono 11 `--fg-2`, `Quote <no> · <level label>`, with ` · <title>` appended when he has set one.
3. **Declined reason**, only if he wrote one: 13px italic `--fg-2`, `"<reason>"`. Show nothing when the reason is empty, not even a placeholder.
4. **Action hint** (sent and accepted only): 13/500 `--action`, 2px top padding.
   - Sent: `Record her answer ›`
   - Accepted: `Job <no> ›`

**Right column** (right-aligned, gap 2, `flex: none`), one of:
- **Sent:** the days-waiting number in mono 24/500 (22 on the laptop), line-height 1, tabular figures. Under it, a mono 10 `.08em` uppercase `--fg-2` label: `day waiting` when it's 1, otherwise `days waiting`. **No colour change for "late".** When to chase is his call.
- **Draft:** mono 12 `--fg-2`, `edited <time> ago`.
- **Accepted:** a chip `accepted <date>`: mono 11, `3px 7px`, radius 6, 1px `--action` border, `--action` text, transparent background, no wrap.
- **Declined:** the same chip, reading `declined <date>`, with a 1px `--line` border and `--fg-2` text.

**Where a row goes when tapped:**
- sent: opens **B**, "What did she agree to?"
- draft: opens **A**, the quote builder
- accepted: opens the linked job (**C**)
- declined: opens the quote read-only (out of scope; stub it)

The whole row is the hit target. There are no separate buttons inside it.

---

## D1: Phone (390 × 844)

The column from top to bottom: mode band, header, search, tabs, tab hint, scroll list.

**Mode band** (32px): the same as A. Fill `--band`, text `--fg`, mono 11/600, `.14em`, uppercase. It reads `His view · owner only` on the left and `Owner` on the right. It's always on. There's **no "Show her"** on this screen, because the list has other customers' names on it.

**Header** (`14px 16px 12px`, space-between):
- `Quotes` in display 24/600.
- `+ New quote`, the primary button: min-height 44, `0 16px`, display 15/600, `--action` background, `--bg` text, radius 8. It opens A with a new draft.

**Search** (`0 16px 12px`):
- Full width, min-height 48, 16px, `--bg`, 1px `--line`, radius 8, `0 14px`.
- Placeholder `Name, area or number`.
- Focus: 2px `--action` outline at offset -1.
- It filters the **current tab only**, as he types.

**Tabs** (a segmented control, margin `0 16px`):
- Track: `--surface`, 1px `--line`, radius 8, padding 3.
- Three equal segments: min-height 44, 14/600, radius 6, `<label> <count>` with the count in mono 12/500.
- Active: `--bg` with `--fg` text. Inactive: transparent with `--fg-2` text.
- Order: **Waiting · Drafts · Answered**. It **opens on Waiting**.

**Tab hint** (`10px 16px 12px`, 13px/1.45 `--fg-2`). One line per tab:
- Waiting: `Sent, no answer yet. Oldest first, so the top one is the one to chase.`
- Drafts: `Not sent yet. Last edited first.`
- Answered: `Last 30 days. Accepted quotes lead to their job.`

**Scroll list** (flex 1, scrolls, 1px `--line` top):
- Rows: `14px 16px`, min-height 64, 1px `--divider` bottom. Pressed background `--surface`.
- **Empty with a search:** `No <tab> quote matches "<query>".` (tab in lowercase), `24px 16px`, 14px `--fg-2`.
- **Empty with no search:** `Nothing here.` The full catalogue of empty states is still pending with catalogue E; this placeholder copy is temporary.

## D2: Laptop (1440)

From the top:
- the app bar (`--fg`, `12px 24px`): `Smart Home Ops` in display 15/600, and today's date in mono 11 on the right
- the module tabs, with `Quotes` active (2px `--action` underline) and `Jobs` linking to E
- the body (`24px 32px 32px`, gap 20)

**Title row** (space-between, aligned to the bottom):
- Left: `Quotes` in display 22/600, over a mono 12 `--fg-2` summary: `<n> waiting on her · oldest sent <d> days ago` (both values supplied).
- Right (gap 10):
  - search, 300px wide, 14px, `9px 12px`, 1px `--line`, radius 8, placeholder `Name, area or number`
  - `+ New quote`, primary, display 14/600, `9px 16px`, radius 8

**Three columns** (`grid-template-columns: repeat(3, minmax(0,1fr))`, gap 24, aligned to the top). From left to right in the order he acts on them: **Waiting on her · Drafts · Answered**.
- **Column:** `16px`, `--surface`, 1px `--line`, radius 10, gap 10.
- **Column header** (`0 2px 6px`, gap 2):
  - display 17/600 label with the mono 12 `--fg-2` count beside it
  - 12px `--fg-2` hint, the same copy as the D1 tab hints
- **Row card:** `14px 16px`, `--bg`, 1px `--line`, radius 10. Hover: border `--action`. It uses the shared row content.
- **Search filters all three columns at once.** The header counts stay at the unfiltered totals.
- **A column with no match:** `Nothing matches "<query>".` 13px `--fg-2`, `14px 2px`. The column itself stays in place.
- Each column grows with its content. The page scrolls; columns don't scroll on their own.

---

## Interactions & behaviour

**Hover / focus / press:**
- Inputs on focus: `outline: 2px solid --action; outline-offset: -1px`.
- Primary buttons: hover `--action-hover`, active `translateY(1px)`.
- Laptop row cards: hover border `--action`. Phone rows: pressed background `--surface`.
- Transitions: `--motion` on colour, border and background only.

**Keyboard (laptop):** each row card is a link, so it's reachable with Tab and opens with Enter. Tab order: search → `+ New quote` → the Waiting column → Drafts → Answered.

**Responsive:** below ~900px use D1, at ~900px and above use D2. There is no third layout.

**Loading:** render the band, header, search and tabs (or the column headers) straight away. Use skeleton rows at real height (64px on the phone, about 80px cards on the laptop) in `--surface`. No full-page spinner.

**Offline (phone):** the last loaded list stays on screen. Show the same mono 11 `--risk` dot and `no signal` text as A, placed in the header beside `Quotes`.

## What the UI needs to render

Fields only. This is not a data model.

- **Per quote:** id/number, status, customer surname, house area, level label, title (optional), and the one item that fits its status:
  - sent: days waiting
  - draft: edited text
  - accepted: date and job number
  - declined: date and reason (optional)
- **Per tab or column:** the count.
- **Laptop summary:** the waiting count and the oldest days waiting.

## API notes

- **C10 (gap report):** `GET /quotes` returns `customer_id` and `house_id` only. Every row needs the surname and area. Ask for `customer_name` and `house_label` on the list items.
- **B1 (resolved):** no amount on the list.

## Copy

Use the exact strings in the reference. The level labels are lowercase (`basic, comfortable, premium, luxury, custom`).

## Files

- `D_quote_list.dc.html`: live reference. Section D only; the notes cards are documentation.
- `support.js`: runtime for the reference. Don't ship it.
- `tokens.css`: design tokens.

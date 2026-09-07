# Implementation plan — Catalogue list (module 1 of 7)

Recreating `design_handoff_catalogue_list/A_catalogue_list.html` (frames A1 laptop 1440 and
A2 phone 390) in this codebase. High-fidelity: values come from `tokens.css` and the handoff
README, not from library defaults.

**Out of scope** (do not build): the grey "Decisions" column, item detail, shipment builder,
allocation preview, groups & markup, empty/no-results state, icons, onboarding, tooltips.

## Decisions already made

- **Router:** install `vue-router`. (Answered.)
- **Mock data:** full 214 items — the 9 reference rows verbatim plus generated filler across
  the 8 groups, so search, sort, filter counts and the copy strings are all truthful.
  Every mock gets a `TODO(mock):` marker and a single inventory in `src/data/`. (Answered.)
- **SText additions:** review each new role individually, not as a batch. (Answered — the
  roles are listed under Task 4.)

## How to use this file

Each task lists the files it touches and the **open questions** that must be settled before it
is written. Ask me to implement a task; I ask that task's questions first, then build it.
Tasks are in dependency order. Tick them off as they land.

---

## Task 0 — Scaffolding: router + design tokens

- [ ] Install `vue-router`; add `src/router/index.ts`; wire `main.ts` and `App.vue` to `<RouterView />`
- [ ] Add the tokens the screen needs to `@theme` in `src/style.css`

Tokens to add — all named in `tokens.css` or the README, none invented:

| Token | Value | Used by |
|---|---|---|
| `--radius-md` | `8px` | search inputs, group select, primary buttons |
| `--color-row-hover` | `oklch(0.97 0.003 250)` | table row hover |
| `--color-row-hover-risk` | `oklch(0.97 0.012 45)` | low-stock row hover |
| `--color-row-risk-tint` | `oklch(0.985 0.008 45)` | low-stock row background |
| `--color-row-action-tint` | `oklch(0.985 0.008 255)` | (in tokens.css; unused on this screen) |
| `--color-match-highlight` | `oklch(0.90 0.05 255)` | search match background |
| `--color-field-dark` | `oklch(0.28 0.012 260)` | phone search field background |
| `--color-field-dark-line` | `oklch(0.4 0.01 260)` | phone search field border |
| `--color-micro` | `oklch(0.5 0.01 260)` | micro labels, the `/ 6` in low-stock, footer |

**Open questions**

- **Q0.1 — Route shape.** The in-scope screen is one route. Tabs (Shipments, Groups & markup),
  row click (item detail) and "Log a shipment" (shipment builder) all point at out-of-scope
  destinations. Do I register placeholder routes for them so the links are real, or leave them
  as typed no-op handlers and register only `/` plus `/design-system`?
- **Q0.2 — `--color-micro` naming.** `oklch(0.5 0.01 260)` is a genuine third neutral between
  `--fg-2` (0.40) and `--fg-3` (0.58) that `tokens.css` never names, but the README specifies
  it literally twice. Is `--color-micro` the right name, or should it be `--color-fg-2-5` /
  something else?
- **Q0.3 — The 0.82 vs 0.80 conflict.** `style.css` has `--color-muted-dark: oklch(0.82 0.006 250)`;
  `tokens.css` has `--fg-on-dark-2: oklch(0.80 0.006 250)` and the reference uses `0.8`. Change
  the existing token to 0.80, or add a second one and leave `muted-dark` alone? CLAUDE.md
  documents `muted-dark`, so changing it touches the documented system.

---

## Task 1 — Domain types and integer money

- [ ] `src/types/catalogue.ts` — `Item`, `ItemColumn`, `Group`, `Summary`, derived predicates
- [ ] `src/lib/money.ts` — integer-pesewa arithmetic and display formatters

This is where hard rules 1–4 are encoded:

1. **Money is never a float.** `landedCostMinor` / `sellingPriceMinor` are integers. All
   arithmetic integer; `lib/money.ts` rounds only at format. `GH₵ 248.60` is `24860`.
2. **Nothing is deleted.** `archivedAt: string | null`; excluded from this list by default.
   No delete path exists anywhere in the types.
3. **Stock is never overwritten.** `stockOnHand` typed read-only, with a comment naming
   movement records as its only source. This screen reads it.
4. **Selling price is derived** — `landedCost × group markup` unless `priceIsOverridden`.
   Both the price and *which rule produced it* are derived, not stored.

Derived, not stored: `marginPct`, `isLowStock = stockOnHand <= reorderLevel`,
`needsAttention = !name || !group || !supplierLink`.

**Open questions**

- **Q1.1 — Group markup values.** Rule 4 needs a markup per group to derive selling price, but
  the README never gives the eight numbers (that's the Groups & markup module). Do I mock a
  markup table (`TODO(mock):`), or store `sellingPriceMinor` on the fixture items and treat the
  derivation as a pure function I wire up but don't feed real rates?
- **Q1.2 — Margin rounding.** Reference shows integer percents (33%, 37%, 39%, 38%). From
  integer pesewas: floor, round-half-up, or round-half-even? Reference rows are ambiguous
  between them, so this needs a call.
- **Q1.3 — Read-only strictness.** `readonly` on the field (compile-time only) or a branded
  type / accessor that makes assignment genuinely impossible? The latter is more faithful to
  "never overwritten" but heavier for a screen that only reads.

---

## Task 2 — Mock catalogue data (214 items)

- [ ] `src/data/catalogueFixtures.ts` — 9 reference items verbatim + filler to 214
- [ ] `TODO(mock):` on every mock export, plus one inventory comment block listing them all

The 9 verbatim rows: 6 laptop table rows (Tuya no-neutral switch / RGB bulb E27 9W /
Door sensor battery / Relay module 2 channel / Untitled item / CCTV camera 3MP outdoor) and
3 phone rows (Tuya no-neutral switch / Relay module 2 ch no neutral / Dimmer module no-neutral).

**Open questions**

- **Q2.1 — Summary figures: computed or pinned?** The reference states `GH₵ 21,304`,
  `GH₵ 33,890`, `4 items`, `187 units`, `longest lead time 21 days`. If the summary is computed
  from 214 fixture items those numbers won't match unless I reverse-engineer the filler to hit
  them exactly. Options: (a) compute honestly and let the figures differ from the reference,
  (b) reverse-engineer filler costs/stock so the computed totals land on the reference numbers,
  (c) hardcode the summary as mock and compute nothing. (b) is the only one that is both
  pixel-faithful and internally consistent, and it is the most work.
- **Q2.2 — Are the 9 reference rows pinned?** Under default sort (name ascending) the reference
  rows scatter into the 214 and the first screen won't look like the reference. Pin them to the
  top under default sort, name the filler so they sort into the first page naturally, or accept
  that the default view differs from the reference?
- **Q2.3 — Keyword coverage.** Search matches name + keywords, and the phone frame demonstrates
  a keyword hit on `"neut"`. Do all 214 items get plausible keyword arrays, or only the ones
  that need to demonstrate the behaviour?

---

## Task 3 — `useCatalogue` composable

- [ ] `src/composables/useCatalogue.ts`

State exactly as the README specifies: `query`, `groupFilter`, `flagFilters`, `sort`, `items`,
`summary`, `connection`. Client-side filter + sort, 150ms debounce on search, matches against
name + keywords, group filter ANDs with flag filters.

**Open questions**

- **Q3.1 — Offline state.** "Reads come from local cache first"; the app bar flips to
  "No connection — showing last known counts" in `--risk`. Drive `connection` off
  `navigator.onLine` + online/offline events, or expose a manual toggle so the state is
  demonstrable without pulling the network down?
- **Q3.2 — Loading state.** Skeleton rows are specified, but with local fixtures there is
  nothing to wait for. Add an artificial initial delay so skeletons are actually visible, or
  build the skeleton branch and leave it unreachable until a real data source exists?
- **Q3.3 — Session persistence.** "Persist the last selection for the session only" — is
  `sessionStorage` the intended mechanism, or in-memory for the app's lifetime (lost on reload)?
- **Q3.4 — Sort tie-breaks.** Two items with equal stock/price: fall back to name ascending, or
  leave the sort unstable? And where do the null/missing values sort (the `Untitled item` row
  has no group, no markup, no lead time)?

---

## Task 4 — `SText`: new type roles

- [ ] Add the approved roles to `src/components/atoms/SText.vue`
- [ ] Update the CLAUDE.md type-scale table and the `DesignSystemView` showcase to match

Three existing roles survive contact with this screen: `ui` (14/500) for laptop row names,
`money` (13/400 tabular) for Stock/Landed/Sell/Margin, and `micro` — except `micro` hardcodes
`0.16em` and this screen needs `0.14em` (summary labels) and `0.10em` (table headers).

Candidate roles, in descending order of reuse. **Per the answer, these get reviewed one at a
time, not approved as a batch:**

| # | Role | Spec | Sites | Where |
|---|---|---|---|---|
| 1 | `mono-sm` | Mono 400 · 11px · tabular | 7 | app bar status, row Group, row Lead, footer, phone item count, phone cost, phone match count |
| 2 | `caption` | Sans 400 · 12px · fg-2 | 4 | three summary captions + draft-shipment link |
| 3 | `figure` | Mono 500 · 24px · tabular | 3 | the three summary figures |
| 4 | `money-md` | Mono 500 · 16px · tabular | 3 | phone selling price |
| 5 | `mono-md` | Mono 400 · 12px | 3 | phone meta line (all three row states) |
| 6 | `ui-sm` | Sans 500 · 13px | 3 | tab labels |
| 7 | `body-strong` | Sans 500 · 15px | 3 | phone row names |
| 8 | `subtitle` | Space Grotesk 600 · 17px | 1 | phone header "Catalogue" |
| 9 | `wordmark` | Space Grotesk 600 · 15px | 1 | app bar "Smart Home Ops" |

**Open questions**

- **Q4.1 — Roles 1 through 9, one at a time.** For each: add it, or write scoped CSS in the
  catalogue component instead? I'll bring them in the order above and take a decision on each.
- **Q4.2 — Micro tracking: prop or roles?** Either `tracking="label"` (0.14em) /
  `tracking="column"` (0.10em) as a prop on `micro`, or two more roles (`micro-label`,
  `micro-column`). The prop is a modifier on type, which the system doesn't currently do; the
  roles keep it purely role-based at the cost of a longer scale.
- **Q4.3 — A `weight` prop?** Two sites need a weight the role doesn't carry: the low-stock
  stock figure (`money` at 600) and the active tab (`ui-sm` at 600). Prop, or two more roles?
- **Q4.4 — Roles 8 and 9 break a documented rule.** Both are Space Grotesk *below* the README's
  own "18px and above only" floor. The reference uses them, and you asked for the reference
  matched exactly — but adding them writes that contradiction into the design system. Add as-is,
  or hold them as scoped CSS so the violation stays local to this screen?

---

## Task 5 — `SBadge`: the four lowercase row chips

- [ ] Extend `src/components/atoms/SBadge.vue`
- [ ] Update the showcase

Colours already match: `low-stock` → `reorder`, `incomplete` → `no supplier link` and
`no name · no group`, `overridden` → `price overridden`. Only the shape is wrong — SBadge forces
`text-transform: uppercase` but all four chips are **lowercase** in the reference, and its
`3px 8px` / 6px radius should be `3px 6px` / 5px radius.

**Open questions**

- **Q5.1 — Mechanism.** A single `dense` boolean (drops uppercase, drops the 0.1em tracking,
  tightens padding and radius — reuses all four existing colour variants unchanged), or four
  new fully-specified variants, or render these four chips locally in `CatalogueTableRow.vue`
  and leave SBadge untouched?
- **Q5.2 — Is uppercase load-bearing?** SBadge uppercases *every* variant today. If lowercase
  is actually the correct treatment for in-row chips generally, this may be a fix to the atom
  rather than a new mode on it. Worth knowing which reading is right before I pick Q5.1.

---

## Task 6 — The filter chip

- [ ] Build the toggleable chip used by the toolbar and the phone filter row

Mono 11px, `8px 11px`, 6px radius, three treatments: filled risk (`low stock · 4`), outlined
risk (`needs attention · 2`), outlined `--line` with a `▾` (`All groups`). No existing atom is
close — SBadge is the wrong size and isn't interactive. Toggle semantics, and the chip hides
entirely when its count is 0.

**Open questions**

- **Q6.1 — Where does it live?** `atoms/SFilterChip.vue` (CLAUDE.md says new atoms go in
  `atoms/` prefixed `S`, and this will recur across the other six modules), or
  `components/catalogue/FilterChip.vue` until a second module needs it?
- **Q6.2 — Is the group chip the same component?** The two flag chips are toggles; the group
  chip is a single-select that happens to be chip-shaped. One component with three variants, or
  a separate select-as-chip? If they're one, the group chip should still render a native
  `<select>` underneath so keyboard and screen-reader behaviour comes free.
- **Q6.3 — Phone hit targets.** README: "every tappable target on a phone surface is ≥48px".
  The reference phone chips are `9px 11px` on 11px text — roughly 33px tall, well under 48.
  Keep the reference metrics, or meet the 48px rule? These directly contradict each other.

---

## Task 7 — `CostFigure` — hard rule 5

- [ ] `src/components/catalogue/CostFigure.vue`

> "Keep cost rendering in a component you can omit, not a style you toggle."

The only place landed cost and margin render, on **both** viewports: the laptop Landed and
Margin cells, and the phone `cost 248.60` line. Removing its call sites removes cost from the
screen entirely — no style toggle, no `v-if` on a `showCost` flag threaded through the tree.

**Open questions**

- **Q7.1 — Omission mechanism.** "A component you can omit" can mean: (a) call sites you delete
  by hand when building module 3, (b) the component is the *only* importer of the cost fields so
  a build without it fails loudly on any other access, or (c) cost fields are reachable only
  through this component's own API. (b)/(c) enforce the wall at compile time; (a) is a comment
  and a convention. Which level of enforcement do you want now, given module 3 is where the
  wall actually matters?
- **Q7.2 — One component or two?** The laptop renders cost and margin as two separate grid
  cells that must sit in the row's grid; the phone renders `cost 248.60` as one line. One
  component with a `layout` prop, or `CostCells.vue` + `CostLine.vue`?

---

## Task 8 — Laptop frame (A1)

- [ ] App bar — `12px 20px`, bg `--fg`, wordmark left, save/date status right
- [ ] Tab bar — `8px 16px 0`, bg `--surface`, 1px `--line` bottom, active tab 2px `--action` underline
- [ ] Summary strip — `grid-template-columns: repeat(4, minmax(0,1fr)); gap: 1px; background: --line`,
      cells `16px 20px`, fourth cell `--surface`
- [ ] Toolbar — `14px 20px`, search flex 1, two chips, 1px×24px divider, group select
- [ ] Table header — `10px 20px`, bg `--surface`, 7 columns, sort indicator on active column
- [ ] Table rows — `13px 20px`, 1px `--divider` between, grid
      `2.6fr 1fr 0.9fr 1fr 1fr 0.9fr 0.7fr`, gap `14px`, all six states
- [ ] Footer — `12px 20px`, bg `--surface`, 1px `--line` top, count left, "Add one item manually" right

All numbers `--font-mono` with `tabular-nums`, right-aligned. No `GH₵` inside table cells.

**Open questions**

- **Q8.1 — Frame or full-bleed?** The reference draws a fixed 1440px box with `--radius-lg`,
  `--elev-1`, 1px `--line` and `overflow: hidden`, sitting on the `--chrome` page background —
  that's a design canvas convention. Should the real app be a centred `max-width: 1440px` framed
  card (literal fidelity), or full-bleed to the viewport with the frame's chrome dropped
  (what a real back-office tool would do)? This changes the top-level layout.
- **Q8.2 — The third neutral, again.** README's column table says Group, Landed, Sell, Margin
  and Lead are all `--fg-2` (0.40), but the reference renders Group and Lead at
  `oklch(0.45 0.01 260)` — a value in no token file — and only Landed/Margin at 0.40. Follow
  the README (everything `--fg-2`), or the reference (add a 0.45 neutral)? Same question for
  the inactive tab label, summary captions, footer and phone meta, all 0.45 in the reference.
- **Q8.3 — `Untitled item` name colour.** README: "name renders as `Untitled item` in normal
  ink" — so full `--fg`, identical to a real name, with only the chip signalling the problem?
  Confirming, because it reads as a placeholder and the instinct is to grey it.
- **Q8.4 — Sortable columns.** All seven, or only the six with real values? The `Untitled item`
  row has no group, no markup and no lead time, so it needs a defined position under those
  sorts (see Q3.4).
- **Q8.5 — Row semantics.** Whole row is the click target. `<table>` with real
  `<tr>`/`<td>` (semantics, screen-reader column association) or CSS grid `<div>`s (the
  reference's approach, and far easier to hit the exact grid metrics)? A grid can keep semantics
  via ARIA `role="row"`/`role="cell"`; a real table fights the `2.6fr` column spec.

---

## Task 9 — Phone frame (A2)

- [ ] Dark header — bg `--fg`, `14px 16px`, "Catalogue" + item count, search below
      (bg `--color-field-dark`, 1px `--color-field-dark-line`, `--fg-on-dark`, min-height 48px, 15px)
- [ ] Filter row — `12px 16px`, three chips, horizontally scrollable
- [ ] Result rows — `14px 16px`, `min-height: 72px`, two-line left block + right-aligned figure pair
- [ ] Action bar — bg `--surface`, `14px 16px`, match count left, "Log a shipment" right
- [ ] Row states: normal, low stock (`--row-risk-tint`, meta in `--risk`), zero-but-sourceable

No horizontal scroll anywhere. A table row becomes a list row.

**Open questions**

- **Q9.1 — Initial search value.** The reference ships with `"neut"` typed in, because that's
  what demonstrates match highlighting and the "3 of 214 match" string. Start empty (correct
  for a real app) or prefilled (matches the reference frame)?
- **Q9.2 — Match count copy when the query is empty.** The reference only shows the searching
  state: `3 of 214 match "neut"`. What does that slot say with no query — `214 items`, nothing,
  or something else? Not specified, and it's visible on first load.
- **Q9.3 — Keyword-only match display.** "If the match came from a keyword only, the keyword
  appears in the meta line." The meta line is already full
  (`12 in stock · switching · 14 d`). Does the keyword replace a segment, append a fourth, or
  get its own line? Not shown in the reference.
- **Q9.4 — No tab bar or footer on phone.** The README's phone band table lists only four bands,
  so Shipments and Groups & markup are unreachable on phone and there's no "Add one item
  manually". Confirming that's intended rather than an omission from the handoff.

---

## Task 10 — Responsive composition

- [ ] `src/views/CatalogueListView.vue` — phone layout below ~900px, laptop above
- [ ] Summary strip drops to 2×2 below ~1100px, action cell keeps its own row

No third layout. The two frames are the two designs.

**Open questions**

- **Q10.1 — CSS or JS switch?** Media queries render both trees into the DOM (two search inputs,
  duplicated ids, both sets of rows in the accessibility tree) but reflow instantly. `matchMedia`
  renders exactly one tree, which is cleaner, at the cost of a JS dependency for layout. No SSR
  here, so `matchMedia` is viable.
- **Q10.2 — 2×2 at 1100px: which cells pair?** "The action cell keeps its own row" — so is it
  the three figures in a 2×2 with one empty slot and the action full-width beneath, or figures
  1+2 / figure 3 + something? Three figures don't divide into a 2×2 cleanly.

---

## Task 11 — Interactions, states and chrome

- [ ] Table row hover `--color-row-hover`; low-stock rows hover `--color-row-hover-risk`
- [ ] Primary button hover `--action-hover`, active `translateY(1px)`
- [ ] Secondary button hover `--surface`; ghost hover `--surface` + colour → `--fg`
- [ ] Input/select focus: `outline: 2px solid --action; outline-offset: -1px; border-color: --action`;
      risk-state fields focus `--risk`. Never remove an outline without a replacement.
- [ ] Transitions `120ms ease-out`, colour/background only — nothing animates position or size
- [ ] Search debounce 150ms; matched substring highlight
- [ ] Chips toggle (not navigate), AND with group filter, hidden at count 0
- [ ] Sort: click to sort, second click reverses, `▾`/`▴` on the active column, default name asc
- [ ] Skeleton rows — `--surface` blocks at real row height, no shimmer, never a full-page spinner
- [ ] Offline: app bar status → "No connection — showing last known counts" in `--risk`;
      "Log a shipment" stays enabled

**Open questions**

- **Q11.1 — `translateY(1px)` vs "nothing animates position".** The press state moves the button
  1px, but the motion rule says "Nothing on this screen animates position or size". Reading:
  the transform is instant (only colour transitions), so both hold. Confirming, since
  `SButton` currently has `transition: all 120ms ease-out` and *will* animate the translate —
  which means SButton needs its transition narrowed to `background-color, color, border-color`.
  That's a change to a shared atom affecting every existing button.
- **Q11.2 — Skeleton row count.** How many, and does the summary strip skeleton too? README says
  "the summary strip figures and the rows are the only async content", which implies yes, but
  the skeleton spec only describes rows.
- **Q11.3 — Row focus state.** Rows are clickable, so they should be keyboard-reachable and show
  a visible focus ring — but no row focus treatment is specified, and the focus spec covers only
  inputs and selects. Use the `--action` outline on rows too?
- **Q11.4 — Does "Log a shipment" actually write?** The spec has it create a draft locally
  before navigating. With the builder out of scope, do I implement the local draft write (so the
  draft caption in the summary strip is real and reflects state), or stub the handler?

---

## Task 12 — Verification

- [ ] `npx vue-tsc -b` clean
- [ ] `npm run build` clean
- [ ] Dev server; compare both frames side by side against `A_catalogue_list.html` at 1440 and 390
- [ ] Walk every interaction in the README's "Interactions & behaviour" list
- [ ] Confirm the five state rules hold: no float money, no delete path, stock read-only,
      derived/overridden distinguishable, cost isolated to `CostFigure`
- [ ] Confirm every `TODO(mock):` is present and inventoried

---

## Handoff contradictions on record

Places where the handoff disagrees with itself or with CLAUDE.md. Each is raised under the task
where it bites; collected here so none get quietly resolved.

| # | Conflict | Task |
|---|---|---|
| 1 | Space Grotesk at 15px and 17px vs the README's "18px and above only" | Q4.4 |
| 2 | Reference's `oklch(0.45 0.01 260)` vs README's `--fg-2` (0.40) for Group/Lead/captions/footer | Q8.2 |
| 3 | micro tracking: 0.16em (CLAUDE.md / SText) vs 0.14em (README summary) vs 0.10em (reference table header) | Q4.2 |
| 4 | `--color-muted-dark` 0.82 vs `--fg-on-dark-2` 0.80 | Q0.3 |
| 5 | SBadge forces uppercase; all four row chips are lowercase | Q5.1 |
| 6 | Phone chips ~33px tall vs "every tappable target on a phone surface is ≥48px" | Q6.3 |
| 7 | Button press `translateY(1px)` vs "nothing animates position or size" | Q11.1 |
| 8 | Reference buttons are Space Grotesk; `SButton` is IBM Plex Sans | Task 8 |
| 9 | Reference laptop button is `min-height: 44px`; `SButton md` is a hard `height: 40px` | Task 8 |
| 10 | Summary figure is 24px mono; the documented scale has money-lg 30 and money 13–14, nothing between | Q4.1 (role 3) |

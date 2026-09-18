# Smart Home Ops Dashboard

Vue 3 + TypeScript + Tailwind CSS v4 + Vite.

## Design system

This project uses the **Console design system** (cool-toned instrument-panel aesthetic).
All UI work must use the components and tokens defined below — never reach for raw HTML
with inline styles or arbitrary values when a design system primitive exists.

### Atoms — always prefer these over raw HTML

| Component | Import path | Use for |
|---|---|---|
| `<SText>` | `@/components/atoms/SText.vue` | All text — headings, body, labels, micro, money |
| `<SButton>` | `@/components/atoms/SButton.vue` | Every interactive button |
| `<SBadge>` | `@/components/atoms/SBadge.vue` | Chips, state flags, category labels |
| `<SInput>` | `@/components/atoms/SInput.vue` | Text inputs, prefixed inputs, derived/read-only fields |
| `<SSelect>` | `@/components/atoms/SSelect.vue` | Fixed-option dropdowns |
| `<SCombobox>` | `@/components/atoms/SCombobox.vue` | Searchable dropdowns, free-text entry |
| `<SSegmented>` | `@/components/atoms/SSegmented.vue` | 2–3 option toggle controls (e.g. Grouped / Itemised) |
| `<SFilterChip>` | `@/components/atoms/SFilterChip.vue` | Toggleable filter chips (low stock, needs attention, group) |
| `<SToggle>` | `@/components/atoms/SToggle.vue` | Boolean on/off switches |
| `<SCheckbox>` | `@/components/atoms/SCheckbox.vue` | Boolean checkboxes |
| `<SCard>` | `@/components/atoms/SCard.vue` | Record cards, figure cards, attention cards |

### SText type scale

```vue
<SText type="display" as="h1">Smart Home Ops</SText>   <!-- Space Grotesk 600 32px -->
<SText type="title">Catalogue items</SText>             <!-- Space Grotesk 600 22px -->
<SText type="heading">Lighting package</SText>          <!-- Space Grotesk 600 18px -->
<SText type="body">Body copy here.</SText>              <!-- IBM Plex Sans 400 15px -->
<SText type="ui">Save draft</SText>                     <!-- IBM Plex Sans 500 14px -->
<SText type="meta">Last updated 3 days ago</SText>      <!-- IBM Plex Sans 400 13px -->
<SText type="label">Unit price</SText>                  <!-- IBM Plex Sans 500 12px -->
<SText type="micro">catalogue · lighting</SText>        <!-- IBM Plex Mono 400 10px UC -->
<SText type="money-lg" color="action">GH₵ 14,820</SText> <!-- IBM Plex Mono 500 30px -->
<SText type="money">GH₵ 480.00</SText>                 <!-- IBM Plex Mono 400 13px -->
```

Denser roles the list screens need. Reach for these rather than inventing a one-off class:

```vue
<SText type="screen-title">Catalogue</SText>            <!-- Space Grotesk 600 17px — phone header -->
<SText type="app-title">Smart Home Ops</SText>          <!-- Space Grotesk 600 15px — app-bar wordmark -->
<SText type="list-title">Tuya switch, 2 gang</SText>    <!-- IBM Plex Sans 500 15px — phone row name -->
<SText type="tab">Shipments</SText>                     <!-- IBM Plex Sans 500 13px — tab bar -->
<SText type="caption">at landed cost · 187 units</SText><!-- IBM Plex Sans 400 12px -->
<SText type="column-header">Stock</SText>               <!-- Mono 10px UC .10em — table headers -->
<SText type="figure">GH₵ 21,304</SText>                 <!-- Mono 500 24px — summary strip -->
<SText type="list-figure">373.00</SText>                <!-- Mono 500 16px — phone row price -->
<SText type="list-meta">12 in stock · 14 d</SText>      <!-- Mono 400 12px — phone meta line -->
<SText type="cell-meta">14 d</SText>                    <!-- Mono 400 11px — Group/Lead cells, footers -->
```

`micro` is 10px uppercase at `.14em`; `column-header` is the same size at `.10em`.

Roles the shipment builder added. The four Space Grotesk ones are one scale — a frame,
a surface that opens over it, a dialog, a pane inside one:

```vue
<SText type="sheet-title">What the freight did to each item</SText>  <!-- Space Grotesk 600 26px, -0.01em -->
<SText type="frame-title">Shipment SH-015</SText>       <!-- Space Grotesk 600 20px — a frame's header bar -->
<SText type="dialog-title">Receive SH-015?</SText>      <!-- Space Grotesk 600 19px -->
<SText type="pane-title">Invoice lines</SText>          <!-- Space Grotesk 600 16px — a pane header -->
<SText type="cell">Tuya switch, 2 gang</SText>          <!-- IBM Plex Sans 400 14px — laptop table row -->
<SText type="row-meta">Cameras — took the container</SText> <!-- Sans 400 13px, no leading -->
<SText type="hint">prices as invoiced, in USD</SText>   <!-- Mono 10px, no tracking, micro ink -->
<SText type="total">GH₵ 11,287.68</SText>               <!-- Mono 500 22px — the figure a block is about -->
<SText type="count">+70</SText>                         <!-- Mono 400 14px — a figure inside prose -->
<SText type="cell-prompt" color="risk">pick a group</SText> <!-- Mono 500 14px — an in-cell control -->
<SText type="ref">SH-015</SText>                        <!-- Mono 500 13px — a document number -->
```

`cell` and `row-meta` declare no `line-height`, so a table row keeps the height its own
padding gives it; `meta` is `row-meta` with 1.5 leading, for prose that wraps.

Block types (`display`, `title`, `heading`, `screen-title`, `body`, `list-title`, `meta`, `label`,
`caption`) render as `<p>` by default. The rest render as `<span>`.
Override with `as="h1"`, `as="label"`, etc. for correct semantics.

### SText color prop

Only pass `color` when deviating from the type role's default.

| Value | Token | Use |
|---|---|---|
| `fg` | `--color-fg` | Primary text (default for most roles) |
| `fg-2` | `--color-fg-2` | Labels, meta (default for `label`, `meta`, `micro`) |
| `fg-2-soft` | `--color-fg-2-soft` | One step quieter than `fg-2` — inactive tabs, captions, Group/Lead cells, footers |
| `micro` | `--color-micro` | Micro labels, the `/ 6` denominator |
| `fg-3` | `--color-fg-3` | Disabled, placeholder |
| `action` | `--color-action` | Selected values, links, money highlights |
| `risk` | `--color-risk` | Warnings, low stock, errors |
| `inverse` | `--color-inverse` | Text on dark backgrounds |
| `muted-dark` | `--color-muted-dark` | Text on the dark nav header |

### SButton variants & sizes

```vue
<SButton>Accept quote</SButton>                          <!-- primary, md -->
<SButton variant="secondary">Save draft</SButton>
<SButton variant="ghost">Cancel</SButton>
<SButton variant="destructive">Archive item</SButton>
<SButton :disabled="true">Send</SButton>
<SButton size="lg">On-site action</SButton>             <!-- 48px — phone door, 14px label -->
<SButton size="sm">Inline action</SButton>              <!-- 32px -->
<SButton variant="create" size="md">+ create "smoke" inline</SButton> <!-- mono 12px, action on surface -->
```

Sizes carry their door: `md` is 44px / 15px (laptop primary), `lg` is 48px / 14px and
horizontally compact so it still shares a 390px action bar. Both use `rounded-md`.

**There are three sizes and that is the set.** A handoff that draws a 40px or 46px button
gets the nearest of these, not a fourth size: the shipment builder's header and action-bar
buttons are `lg`, its primaries are `md`. Consequence to expect — a 14px button comes out
6–8px taller than drawn, and every label reads at weight 500 rather than 600.

`variant="create"` is the inline-create chip beside a combobox — mono, because what it
creates is the query quoted back, and action-blue because creating is the affordance. At
`size="md"` it stands 44px, flush with the combobox it sits beside.

### SBadge variants

```vue
<SBadge variant="category-dark">lighting</SBadge>
<SBadge variant="category-mid">switching</SBadge>
<SBadge variant="category-outlined">e27</SBadge>
<SBadge variant="derived">derived price</SBadge>
<SBadge variant="overridden">overridden</SBadge>
<SBadge variant="low-stock">low stock · 2</SBadge>
<SBadge variant="incomplete">incomplete</SBadge>
<SBadge variant="accepted">accepted</SBadge>
<SBadge variant="archived">archived</SBadge>
<SBadge variant="source-to-order">source to order</SBadge>
<SBadge variant="nav-risk">3</SBadge>
<SBadge variant="draft" size="state">draft · arrives 24 Sep</SBadge>
<SBadge variant="received" size="state">received 12 Aug</SBadge>
<SBadge variant="neutral" size="state">3 costs down</SBadge>
```

`size="state"` is the sentence-shaped chip at 11px (`5px 9px`, `rounded-chip`, no tracking),
for a chip that says a state or a count rather than labelling a category. `draft` is dashed
`--color-fg-3` on nothing; `received` is a solid `--color-line` fill with no border at all.
Keep the two vocabularies apart: **dashed means not-yet, solid means committed.**

`size="row"` is the in-row flag chip — lowercase, untracked, `3px 6px`, `rounded-flag`. Use it
for flags that state a problem in words inside a table row:

```vue
<SBadge variant="low-stock" size="row">reorder</SBadge>
<SBadge variant="incomplete" size="row">no supplier link</SBadge>
<SBadge variant="overridden" size="row">price overridden</SBadge>
```

### SFilterChip

Emphasis is fixed per chip and marks severity, not selection; selection is the ring.

```vue
<SFilterChip variant="risk-filled" :selected="lowStockOnly">low stock · 4</SFilterChip>
<SFilterChip variant="risk-outlined" :selected="attentionOnly">needs attention · 2</SFilterChip>
<SFilterChip variant="neutral-outlined" size="phone">All groups ▾</SFilterChip>
```

`size="phone"` keeps the drawn box at the reference metrics and stretches the tap target to 48px.

### SSegmented

`size="lg"` is the allocation-basis door: an 8px track with no gap, 9px/14px segments, and a
selection that weighs 600 and lifts by `shadow-elev-0`. The selection settles in 150ms on
background and shadow — it is not a pill that slides. Hovering an unselected segment brings
its label to full ink and moves nothing. `disabled` makes the whole control inert for a
read-only view.

### SInput / SSelect / SCombobox

`variant="on-dark"` for a field on the dark app bar; `size="lg"` for the 48px phone door;
`variant="chip"` on SSelect for a chip-sized dropdown. Pass `ariaLabel` whenever there is no
visible `label` — a `label` is tied to its control with `for`/`id`, so it names the field to
a screen reader as well as to the eye.

```vue
<SInput label="Order date" size="field" mono />              <!-- meta strip: 11px/12px, 14px -->
<SInput label="Rate you actually got" size="field" mono align="right" prefix="1 USD =" />
<SInput size="row" dashed placeholder="Name a cost…" />      <!-- in-table label field -->
<SInput size="row-figure" dashed mono align="right" placeholder="0.00" />
<SInput size="split" variant="accent" mono align="right" suffix="%" />  <!-- the 92px override -->
<SInput variant="flat" mono align="right" ariaLabel="Quantity" />       <!-- a figure in a row -->
```

- `mono` makes a field a figure — mono and tabular. `align="right"` for anything read by column.
- `dashed` is a blank row that is not a row yet: it keeps its dashes **until it holds a value**,
  then goes solid on its own.
- `variant="flat"` draws no box until you reach for it, so a table of editable figures still
  reads as figures. Put `min-width: 0` on the grid items of any row holding one, or the field's
  intrinsic width widens the column and the row stops lining up under the head.
- `variant="accent"` carries the action border at rest — a value he decided rather than was given.
- `prefix` is a fact about the field and is fenced off by a border; `suffix` is part of the
  value's reading and is not.

SCombobox: `size="row"` is the 44px inline-create row; `hint` is mono micro inside the field
(`no match in 209 items`) and suppresses the dropdown's own "No matches"; `hideChevron` for a
field that is a row rather than a picker; `createOnEnter` makes Enter-with-no-match create
without adding a second create row to the list; `@update:query` hands the typed text to the
screen, and `focus()` / `clear()` are exposed so a flow can put the caret where it belongs.
**Escape clears the query and stays in the field** — it never exits the row.

### SCard variants

```vue
<SCard variant="record" microLabel="catalogue" title="Philips Hue BR30" body="…" />
<SCard variant="figure" microLabel="Month to date" figure="GH₵ 14,820" figureCaption="↑ vs last month" />
<SCard variant="attention" microLabel="low stock" title="Smart Switch · 2 left" body="…" />
```

### Design tokens (Tailwind utilities)

All tokens are in `src/style.css` under `@theme` and available as Tailwind utilities.

**Colors** → `bg-*`, `text-*`, `border-*`:
`bg`, `surface`, `line`, `divider`, `fg`, `fg-2`, `fg-2-soft`, `fg-3`, `micro`, `action`, `action-hover`, `risk`, `risk-hover`, `inverse`, `muted-dark`, `chrome`

The quiet inks run `fg-2` (0.40) → `fg-2-soft` (0.45) → `micro` (0.50) → `fg-3` (0.58).
`fg-2-soft` is inactive tabs, summary captions, the Group and Lead cells, and footers.
`micro` is micro labels and the `/ 6` denominator in a low-stock count.

**Row backgrounds** → `bg-row-hover`, `bg-row-hover-risk` (hover on a risk-tinted row),
`bg-row-hover-action` (hover on an action-tinted row), `bg-row-risk-tint` (low stock),
`bg-row-action-tint` (new / selected). A tinted row **keeps its tint and darkens** on hover;
it never falls back to the neutral hover.

**Other surfaces** → `bg-match-highlight` (search match), `bg-field-dark` +
`border-field-dark-line` (an input sitting on the dark app bar), `bg-scrim` (behind a modal).

**Fonts** → `font-display`, `font-sans`, `font-mono`

**Radius** → `rounded-flag` (5px — in-row flag chips), `rounded-chip` (6px), `rounded-md` (8px — buttons, inputs), `rounded-card` (10px — cards, frames), `rounded-pill` (999px)

**Hit target** → `--hit-min` (48px)

**Shadows** → `shadow-elev-0` (the faintest lift: a selected segment, a secondary button in an
action bar), `shadow-elev-1` (resting card), `shadow-elev-2` (dialogs / sheets, and a surface
that opened over another)

### Rules

- **Never use `font-family`, `font-size`, or `color` as inline styles** on text elements — use `<SText>`.
- **Never hardcode color hex/oklch values** in component templates or scoped CSS — use the CSS variables (`var(--color-action)`) or Tailwind utilities (`text-action`).
- **Never use arbitrary Tailwind values** like `text-[13px]` or `bg-[#abc]` — every value should trace to a design token.
- **Spacing:** use the 4px base scale (4 · 8 · 12 · 16 · 24 · 32 · 48). In Tailwind: `gap-1` → 4px, `gap-2` → 8px, `gap-4` → 16px, `gap-6` → 24px, `gap-8` → 32px.
- **One action color, one risk color.** `--color-action` (blue) = interactive affordances only. `--color-risk` (amber) = all warnings (stock, data, loss, archive). Do not introduce new semantic colors.
- **Phone door targets:** any tappable element on a mobile view must be `min-height: 48px` (`size="lg"` on buttons).
- **Motion:** hover/press transitions are always `120ms ease-out`. Sheet/dialog entrances are `200ms`. A segmented selection settles in `150ms`. Nothing else animates.
- **One focus treatment.** Every field focuses the same way: a 1px `--color-action` border plus a
  2px `--color-action` outline at `-1px` offset. Reaching for a field firms its border to
  `--color-fg-3` first. Buttons and rows take a 2px `--color-action` outline instead.
- **Validation appears in the row that has the problem**, expressed as the consequence
  (`blocks receiving`), never as a banner or a summary list elsewhere.
- **The dot, never the spinner.** Local-first saving is a state, not progress, and no screen
  where something is being typed may wait on the network or disable a control when it drops.
- **New atoms go in** `src/components/atoms/` and must be prefixed `S`.

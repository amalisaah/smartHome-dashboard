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
```

Sizes carry their door: `md` is 44px / 15px (laptop primary), `lg` is 48px / 14px and
horizontally compact so it still shares a 390px action bar. Both use `rounded-md`.

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
```

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

### SInput / SSelect

`variant="on-dark"` for a field on the dark app bar; `size="lg"` for the 48px phone door;
`variant="chip"` on SSelect for a chip-sized dropdown. Pass `ariaLabel` whenever there is no
visible `label`.

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
`bg-row-risk-tint` (low stock), `bg-row-action-tint` (new / selected).

**Other surfaces** → `bg-match-highlight` (search match), `bg-field-dark` +
`border-field-dark-line` (an input sitting on the dark app bar).

**Fonts** → `font-display`, `font-sans`, `font-mono`

**Radius** → `rounded-flag` (5px — in-row flag chips), `rounded-chip` (6px), `rounded-md` (8px — buttons, inputs), `rounded-card` (10px — cards, frames), `rounded-pill` (999px)

**Hit target** → `--hit-min` (48px)

**Shadows** → `shadow-elev-1` (resting), `shadow-elev-2` (dialogs / sheets)

### Rules

- **Never use `font-family`, `font-size`, or `color` as inline styles** on text elements — use `<SText>`.
- **Never hardcode color hex/oklch values** in component templates or scoped CSS — use the CSS variables (`var(--color-action)`) or Tailwind utilities (`text-action`).
- **Never use arbitrary Tailwind values** like `text-[13px]` or `bg-[#abc]` — every value should trace to a design token.
- **Spacing:** use the 4px base scale (4 · 8 · 12 · 16 · 24 · 32 · 48). In Tailwind: `gap-1` → 4px, `gap-2` → 8px, `gap-4` → 16px, `gap-6` → 24px, `gap-8` → 32px.
- **One action color, one risk color.** `--color-action` (blue) = interactive affordances only. `--color-risk` (amber) = all warnings (stock, data, loss, archive). Do not introduce new semantic colors.
- **Phone door targets:** any tappable element on a mobile view must be `min-height: 48px` (`size="lg"` on buttons).
- **Motion:** hover/press transitions are always `120ms ease-out`. Sheet/dialog entrances are `200ms`. Nothing else animates.
- **New atoms go in** `src/components/atoms/` and must be prefixed `S`.

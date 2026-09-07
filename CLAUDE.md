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

Block types (`display`, `title`, `heading`, `body`, `meta`, `label`) render as `<p>` by default.
Inline types (`ui`, `micro`, `money-lg`, `money`) render as `<span>` by default.
Override with `as="h1"`, `as="label"`, etc. for correct semantics.

### SText color prop

Only pass `color` when deviating from the type role's default.

| Value | Token | Use |
|---|---|---|
| `fg` | `--color-fg` | Primary text (default for most roles) |
| `fg-2` | `--color-fg-2` | Labels, meta (default for `label`, `meta`, `micro`) |
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
<SButton size="lg">On-site action</SButton>             <!-- 48px — phone door -->
<SButton size="sm">Inline action</SButton>              <!-- 32px -->
```

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

### SCard variants

```vue
<SCard variant="record" microLabel="catalogue" title="Philips Hue BR30" body="…" />
<SCard variant="figure" microLabel="Month to date" figure="GH₵ 14,820" figureCaption="↑ vs last month" />
<SCard variant="attention" microLabel="low stock" title="Smart Switch · 2 left" body="…" />
```

### Design tokens (Tailwind utilities)

All tokens are in `src/style.css` under `@theme` and available as Tailwind utilities.

**Colors** → `bg-*`, `text-*`, `border-*`:
`bg`, `surface`, `line`, `divider`, `fg`, `fg-2`, `fg-3`, `micro`, `action`, `action-hover`, `risk`, `risk-hover`, `inverse`, `muted-dark`, `chrome`

`micro` is the third neutral, between `fg-2` (0.40) and `fg-3` (0.58) — micro labels, the
`/ 6` denominator in a low-stock count, table footers.

**Row backgrounds** → `bg-row-hover`, `bg-row-hover-risk` (hover on a risk-tinted row),
`bg-row-risk-tint` (low stock), `bg-row-action-tint` (new / selected).

**Other surfaces** → `bg-match-highlight` (search match), `bg-field-dark` +
`border-field-dark-line` (an input sitting on the dark app bar).

**Fonts** → `font-display`, `font-sans`, `font-mono`

**Radius** → `rounded-chip` (6px), `rounded-md` (8px — buttons, inputs), `rounded-card` (10px), `rounded-pill` (999px)

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

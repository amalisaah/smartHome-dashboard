<script setup lang="ts">
import { ref } from 'vue'
import {
  SBadge,
  SButton,
  SCard,
  SCheckbox,
  SCombobox,
  SInput,
  SSegmented,
  SSelect,
  SText,
  SToggle,
} from '@/components/atoms'

const inputVal = ref('')
const prefixedVal = ref('')
const derivedVal = ref('GH₵ 2,400.00')
const errorVal = ref('')
const toggle1 = ref(true)
const toggle2 = ref(false)
const check1 = ref(true)
const check2 = ref(false)
const segmented = ref<'grouped' | 'itemised'>('grouped')
const typeRows = [
  { type: 'display',  as: 'span', color: undefined,  sample: 'Smart Home Ops',                                          spec: 'Space Grotesk 600 · 32px · −0.02em' },
  { type: 'title',    as: 'span', color: undefined,  sample: 'Catalogue items',                                         spec: 'Space Grotesk 600 · 22px' },
  { type: 'heading',  as: 'span', color: undefined,  sample: 'Lighting package',                                        spec: 'Space Grotesk 600 · 18px' },
  { type: 'body',     as: 'span', color: undefined,  sample: 'Each job has exactly one assigned installer and one site contact.', spec: 'IBM Plex Sans 400 · 15px · 1.6' },
  { type: 'ui',       as: 'span', color: undefined,  sample: 'Save draft',                                              spec: 'IBM Plex Sans 500 · 14px' },
  { type: 'meta',     as: 'span', color: undefined,  sample: 'Last updated 3 days ago · Ref #AHL-0042',                 spec: 'IBM Plex Sans 400 · 13px · fg-2' },
  { type: 'label',    as: 'span', color: undefined,  sample: 'Unit price',                                              spec: 'IBM Plex Sans 500 · 12px · fg-2' },
  { type: 'micro',    as: 'span', color: undefined,  sample: 'catalogue · lighting',                                    spec: 'IBM Plex Mono 400 · 10px · 0.16em UC' },
  { type: 'money-lg', as: 'span', color: 'action',   sample: 'GH₵ 14,820.00',                                          spec: 'IBM Plex Mono 500 · 30px · tabular' },
  { type: 'money',    as: 'span', color: undefined,  sample: 'GH₵ 480.00',                                             spec: 'IBM Plex Mono 400 · 13px · tabular' },
] as const

const comboSupplier = ref<string>('')
const comboInstaller = ref<string>('kwame')
const qty = ref(3)
</script>

<template>
  <div class="dsv">

    <!-- ═══ HEADER ═══════════════════════════════════════════════════════ -->
    <header class="dsv-header">
      <div class="dsv-header-inner">
        <span class="dsv-eyebrow">Console · v1</span>
        <h1 class="dsv-title">Smart Home Ops<br>Design System</h1>
        <p class="dsv-subtitle">
          A cool-toned instrument-panel aesthetic for field ops.
          IBM Plex Sans · IBM Plex Mono · Space Grotesk.
          One action colour, one risk colour. No exceptions.
        </p>
      </div>
    </header>

    <main class="dsv-main">

      <!-- ─── § 01 COLOR TOKENS ──────────────────────────────────────── -->
      <section class="ds-section">
        <div class="ds-section-label">01 — Color tokens</div>
        <div class="token-grid">
          <div class="token-swatch" style="background: var(--color-bg); border: 1px solid var(--color-line);">
            <span class="token-name">--color-bg</span>
            <span class="token-value">oklch(0.99 .002 250)</span>
            <span class="token-role">Page · inputs · cards</span>
          </div>
          <div class="token-swatch" style="background: var(--color-surface); border: 1px solid var(--color-line);">
            <span class="token-name">--color-surface</span>
            <span class="token-value">oklch(0.96 .003 250)</span>
            <span class="token-role">Table headers · chips · prefixes</span>
          </div>
          <div class="token-swatch" style="background: var(--color-line); border: 1px solid var(--color-line);">
            <span class="token-name">--color-line</span>
            <span class="token-value">oklch(0.90 .004 250)</span>
            <span class="token-role">All borders</span>
          </div>
          <div class="token-swatch" style="background: var(--color-fg-3); border: 1px solid transparent;">
            <span class="token-name token-name--light">--color-fg-3</span>
            <span class="token-value token-value--light">oklch(0.58 .01 260)</span>
            <span class="token-role token-role--light">Dashed borders · disabled ink</span>
          </div>
          <div class="token-swatch" style="background: var(--color-fg-2); border: 1px solid transparent;">
            <span class="token-name token-name--light">--color-fg-2</span>
            <span class="token-value token-value--light">oklch(0.40 .01 260)</span>
            <span class="token-role token-role--light">Labels · meta</span>
          </div>
          <div class="token-swatch" style="background: var(--color-fg); border: 1px solid transparent;">
            <span class="token-name token-name--light">--color-fg</span>
            <span class="token-value token-value--light">oklch(0.21 .01 260)</span>
            <span class="token-role token-role--light">Body text · headings</span>
          </div>
          <div class="token-swatch" style="background: var(--color-action); border: 1px solid transparent;">
            <span class="token-name token-name--light">--color-action</span>
            <span class="token-value token-value--light">oklch(0.55 .13 255)</span>
            <span class="token-role token-role--light">Primary button · links · focus · selected</span>
          </div>
          <div class="token-swatch" style="background: var(--color-risk); border: 1px solid transparent;">
            <span class="token-name token-name--light">--color-risk</span>
            <span class="token-value token-value--light">oklch(0.55 .13 45)</span>
            <span class="token-role token-role--light">Cost · loss · low stock · incomplete</span>
          </div>
        </div>
      </section>

      <!-- ─── § 02 TYPOGRAPHY ──────────────────────────────────────────── -->
      <section class="ds-section">
        <div class="ds-section-label">02 — Type scale</div>
        <div class="type-scale">
          <div v-for="(row, i) in typeRows" :key="row.type">
            <div class="type-row">
              <span class="type-label">{{ row.type }}</span>
              <SText :type="row.type" :color="row.color" :as="row.as">{{ row.sample }}</SText>
              <span class="type-spec">{{ row.spec }}</span>
            </div>
            <div v-if="i < typeRows.length - 1" class="type-divider"></div>
          </div>
        </div>
      </section>

      <!-- ─── § 03 SPACING · RADIUS · ELEVATION ───────────────────────── -->
      <section class="ds-section">
        <div class="ds-section-label">03 — Spacing · Radius · Elevation</div>
        <div class="ds-3col">
          <!-- Spacing -->
          <div>
            <p class="ds-subsection-title">Space scale · 4px base</p>
            <div class="space-steps">
              <div v-for="step in [4, 8, 12, 16, 24, 32, 48]" :key="step" class="space-step">
                <div class="space-bar" :style="{ width: step + 'px', height: '8px', background: 'var(--color-action)', borderRadius: '2px' }"></div>
                <span class="space-val">{{ step }}px</span>
              </div>
            </div>
          </div>
          <!-- Radius -->
          <div>
            <p class="ds-subsection-title">Border radius</p>
            <div class="radius-examples">
              <div class="radius-example">
                <div style="width: 56px; height: 28px; background: var(--color-surface); border: 1px solid var(--color-line); border-radius: 6px;"></div>
                <span class="space-val">6px · chip</span>
              </div>
              <div class="radius-example">
                <div style="width: 80px; height: 40px; background: var(--color-surface); border: 1px solid var(--color-line); border-radius: 10px;"></div>
                <span class="space-val">10px · card · button · input</span>
              </div>
              <div class="radius-example">
                <div style="width: 60px; height: 28px; background: var(--color-surface); border: 1px solid var(--color-line); border-radius: 999px;"></div>
                <span class="space-val">999px · pill · qty</span>
              </div>
            </div>
          </div>
          <!-- Elevation -->
          <div>
            <p class="ds-subsection-title">Elevation</p>
            <div class="elev-examples">
              <div class="elev-example">
                <div style="width: 100%; height: 56px; background: var(--color-bg); border-radius: 10px; box-shadow: var(--shadow-elev-1);"></div>
                <span class="space-val">elev-1 · resting cards</span>
              </div>
              <div class="elev-example" style="padding: 12px 0;">
                <div style="width: 100%; height: 56px; background: var(--color-bg); border-radius: 10px; box-shadow: var(--shadow-elev-2);"></div>
                <span class="space-val">elev-2 · dialogs · sheets</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── § 04 BUTTONS ─────────────────────────────────────────────── -->
      <section class="ds-section">
        <div class="ds-section-label">04 — Buttons</div>
        <div class="ds-component-block">
          <div class="ds-row-label">lg · 48px</div>
          <div class="ds-comp-row">
            <SButton size="lg">Accept quote</SButton>
            <SButton size="lg" variant="secondary">Save draft</SButton>
            <SButton size="lg" variant="ghost">Cancel</SButton>
            <SButton size="lg" variant="destructive">Archive item</SButton>
            <SButton size="lg" :disabled="true">Send</SButton>
          </div>
          <div class="ds-row-label">md · 40px</div>
          <div class="ds-comp-row">
            <SButton size="md">Accept quote</SButton>
            <SButton size="md" variant="secondary">Save draft</SButton>
            <SButton size="md" variant="ghost">Cancel</SButton>
            <SButton size="md" variant="destructive">Archive item</SButton>
            <SButton size="md" :disabled="true">Send</SButton>
          </div>
          <div class="ds-row-label">sm · 32px</div>
          <div class="ds-comp-row">
            <SButton size="sm">Accept quote</SButton>
            <SButton size="sm" variant="secondary">Save draft</SButton>
            <SButton size="sm" variant="ghost">Cancel</SButton>
            <SButton size="sm" variant="destructive">Archive item</SButton>
            <SButton size="sm" :disabled="true">Send</SButton>
          </div>
        </div>
      </section>

      <!-- ─── § 05 BADGES ─────────────────────────────────────────────── -->
      <section class="ds-section">
        <div class="ds-section-label">05 — Badges & state flags</div>
        <div class="ds-component-block">
          <div class="ds-comp-row" style="flex-wrap: wrap;">
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
          </div>
        </div>
      </section>

      <!-- ─── § 06 FORM CONTROLS ────────────────────────────────────────── -->
      <section class="ds-section">
        <div class="ds-section-label">06 — Form controls</div>
        <div class="ds-component-block">

          <!-- Row 1: Inputs -->
          <div class="form-grid">
            <SInput
              v-model="inputVal"
              label="Item name"
              placeholder="e.g. Philips Hue BR30"
              :required="true"
            />
            <SInput
              v-model="prefixedVal"
              label="Unit cost"
              placeholder="0.00"
              prefix="GH₵"
            />
            <SInput
              v-model="derivedVal"
              label="Derived price"
              :derived="true"
              caption="Cost × 1.35 margin"
            />
            <SInput
              v-model="errorVal"
              label="Supplier"
              placeholder="Search suppliers…"
              :error="true"
              errorMessage="A supplier is required before quoting."
              :required="true"
            />
          </div>

          <div class="form-grid">
            <SSelect
              label="Unit"
              placeholder="Select unit…"
              :options="[
                { label: 'Each', value: 'each' },
                { label: 'Pack of 2', value: 'pack-2' },
                { label: 'Pack of 5', value: 'pack-5' },
                { label: 'Box of 10', value: 'box-10' },
              ]"
            />
            <SSelect
              label="Category"
              model-value="lighting"
              :options="[
                { label: 'Lighting', value: 'lighting' },
                { label: 'Switching', value: 'switching' },
                { label: 'Security', value: 'security' },
                { label: 'Networking', value: 'networking' },
              ]"
            />
            <SSelect
              label="Assigned installer"
              placeholder="Choose installer…"
              :error="true"
              errorMessage="An installer must be assigned."
              :required="true"
              :options="[
                { label: 'Kwame Mensah', value: 'kwame' },
                { label: 'Abena Osei', value: 'abena' },
              ]"
            />
            <SSelect
              label="Status"
              model-value="draft"
              :disabled="true"
              :options="[
                { label: 'Draft', value: 'draft' },
                { label: 'Sent', value: 'sent' },
                { label: 'Accepted', value: 'accepted' },
              ]"
            />
          </div>

          <div class="form-grid">
            <SCombobox
              v-model="comboSupplier"
              label="Supplier"
              placeholder="Search suppliers…"
              :required="true"
              :free-text="true"
              :options="[
                { label: 'Philips Ghana Ltd', value: 'philips' },
                { label: 'Schneider Electric GH', value: 'schneider' },
                { label: 'ABB West Africa', value: 'abb' },
                { label: 'Legrand Accra', value: 'legrand' },
                { label: 'Osram Distributors', value: 'osram' },
              ]"
            />
            <SCombobox
              v-model="comboInstaller"
              label="Assigned installer"
              placeholder="Choose installer…"
              :options="[
                { label: 'Kwame Mensah', value: 'kwame' },
                { label: 'Abena Osei', value: 'abena' },
                { label: 'Kofi Agyeman', value: 'kofi' },
                { label: 'Ama Darko', value: 'ama' },
              ]"
            />
            <SCombobox
              label="Customer"
              placeholder="Search customers…"
              :error="true"
              errorMessage="A customer is required."
              :required="true"
              :options="[
                { label: 'Acheampong Residence', value: 'acheampong' },
                { label: 'Boateng Offices', value: 'boateng' },
                { label: 'Mensah Villa', value: 'mensah' },
              ]"
            />
            <SCombobox
              label="Package template"
              placeholder="Select or type…"
              :disabled="true"
              :options="[]"
            />
          </div>

          <!-- Row 2: Segmented + Qty + Toggles + Checkboxes -->
          <div class="form-grid form-grid--mixed">
            <!-- Segmented control -->
            <div class="form-field">
              <span class="s-input-label-standalone">Quote type</span>
              <SSegmented
                v-model="segmented"
                :options="[
                  { label: 'Grouped', value: 'grouped' },
                  { label: 'Itemised', value: 'itemised' },
                ]"
              />
            </div>

            <!-- Quantity stepper -->
            <div class="form-field">
              <span class="s-input-label-standalone">Quantity</span>
              <div class="qty-stepper">
                <button class="qty-btn qty-btn--minus" @click="qty = Math.max(0, qty - 1)">−</button>
                <span class="qty-count">{{ qty }}</span>
                <button class="qty-btn qty-btn--plus" @click="qty++">+</button>
              </div>
            </div>

            <!-- Toggles -->
            <div class="form-field">
              <span class="s-input-label-standalone">Toggles</span>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <SToggle v-model="toggle1" label="Low-stock alerts on" />
                <SToggle v-model="toggle2" label="Show cost to owner" />
              </div>
            </div>

            <!-- Checkboxes -->
            <div class="form-field">
              <span class="s-input-label-standalone">Checkboxes</span>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <SCheckbox v-model="check1" label="Include installation fee" />
                <SCheckbox v-model="check2" label="Require site inspection" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── § 07 CARDS ───────────────────────────────────────────────── -->
      <section class="ds-section">
        <div class="ds-section-label">07 — Cards</div>
        <div class="ds-component-block">
          <div class="card-grid">
            <!-- Record card -->
            <SCard
              variant="record"
              microLabel="catalogue"
              title="Philips Hue BR30 Bulb"
              body="Warm-to-cool tunable LED. Compatible with Zigbee and Matter."
            >
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                <SBadge variant="category-dark">lighting</SBadge>
                <SBadge variant="category-mid">e27</SBadge>
                <SBadge variant="source-to-order">source to order</SBadge>
              </div>
            </SCard>

            <!-- Figure card -->
            <SCard
              variant="figure"
              microLabel="Month to date · owner"
              figure="GH₵ 14,820"
              figureCaption="↑ GH₵ 2,140 vs last month"
            />

            <!-- Attention card -->
            <SCard
              variant="attention"
              microLabel="low stock"
              title="Smart Switch 2-gang · 2 units left"
              body="Re-order before Thursday to avoid blocking the Acheampong job."
            >
              <div style="margin-top: 4px;">
                <SButton size="sm" variant="secondary">Source stock</SButton>
              </div>
            </SCard>
          </div>
        </div>
      </section>

      <!-- ─── § 08 NAVIGATION PATTERNS ────────────────────────────────── -->
      <section class="ds-section">
        <div class="ds-section-label">08 — Navigation · laptop door</div>
        <div class="ds-component-block" style="padding: 0; overflow: hidden;">
          <!-- Header bar -->
          <div class="nav-header">
            <span class="nav-brand">Smart Home Ops</span>
            <span class="nav-figure">GH₵ 14,820</span>
          </div>
          <!-- Tab bar -->
          <div class="nav-tabs">
            <button class="nav-tab nav-tab--active">Catalogue</button>
            <button class="nav-tab">Packages</button>
            <button class="nav-tab">Quotes</button>
            <button class="nav-tab">Jobs</button>
            <button class="nav-tab">Customers</button>
            <button class="nav-tab">
              Money
              <SBadge variant="nav-risk">3</SBadge>
            </button>
          </div>
          <!-- Toolbar -->
          <div class="nav-toolbar">
            <div class="nav-search">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="color: var(--color-fg-3); flex-shrink:0;">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.4"/>
                <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <span style="font-size: 13px; color: var(--color-fg-3);">Search items…</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <SBadge variant="low-stock">low stock · 4</SBadge>
              <SBadge variant="incomplete">incomplete · 2</SBadge>
            </div>
            <SButton size="sm">New item</SButton>
          </div>
        </div>
      </section>

      <!-- ─── § 09 OVERLAYS & EDGE STATES ─────────────────────────────── -->
      <section class="ds-section">
        <div class="ds-section-label">09 — Overlays · edge states</div>
        <div class="card-grid card-grid--4">

          <!-- Confirmation dialog -->
          <div class="overlay-card" style="box-shadow: var(--shadow-elev-2);">
            <p class="overlay-title">Archive this item?</p>
            <p class="overlay-body">It won't appear in new quotes. Existing line items are unaffected.</p>
            <div style="display: flex; gap: 8px; margin-top: 4px;">
              <SButton size="sm" variant="destructive">Archive</SButton>
              <SButton size="sm" variant="ghost">Cancel</SButton>
            </div>
          </div>

          <!-- Toast -->
          <div class="toast">
            <span class="toast-msg">Quote #Q-0041 sent to client.</span>
            <button class="toast-undo">Undo</button>
          </div>

          <!-- Empty state -->
          <div class="empty-state">
            <p class="empty-title">No items yet</p>
            <p class="empty-body">Add your first catalogue item to start building quotes.</p>
          </div>

          <!-- Blocked/error card -->
          <SCard
            variant="attention"
            microLabel="missing data"
            title="Supplier link required"
            body="This item can't appear in quotes until a supplier is set."
          />
        </div>
      </section>

      <!-- ─── § 10 DESIGN RULES ─────────────────────────────────────────── -->
      <section class="ds-section">
        <div class="ds-section-label">10 — Design rules</div>
        <div class="rules-grid">
          <div class="rule">
            <span class="rule-title">Money</span>
            <p class="rule-body">All currency figures use IBM Plex Mono, tabular-nums, right-aligned. GH₵ in a separate prefix cell — never inline in the number string. Whole cedis for headlines; two decimals in forms and tables.</p>
          </div>
          <div class="rule">
            <span class="rule-title">The cost wall</span>
            <p class="rule-body">Cost, markup, and margin appear only inside owner-labelled containers. Customer-facing views omit those columns entirely — they are absent, not hidden.</p>
          </div>
          <div class="rule">
            <span class="rule-title">Derived vs overridden</span>
            <p class="rule-body">A dashed border marks a field the system computed. A solid border with the "overridden" chip marks a field the owner manually set. The formula caption explains where the value came from.</p>
          </div>
          <div class="rule">
            <span class="rule-title">One warning colour</span>
            <p class="rule-body">--color-risk covers every warning: low stock, missing data, financial loss, archived status. No severity ladder, no second amber.</p>
          </div>
          <div class="rule">
            <span class="rule-title">Two doors · one skin</span>
            <p class="rule-body">Every component works at 48px (phone door, on-site) and 40px (laptop door, office). No separate mobile design — the components scale by switching size prop.</p>
          </div>
          <div class="rule">
            <span class="rule-title">Motion budget</span>
            <p class="rule-body">Hover and press: 120ms ease-out. Sheet appearances: 200ms. Nothing else animates. No infinite decorative loops on content.</p>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
/* ── Layout ────────────────────────────────────────────────────────── */
.dsv {
  min-height: 100vh;
  background: var(--color-chrome);
}

.dsv-header {
  background: var(--color-fg);
  padding: 64px 48px 56px;
}

.dsv-header-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.dsv-eyebrow {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-muted-dark);
  margin-bottom: 20px;
}

.dsv-title {
  font-family: var(--font-display);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 600;
  color: var(--color-inverse);
  margin: 0 0 20px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.dsv-subtitle {
  font-family: var(--font-sans);
  font-size: 15px;
  color: var(--color-muted-dark);
  margin: 0;
  max-width: 560px;
  line-height: 1.6;
}

.dsv-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* ── Section wrapper ───────────────────────────────────────────────── */
.ds-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ds-section-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-fg-3);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-divider);
}

.ds-component-block {
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: var(--shadow-elev-1);
}

.ds-row-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-fg-3);
}

.ds-comp-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ds-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.ds-subsection-title {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-fg-2);
  margin: 0 0 16px;
}

/* ── Color token grid ──────────────────────────────────────────────── */
.token-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.token-swatch {
  border-radius: var(--radius-card);
  padding: 16px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 3px;
}

.token-name {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  color: var(--color-fg-2);
  letter-spacing: 0.04em;
}

.token-name--light {
  color: var(--color-muted-dark);
}

.token-value {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--color-fg-3);
  letter-spacing: 0.02em;
}

.token-value--light {
  color: var(--color-very-muted-dark);
}

.token-role {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--color-fg-2);
  line-height: 1.4;
}

.token-role--light {
  color: var(--color-muted-dark);
}

/* ── Type scale ───────────────────────────────────────────────────── */
.type-scale {
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-elev-1);
}

.type-row {
  display: grid;
  grid-template-columns: 80px 1fr 200px;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
}

.type-divider {
  height: 1px;
  background: var(--color-divider);
}

.type-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-fg-3);
}

.type-sample {
  font-family: var(--font-sans);
  color: var(--color-fg);
}

.type-spec {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-fg-3);
  letter-spacing: 0.04em;
  text-align: right;
}

/* ── Space / Radius / Elevation ───────────────────────────────────── */
.space-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.space-step {
  display: flex;
  align-items: center;
  gap: 10px;
}

.space-val {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-fg-3);
  letter-spacing: 0.06em;
}

.radius-examples {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radius-example {
  display: flex;
  align-items: center;
  gap: 12px;
}

.elev-examples {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.elev-example {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Form controls ────────────────────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.form-grid--mixed {
  grid-template-columns: repeat(4, 1fr);
  align-items: start;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.s-input-label-standalone {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-fg-2);
  letter-spacing: 0.01em;
}

/* Quantity stepper */
.qty-stepper {
  display: flex;
  align-items: center;
  gap: 0;
  width: fit-content;
}

.qty-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-line);
  background: var(--color-bg);
  font-size: 20px;
  font-weight: 300;
  color: var(--color-fg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 120ms ease-out;
  line-height: 1;
}

.qty-btn--plus {
  background: var(--color-action);
  border-color: var(--color-action);
  color: var(--color-inverse);
}

.qty-btn--plus:hover {
  background: var(--color-action-hover);
}

.qty-btn--minus:hover {
  background: var(--color-surface);
}

.qty-count {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--color-fg);
  min-width: 48px;
  text-align: center;
}

/* ── Cards ────────────────────────────────────────────────────────── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: start;
}

.card-grid--4 {
  grid-template-columns: repeat(4, 1fr);
}

/* ── Navigation patterns ──────────────────────────────────────────── */
.nav-header {
  background: var(--color-fg);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-inverse);
  letter-spacing: -0.01em;
}

.nav-figure {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-muted-dark);
  font-variant-numeric: tabular-nums;
}

.nav-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-divider);
  background: var(--color-bg);
  padding: 0 24px;
  gap: 4px;
}

.nav-tab {
  padding: 12px 16px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-fg-2);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 120ms ease-out, border-color 120ms ease-out;
}

.nav-tab:hover {
  color: var(--color-fg);
}

.nav-tab--active {
  color: var(--color-action);
  border-bottom-color: var(--color-action);
}

.nav-toolbar {
  padding: 12px 24px;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--color-divider);
}

.nav-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

/* ── Overlays ─────────────────────────────────────────────────────── */
.overlay-card {
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overlay-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-fg);
  margin: 0;
}

.overlay-body {
  font-size: 13px;
  color: var(--color-fg-2);
  margin: 0;
  line-height: 1.5;
}

.toast {
  background: var(--color-fg);
  color: var(--color-inverse);
  border-radius: var(--radius-card);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: var(--shadow-elev-2);
  align-self: start;
}

.toast-msg {
  font-size: 13px;
  font-family: var(--font-sans);
  color: var(--color-inverse);
}

.toast-undo {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-action);
  background: transparent;
  border: none;
  cursor: pointer;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.empty-state {
  border: 1px dashed var(--color-fg-3);
  border-radius: var(--radius-card);
  padding: 28px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-fg);
  margin: 0;
}

.empty-body {
  font-size: 13px;
  color: var(--color-fg-2);
  margin: 0;
  line-height: 1.5;
}

/* ── Design rules ──────────────────────────────────────────────────── */
.rules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.rule {
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  padding: 20px;
  box-shadow: var(--shadow-elev-1);
}

.rule-title {
  display: block;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-fg);
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.rule-body {
  font-size: 13px;
  color: var(--color-fg-2);
  margin: 0;
  line-height: 1.55;
}

/* ── Responsive ────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .dsv-main { padding: 24px; gap: 32px; }
  .dsv-header { padding: 40px 24px 36px; }
  .token-grid { grid-template-columns: repeat(2, 1fr); }
  .ds-3col { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: repeat(2, 1fr); }
  .form-grid--mixed { grid-template-columns: repeat(2, 1fr); }
  .card-grid { grid-template-columns: 1fr; }
  .card-grid--4 { grid-template-columns: repeat(2, 1fr); }
  .rules-grid { grid-template-columns: repeat(2, 1fr); }
  .type-row { grid-template-columns: 70px 1fr; }
  .type-spec { display: none; }
}

@media (max-width: 540px) {
  .token-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .form-grid--mixed { grid-template-columns: 1fr; }
  .card-grid--4 { grid-template-columns: 1fr; }
  .rules-grid { grid-template-columns: 1fr; }
}
</style>

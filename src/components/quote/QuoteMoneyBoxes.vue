<script setup lang="ts">
import { computed } from 'vue'
import { SInput, SText, SToggle } from '@/components/atoms'
import { formatCurrency, formatMoney, formatMoneyWhole } from '@/utils/format'
import { fromPesewas, type ChargesDraft, type QuoteMoney } from '@/types/quote'

/**
 * The two money boxes, drawn once and used twice: the phone's money sheet and
 * the laptop's right rail show the same two boxes at two sizes.
 *
 * **They must never blur into each other.** One carries what she will see and
 * has a dark top edge — the colour of the screen it will appear on. The other
 * carries what things cost him and has an amber one. Everything amber on this
 * surface means cost, owner-only, or a warning, and nothing else does.
 *
 * Dashed means the system worked it out; solid means he did. `SInput`'s own
 * `dashed` keeps its dashes exactly until the box holds a value and then goes
 * solid on its own, which is the rule stated as a prop. Clearing a charge sends
 * `null` and hands it back to the server to derive — which is why the empty box
 * shows the derived figure as a *placeholder* and not as a value.
 */
const props = defineProps<{
  money: QuoteMoney
  charges: ChargesDraft
  itemised: boolean
  phone?: boolean
  /** The laptop keeps profit and floor inside the amber box; the phone uses cards. */
  figures?: 'inline' | 'none'
}>()

const emit = defineEmits<{
  charge: [field: keyof ChargesDraft, value: string]
  'update:itemised': [value: boolean]
}>()

/** The phone's fields are the phone's door; the laptop's are a rail's. */
const fieldSize = computed(() => (props.phone ? 'phone' : 'note') as 'phone' | 'note')

const labourHint = computed(() =>
  props.money.labourIsDerived ? 'from the room count · type to override' : 'set by you',
)

const materialsHint = computed(() =>
  props.money.materialsIsDerived ? 'from your estimate · type to override' : 'set by you',
)
</script>

<template>
  <div class="boxes" :class="{ 'boxes--phone': phone }">
    <!-- What she will see. The top edge is the colour of her screen. -->
    <section class="box box--hers">
      <SText type="micro" color="fg">On her quote</SText>

      <div class="row">
        <SText type="cell">
          Devices
          <SText type="caption" as="span" color="fg-2">· from the catalogue</SText>
        </SText>
        <!-- Derived: dashed and read-only. Never his to type, so never a field. -->
        <div class="derived-box">
          <SText type="count">{{ formatMoney(money.devicePesewas) }}</SText>
        </div>
      </div>

      <label class="row">
        <SText type="cell">
          Labour
          <SText type="caption" as="span" color="fg-2">· your judgement</SText>
        </SText>
        <div class="field">
          <SInput
            :model-value="charges.labour"
            :size="fieldSize"
            mono
            align="right"
            dashed
            :placeholder="fromPesewas(money.labourPesewas)"
            aria-label="Labour charge"
            @update:model-value="emit('charge', 'labour', $event)"
          />
        </div>
      </label>
      <SText type="caption" color="fg-2" class="hint">{{ labourHint }}</SText>

      <label class="row">
        <SText type="cell">Materials charge</SText>
        <div class="field">
          <SInput
            :model-value="charges.materials"
            :size="fieldSize"
            mono
            align="right"
            dashed
            :placeholder="fromPesewas(money.materialsPesewas)"
            aria-label="Materials charge"
            @update:model-value="emit('charge', 'materials', $event)"
          />
        </div>
      </label>
      <SText type="caption" color="fg-2" class="hint">{{ materialsHint }}</SText>

      <div class="row row--switch">
        <SText type="cell">
          Itemise her view
          <SText type="caption" as="span" color="fg-2">· only if she insists</SText>
        </SText>
        <SToggle
          :model-value="itemised"
          label=""
          @update:model-value="emit('update:itemised', $event)"
        />
      </div>
    </section>

    <!-- What it costs him. Amber, and never on her quote. -->
    <section class="box box--his">
      <SText type="micro" color="risk">Yours only · never on her quote</SText>

      <label class="row">
        <span class="stack">
          <SText type="cell">Misc cost estimate</SText>
          <SText type="caption" color="fg-2">cable, trunking, fuel</SText>
        </span>
        <div class="field">
          <!-- `error` here is not a complaint: it is the one way to put the
               amber border and amber focus ring on a field without touching the
               atom, and it sets no aria-invalid, so nothing is announced wrong.
               Amber on this screen means cost, and this field is a cost. -->
          <SInput
            :model-value="charges.misc"
            :size="fieldSize"
            mono
            align="right"
            error
            placeholder="0"
            aria-label="Misc cost estimate"
            @update:model-value="emit('charge', 'misc', $event)"
          />
        </div>
      </label>

      <div class="row">
        <SText type="cell">Device cost</SText>
        <SText type="count" color="fg-2">{{ formatMoney(money.deviceCostPesewas) }}</SText>
      </div>

      <div v-if="figures === 'inline'" class="figures">
        <div class="figure">
          <SText type="micro" color="risk">Expected profit</SText>
          <SText type="total">{{ formatCurrency(money.profitPesewas) }}</SText>
        </div>
        <div class="figure">
          <SText type="micro">Floor</SText>
          <SText type="total">{{ formatMoneyWhole(money.costPesewas) }}</SText>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.boxes {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.boxes--phone .box {
  padding: 14px;
}

/* Dark means "hers". The one dark thing in his view besides the Show her
   button, and for the same reason: it is the colour of the screen it is about. */
.box--hers {
  border-top: 3px solid var(--color-customer-bg);
}

.box--his {
  border-top: 3px solid var(--color-risk-on-dark);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.row--switch {
  min-height: 44px;
  padding-top: 6px;
  border-top: 1px solid var(--color-line);
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* The hint belongs to the field above it and sits under the whole row, so the
   label column keeps its baseline against the box. */
.hint {
  margin-top: -6px;
}

.field {
  width: 120px;
  flex: none;
}

.boxes--phone .field {
  width: 130px;
}

.derived-box {
  padding: 8px 10px;
  border: 1px dashed var(--color-fg-3);
  border-radius: var(--radius-md);
}

/*
 * Two conclusions side by side, and they must not read as one number.
 *
 * The reference draws these as equal halves with an 8px gap, where `GH₵ 3,289`
 * at mono 22 measures 119px in a 118.5px column — it fills its half exactly, so
 * the only thing between the two figures is that 8px. At the rail's real widths
 * that is not enough: the eye runs the two together and has to stop and work out
 * where one ends.
 *
 * So the columns are content-width rather than halves, and the boundary is said
 * out loud with the same divider the box already uses above them. Both figures
 * keep the drawn 22px; what changes is that there is now somewhere for the eye
 * to stop.
 */
.figures {
  display: flex;
  gap: 16px;
  padding-top: 10px;
  border-top: 1px solid var(--color-divider);
}

.figures .figure + .figure {
  border-left: 1px solid var(--color-divider);
  padding-left: 16px;
}

.figure {
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* A figure never wraps. `GH₵ 3,581` broken across two lines reads as two
     numbers for the instant it takes to notice it is one. */
  white-space: nowrap;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * One count, changed by hand.
 *
 * Two buttons and a figure, and nothing else — no text entry, because the thing
 * being counted is bulbs in a room and the answer is always within a tap or two
 * of what is already there, and because a field would invite a number nobody
 * counted.
 *
 * **It never goes below zero.** There is no such thing as minus one bulb, and a
 * stepper that allowed one would put it in a record somebody else has to read.
 *
 * They are buttons rather than a custom control precisely so Tab reaches them
 * and Space or Enter steps them, which is the whole of the keyboard story at
 * the desk.
 */
const props = withDefaults(
  defineProps<{
    modelValue: number
    /** Names the count to a screen reader — `Faulty, Tuya RGB bulb, E27`. */
    label: string
    /**
     * `plain` is a count like any other; `risk` is the faulty one, which is the
     * only amber figure on the screen; `muted` is removed, which is a fact
     * about the past and recedes onto `--surface`.
     */
    tone?: 'plain' | 'risk' | 'muted'
    /** `phone` is the 44px door of C2; `desk` the 34px cell of C3. */
    size?: 'phone' | 'desk'
    /** Whether a zero reads as `0` or as the `—` the read mode uses. */
    dashAtZero?: boolean
    /**
     * Whether the record can take the step at all.
     *
     * Not the same as "the figure would go below zero": the API behind this
     * cannot empty a row or put one back to active, so the last unit of a
     * status has nowhere to go even though the number says one. A button that
     * cannot do anything says so by being inert, rather than by failing a
     * second after it is pressed.
     */
    canDown?: boolean
    canUp?: boolean
  }>(),
  { tone: 'plain', size: 'desk', dashAtZero: false, canDown: true, canUp: true },
)

const emit = defineEmits<{ step: [by: number] }>()

const shown = computed(() =>
  props.dashAtZero && props.modelValue === 0 ? '—' : String(props.modelValue),
)

/** Nothing to take away — no units, or no move the record can express. */
const atFloor = computed(() => props.modelValue <= 0 || !props.canDown)
</script>

<template>
  <div class="stepper" :class="[`stepper--${size}`, `stepper--${tone}`]">
    <button
      type="button"
      class="step"
      :disabled="atFloor"
      :aria-label="`One fewer. ${label}`"
      @click="emit('step', -1)"
    >
      −
    </button>
    <span class="value" role="status" :aria-label="`${label}: ${modelValue}`">
      {{ shown }}
    </span>
    <button
      type="button"
      class="step"
      :disabled="!canUp"
      :aria-label="`One more. ${label}`"
      @click="emit('step', 1)"
    >
      +
    </button>
  </div>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}

/* The reference draws these as content boxes, so its `44px` and `34px` render
   46 and 36 with their borders. This project is border-box throughout, so the
   heights are written as the figures the reference actually renders. */
.stepper--phone {
  min-height: 46px;
}

.stepper--desk {
  height: 36px;
}

/* The faulty count, and the only amber figure on the page. The border carries
   it as well as the number, so the column is findable without reading it. */
.stepper--risk {
  border-color: var(--color-risk);
}

/* Removed is a fact about the past: it recedes onto `--surface` so the two
   counts that describe the house now stand in front of it. */
.stepper--muted {
  background: var(--color-surface);
}

.step {
  position: relative;
  flex: none;
  border: none;
  background: transparent;
  color: var(--color-fg-2-soft);
  cursor: pointer;
  line-height: 1;
  border-radius: var(--radius-chip);
  transition: color 120ms ease-out, background-color 120ms ease-out;
}

.stepper--phone .step {
  width: 36px;
  height: 36px;
  font-size: 18px;
}


/* The drawn box is 36px and a thumb needs 48. The box keeps the height it is
   drawn at and the target is hung off it, rather than the control growing to
   hold it — the same answer the house's tab bar and header link give. */
.stepper--phone .step::after {
  content: '';
  position: absolute;
  inset: 50% 0 auto 0;
  height: var(--hit-min);
  transform: translateY(-50%);
}

.stepper--desk .step {
  width: 32px;
  height: 32px;
  font-size: 16px;
}

.step:hover:not([disabled]) {
  color: var(--color-fg);
}

.step:active:not([disabled]) {
  background: var(--color-surface);
}

.step:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.step[disabled] {
  color: var(--color-fg-3);
  cursor: not-allowed;
}

.value {
  flex: 1;
  text-align: center;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--color-fg);
}

.stepper--phone .value {
  font-size: 16px;
}

.stepper--desk .value {
  font-size: 14px;
}

.stepper--risk .value {
  color: var(--color-risk);
}

.stepper--muted .value {
  font-weight: 400;
  color: var(--color-fg-2-soft);
}
</style>

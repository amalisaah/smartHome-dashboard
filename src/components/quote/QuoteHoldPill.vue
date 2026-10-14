<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { SText } from '@/components/atoms'

/**
 * The way back from her view, and the only one.
 *
 * Showing her is one tap, because going to the safe view is never dangerous.
 * Coming back is a 900 ms hold, so a brush of her thumb cannot reveal his costs.
 * A tap does nothing at all — not a shorter path, *no* path — and releasing
 * early or letting the pointer leave the pill cancels it and snaps the bar back.
 *
 * The fill animates `width` linearly over the hold, so what the bar shows is how
 * much of the hold is done rather than a decorative pulse. It is the only thing
 * on this screen that moves.
 *
 * The keyboard gets the same deal: Space **held**. `repeat` is ignored, so
 * holding the key does not restart the timer on every auto-repeat, and keyup or
 * blur cancels.
 */
const props = defineProps<{ phone?: boolean }>()
const emit = defineEmits<{ complete: [] }>()

/** `--hold-reveal`. */
const HOLD_MS = 900

const holding = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function start() {
  if (holding.value) return
  holding.value = true
  timer = setTimeout(() => {
    holding.value = false
    timer = null
    emit('complete')
  }, HOLD_MS)
}

function cancel() {
  if (timer) clearTimeout(timer)
  timer = null
  holding.value = false
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== ' ' && event.key !== 'Spacebar') return
  // Space on a button would otherwise fire a click on release — a tap, which
  // this control must never honour.
  event.preventDefault()
  if (event.repeat) return
  start()
}

function onKeyUp(event: KeyboardEvent) {
  if (event.key === ' ' || event.key === 'Spacebar') cancel()
}

onBeforeUnmount(cancel)
</script>

<template>
  <div class="dock" :class="{ 'dock--phone': props.phone }">
    <button
      type="button"
      class="pill"
      :class="{ 'pill--phone': props.phone }"
      @pointerdown="start"
      @pointerup="cancel"
      @pointerleave="cancel"
      @pointercancel="cancel"
      @keydown="onKeyDown"
      @keyup="onKeyUp"
      @blur="cancel"
    >
      <span class="fill" :class="{ 'fill--holding': holding }" aria-hidden="true" />
      <SText type="row-meta" class="label">Hold to go back</SText>
    </button>
  </div>
</template>

<style scoped>
.dock {
  display: flex;
  justify-content: center;
  padding: 16px 24px 32px;
  flex: none;
}

.dock--phone {
  padding: 12px 24px 24px;
}

.pill {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 220px;
  min-height: 44px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  cursor: pointer;
  /* A thumb held on a pill must not select its label or scroll the page. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.pill--phone {
  width: 200px;
  min-height: var(--hit-min);
}

.pill:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -1px;
}

.fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: var(--color-line);
  /* Letting go snaps back, and does it faster than it filled. */
  transition: width 120ms ease-out;
}

.fill--holding {
  width: 100%;
  transition: width 900ms linear;
}

.label {
  position: relative;
}

@media (prefers-reduced-motion: reduce) {
  /* The bar still has to say how far the hold has got — that is information,
     not decoration — so it keeps its timing and loses nothing. */
  .fill {
    transition: width 120ms linear;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { SButton, SText } from '@/components/atoms'
import { OPEN_MAP, PIN_NONE_DESK, PIN_SET_TITLE } from '@/data/houseVisitCopy'
import type { VisitPin } from '@/types/houseVisit'
import { formatAccuracy, formatCoords } from '@/utils/format'

/**
 * The pin at the desk. It can be read, opened on a map and cleared — and
 * **not dropped.** A pin says where he was standing, and he is not standing
 * there; a desk chair's coordinates are worse than none, because they look like
 * a reading.
 *
 * So the empty state is not a button. It is a dashed box saying where the pin
 * comes from, which answers "why can't I" in the same breath as "what's
 * missing" — and dashed, because an absent pin is a blank the system is
 * describing rather than a value of his.
 */
const props = defineProps<{ pin: VisitPin | null }>()

defineEmits<{ clear: [] }>()

/**
 * A map link, not a map. `geo:` is what a desktop browser will hand to whatever
 * the machine has; the pin is a position and this screen does not own a map.
 */
const mapHref = computed(() =>
  props.pin ? `https://www.google.com/maps/search/?api=1&query=${props.pin.lat},${props.pin.lng}` : '',
)

/**
 * Where, and how sure — the time is left to the page's own summary line.
 *
 * ⚠️ The accuracy is null for a pin read back from the API, which has no column
 * for it, so most of the time this is the coordinates alone.
 */
const reading = computed(() => {
  const pin = props.pin
  if (!pin) return ''
  const accuracy = pin.accuracyM === null ? null : formatAccuracy(pin.accuracyM)
  return [formatCoords(pin.lat, pin.lng), accuracy].filter(Boolean).join(' · ')
})
</script>

<template>
  <div v-if="pin" class="pin">
    <span class="dot" aria-hidden="true" />
    <span class="what">
      <SText type="tab" color="fg">{{ PIN_SET_TITLE }}</SText>
      <SText type="cell-meta" class="reading">{{ reading }}</SText>
    </span>
    <a :href="mapHref" target="_blank" rel="noopener noreferrer" class="link">
      <SText type="tab" color="action-ink">{{ OPEN_MAP }}</SText>
    </a>
    <SButton variant="ghost" size="sm" @click="$emit('clear')">Clear</SButton>
  </div>

  <div v-else class="none">
    <SText type="row-meta" color="fg-2-soft">{{ PIN_NONE_DESK }}</SText>
  </div>
</template>

<style scoped>
.pin {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px 8px 12px;
  min-height: 44px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
}

/* The same box, dashed and empty — so the row below it keeps its height and
   the two columns of this block still line up. */
.none {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  min-height: 44px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-md);
}

.dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: var(--radius-pill);
  background: var(--color-action);
}

.what {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.reading {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* A link that is a destination, not a word in a sentence: no rule under it
   until it is reached for. */
.link {
  display: inline-flex;
  align-items: center;
  flex: none;
  text-decoration: none;
  border-radius: var(--radius-flag);
}

.link:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
</style>

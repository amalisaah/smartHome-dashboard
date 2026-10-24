<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import { READING_ROOMS, STARTING } from '@/data/newQuoteCopy'
import { houseMeta, type NewQuoteCustomer } from '@/types/newQuote'

/**
 * One customer in step 1 — the same row on both devices, because it is the same
 * question being answered on each.
 *
 * The right-hand figure is what makes the next tap predictable: `no house yet`
 * tells him before he presses that step 2 will have nothing in it, and a single
 * area tells him the quote is one tap away. While her rooms are being read, or
 * while her draft is being created, that is what it says instead — the wait
 * belongs in the row he touched and nowhere else.
 */
const props = defineProps<{
  customer: NewQuoteCustomer
  /** The laptop's left column marks the picked row. The phone never has one. */
  picked?: boolean
  /** Her rooms are being counted after a tap on this row. */
  counting?: boolean
  /** Her draft is being created — the phone's one-house skip, mid-flight. */
  starting?: boolean
}>()

defineEmits<{ pick: [] }>()

const meta = computed(() => {
  if (props.starting) return STARTING
  if (props.counting) return READING_ROOMS
  return houseMeta(props.customer)
})

/** Busy is busy on either count: the row has been answered and is working. */
const busy = computed(() => props.starting === true || props.counting === true)
</script>

<template>
  <button
    type="button"
    class="row"
    :class="{ 'row--picked': picked }"
    :aria-busy="busy || undefined"
    @click="$emit('pick')"
  >
    <span class="who">
      <SText type="row-name" as="span">{{ customer.name }}</SText>
      <SText v-if="customer.phone" type="list-meta" color="fg-2">{{ customer.phone }}</SText>
    </span>

    <SText type="cell-meta" :color="busy ? 'action' : 'fg-2'" class="meta">{{ meta }}</SText>
  </button>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-divider);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

/* The laptop answers a hover; the phone answers the finger. A row that is
   already the picked one keeps its own ground either way. */
.row:hover:not(.row--picked),
.row:active:not(.row--picked) {
  background: var(--color-surface);
}

.row--picked {
  background: var(--color-surface);
}

.row:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.who {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.meta {
  flex: none;
  white-space: nowrap;
}
</style>

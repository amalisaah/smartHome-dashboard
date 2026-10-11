<script setup lang="ts">
import { SButton, SFilterChip, SInput } from '@/components/atoms'
import type { CustomerFilterDef, CustomerFilterKey } from '@/types/customers'

defineProps<{
  filters: CustomerFilterDef[]
  active: CustomerFilterKey
  /** Every chip renders inactive while a query is present. */
  searching: boolean
}>()

const query = defineModel<string>('query', { required: true })

defineEmits<{ select: [key: CustomerFilterKey]; newEnquiry: [] }>()

/** `to chase — quoted · 7`, or the label alone until the counts land. */
const chipLabel = (filter: CustomerFilterDef) =>
  filter.count === null ? filter.label : `${filter.label} · ${filter.count}`
</script>

<template>
  <div class="toolbar">
    <SInput
      v-model="query"
      class="search"
      aria-label="Search everyone — name or phone"
      placeholder="Search everyone — name or phone"
    />

    <span class="divider" aria-hidden="true" />

    <!-- The six scroll rather than wrap, so the table below never starts at a
         different height — as the phone's filter row does it. -->
    <div class="chips">
      <SFilterChip
        v-for="filter in filters"
        :key="filter.key"
        variant="choice"
        :selected="!searching && filter.key === active"
        @click="$emit('select', filter.key)"
      >
        {{ chipLabel(filter) }}
      </SFilterChip>
    </div>

    <SButton variant="chrome" size="toolbar" @click="$emit('newEnquiry')">New enquiry</SButton>
  </div>
</template>

<style scoped>
/* 8px rather than the drawn 10: on the 4px scale, and the 16px it gives back
   across the row is what lets the six chips sit unscrolled at the full frame. */
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-line);
}

/* Fixed at the drawn width: the chips beside it must not be squeezed. */
.search {
  width: 360px;
  flex: none;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--color-line);
  flex: none;
}

/* Takes the slack, so the button still sits at the right edge, and gives it
   back by scrolling rather than by pushing the button out of the frame —
   `.frame` clips, so anything past its edge is gone rather than reachable. */
.chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.chips > * {
  flex: none;
}

/* Below the frame's own breakpoint the field is the one thing in the row that
   can afford to be smaller — a search box still reads at 260, and the hundred
   pixels buy the chips most of a chip. */
@media (max-width: 1200px) {
  .search {
    width: 260px;
  }
}

/* The way in is never the thing that gets clipped. */
.toolbar > :last-child {
  flex: none;
}
</style>

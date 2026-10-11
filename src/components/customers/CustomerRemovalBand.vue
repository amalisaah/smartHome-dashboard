<script setup lang="ts">
import { computed } from 'vue'
import { SText } from '@/components/atoms'
import CustomerRemovalCard from '@/components/customers/CustomerRemovalCard.vue'
import {
  anonymiseExit,
  deleteExit,
  removalBandHeading,
  removalBandSubline,
} from '@/data/customerRemovalCopy'
import type { RemovalFigures } from '@/types/customerDetail'

/**
 * The footer band — both exits, side by side, always visible.
 *
 * Neither is hidden behind a menu and neither is drawn quieter than the other:
 * the way they are told apart is the Stays column, not the prominence of the
 * button. Amber is on the right card only.
 */
const props = defineProps<{
  name: string
  figures: RemovalFigures
}>()

defineEmits<{ anonymise: [door: HTMLElement]; delete: [door: HTMLElement] }>()

const left = computed(() => anonymiseExit(props.name, props.figures))
const right = computed(() => deleteExit(props.figures))
</script>

<template>
  <section class="band" aria-labelledby="removal-heading">
    <div class="head">
      <SText id="removal-heading" type="pane-title" as="h2">{{ removalBandHeading }}</SText>
      <SText type="row-meta" color="fg-2-soft">{{ removalBandSubline }}</SText>
    </div>

    <div class="pair">
      <CustomerRemovalCard :exit="left" tone="neutral" @act="$emit('anonymise', $event)" />
      <CustomerRemovalCard :exit="right" tone="risk" @act="$emit('delete', $event)" />
    </div>
  </section>
</template>

<style scoped>
.band {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px 32px 28px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
}

.head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Not designed below ~900px. The two cards stack, anonymise first, so the exit
   that keeps the books is the one he reaches before the one that does not. */
@media (max-width: 899px) {
  .band {
    padding: 20px 16px 24px;
  }

  .pair {
    grid-template-columns: 1fr;
  }
}
</style>

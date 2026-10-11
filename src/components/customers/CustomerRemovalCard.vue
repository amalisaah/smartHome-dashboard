<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'
import CustomerCopyLine from '@/components/customers/CustomerCopyLine.vue'
import type { RemovalExit } from '@/types/customerDetail'

/**
 * One of the two exits.
 *
 * Both are drawn on the same Goes / Stays grid on purpose: the difference
 * between them is meant to be read straight across a row, where the Stays column
 * is full on the left and one word on the right. So this component takes the
 * copy and the tone and nothing else — the two cards cannot drift apart because
 * there is only one of them.
 */
defineProps<{
  exit: RemovalExit
  /** `risk` is delete, and delete alone: amber means nothing else on this screen. */
  tone: 'neutral' | 'risk'
}>()

/** The button goes with the press: it is what focus comes back to. */
defineEmits<{ act: [door: HTMLElement] }>()
</script>

<template>
  <div class="card" :class="`card--${tone}`">
    <div class="titles">
      <SText type="heading" :color="tone === 'risk' ? 'risk' : undefined" as="h3">
        {{ exit.title }}
      </SText>
      <SText type="row-meta">{{ exit.subline }}</SText>
    </div>

    <div class="grid">
      <div class="column">
        <SText type="micro" color="micro">Goes</SText>
        <CustomerCopyLine v-for="(line, index) in exit.goes" :key="index" :line="line" />
      </div>
      <div class="column">
        <SText type="micro" :class="`stays--${tone}`">Stays</SText>
        <CustomerCopyLine v-for="(line, index) in exit.stays" :key="index" :line="line" />
      </div>
    </div>
    <SButton
      :variant="tone === 'risk' ? 'secondary-risk' : 'secondary'"
      size="toolbar"
      class="door"
      @click="$emit('act', $event.currentTarget as HTMLElement)"
    >
      {{ exit.button }}
    </SButton>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  /* The page's ground inside the band's `--surface`, so both cards read at full
     contrast — neither exit is tucked away or made quieter than the other. */
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.card--risk {
  border-color: var(--color-risk);
}

.titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  /* The list's leading, inherited by the lines so a wrapped one keeps it. */
  line-height: 1.7;
}

.column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.column :deep(.s-text--micro) {
  padding-bottom: 4px;
}

/* Two classes deep so the hue beats `SText`'s own role ink whatever order the
   two scoped sheets land in. */
.column .stays--neutral {
  color: var(--color-action-ink);
}

.column .stays--risk {
  color: var(--color-risk);
}

.door {
  align-self: flex-start;
}

/* ⚠️ Not designed. The exit keeps its drawn box and stands at the phone door. */
@media (max-width: 899px) {
  .door {
    min-height: var(--hit-min);
  }
}
</style>

<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * The one box on block B that moves as he types — what the figure he is
 * entering costs him against what he proposed, and where it leaves him against
 * his floor.
 *
 * It is one component across both devices because the **states** are the thing,
 * and they are identical on a phone and a laptop: the border says whether there
 * is a figure at all and whether it is under water, and the floor line says what
 * that means in words. Only the two text sizes differ, which is the device and
 * nothing else.
 *
 * **Dashed means nothing typed; solid amber means a figure to weigh; 2px means
 * it loses money.** The amber is not an alarm — what the box holds is his cost
 * and his profit, owner-only figures, and it is amber on every quote he has not
 * yet answered. The alarm is the width and the ink inside.
 */
defineProps<{
  /** `−452 from proposed` and `profit 3,405`. Null while nothing is typed. */
  gapLine: { from: string; profit: string } | null
  floorLine: string
  belowFloor: boolean
  empty: boolean
  phone?: boolean
}>()
</script>

<template>
  <div class="gap" :class="{ 'gap--empty': empty, 'gap--loss': belowFloor }">
    <div v-if="gapLine" class="gap-line">
      <SText :type="phone ? 'money' : 'count'" color="fg-2">{{ gapLine.from }}</SText>
      <SText :type="phone ? 'money' : 'count'">{{ gapLine.profit }}</SText>
    </div>

    <SText
      :type="phone ? 'caption' : 'row-meta'"
      :color="belowFloor ? 'risk' : 'fg-2'"
      :class="{ loss: belowFloor }"
    >
      {{ floorLine }}
    </SText>
  </div>
</template>

<style scoped>
.gap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--color-risk);
  border-radius: var(--radius-md);
  transition: border-color 120ms ease-out, border-width 120ms ease-out;
}

/*
 * Nothing typed, so there is no gap and no profit — only the line asking for a
 * figure. The amber comes off with the figures it belonged to: an empty box
 * ringed in warning reads as a problem, and having typed nothing yet is not
 * one. Dashed, because the box is not holding anything yet.
 */
.gap--empty {
  border-style: dashed;
  border-color: var(--color-fg-3);
}

/* Under water. The border doubles rather than changing colour — it is already
   amber — and the padding gives the extra pixel back, so the box stays the size
   it was and the lines inside it do not shift as he types past the floor. */
.gap--loss {
  border-width: 2px;
  padding: 11px 13px;
}

.gap-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

/* The one line on this screen that is allowed to raise its voice. */
.loss {
  font-weight: 600;
}
</style>

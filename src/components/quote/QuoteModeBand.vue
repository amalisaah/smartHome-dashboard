<script setup lang="ts">
import { SText } from '@/components/atoms'

/**
 * The owner band. It says, in words, what the screen below it is showing, and it
 * is on **every** owner-side screen of this surface — including behind an open
 * sheet, which is why it is mounted above them rather than inside the scroll.
 *
 * Its fill is `--color-risk-on-dark`, which is the same value the handoff calls
 * `--band`. Not a new colour: the risk hue at the lightness it needs to be a
 * ground rather than ink, already defined for the dark phone header.
 */
defineProps<{ phone?: boolean }>()
</script>

<template>
  <div class="band" :class="{ 'band--phone': phone }">
    <SText type="micro" color="fg">His view · cost on screen</SText>
    <SText type="micro" color="fg">Owner</SText>
  </div>
</template>

<style scoped>
.band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  /* --band-h. A fixed 32px: it is a rule across the top, not a box that grows. */
  height: 32px;
  padding: 0 24px;
  background: var(--color-risk-on-dark);
  flex: none;
}

.band--phone {
  padding: 0 16px;
}
</style>

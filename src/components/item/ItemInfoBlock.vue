<script setup lang="ts">
import { computed } from 'vue'
import { STagInput, SText } from '@/components/atoms'

/**
 * The words, after the figures. Read-only: on this screen editing is one tap
 * away, not under his thumb — the keywords keep their chips but lose their `×`.
 */
const props = defineProps<{
  keywords: string[]
  notes: string
  supplier: string
  leadDays: string
  reorderLevel: string
}>()

/**
 * The note's first sentence. The frame shows one line of it, and a phone in a
 * customer's house is not where a paragraph gets read — the whole note is a tap
 * away in Edit. Cut at the sentence rather than clamped, so it never ends
 * mid-word.
 */
const shortNote = computed(() => {
  const trimmed = props.notes.trim()
  const end = trimmed.indexOf('. ')
  return end === -1 ? trimmed : trimmed.slice(0, end + 1)
})

/** The three facts he needs when the answer is "we'd have to order it". */
const supplierLine = computed(() =>
  [props.supplier, `${props.leadDays} d lead`, `reorder at ${props.reorderLevel}`]
    .filter(Boolean)
    .join(' · '),
)
</script>

<template>
  <div class="info">
    <STagInput :model-value="keywords" readonly aria-label="Keywords" />
    <SText type="cell" as="p" color="fg-2" class="note">{{ shortNote }}</SText>
    <SText type="list-meta">{{ supplierLine }}</SText>
  </div>
</template>

<style scoped>
.info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid var(--color-line);
}

/* Prose that wraps takes leading. */
.note {
  line-height: 1.6;
}
</style>

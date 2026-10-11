<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { SText } from '@/components/atoms'

/**
 * What the list says when he arrives back from a delete. One line, and it goes
 * on its own — there is no undo to offer and nothing to decide, so leaving it on
 * the screen would only be a second place for her name to sit.
 */
defineProps<{ name: string }>()

const emit = defineEmits<{ done: [] }>()

/** Long enough to read a name, short enough not to become part of the footer. */
const SHOWN_FOR_MS = 6000

let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  timer = setTimeout(() => emit('done'), SHOWN_FOR_MS)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="notice" role="status" aria-live="polite">
    <SText type="row-meta" color="fg">{{ name }} deleted.</SText>
    <SText type="cell-meta">no undo</SText>
  </div>
</template>

<style scoped>
.notice {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 10px 20px;
  background: var(--color-row-risk-tint);
  border-top: 1px solid var(--color-line);
}
</style>

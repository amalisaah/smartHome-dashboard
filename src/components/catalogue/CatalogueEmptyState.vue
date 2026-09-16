<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'

defineProps<{
  query: string
  /** The phone door is 48px; the laptop primary is 44px. */
  phone?: boolean
}>()

defineEmits<{ addQuery: [] }>()
</script>

<template>
  <div class="empty">
    <SText type="heading" as="h2">Nothing matches &ldquo;{{ query }}&rdquo;</SText>
    <SText type="body" color="fg-2">
      Nothing in the catalogue carries that name or keyword.
    </SText>
    <SButton :size="phone ? 'lg' : 'md'" @click="$emit('addQuery')">
      Add &ldquo;{{ query }}&rdquo;
    </SButton>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 48px 20px;
}
</style>

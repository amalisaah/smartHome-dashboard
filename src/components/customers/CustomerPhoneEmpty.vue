<script setup lang="ts">
import { SButton, SText } from '@/components/atoms'

defineProps<{ query: string }>()

defineEmits<{ addQuery: [] }>()
</script>

<template>
  <div class="empty">
    <SText type="body" color="fg-2">Nobody called "{{ query }}".</SText>
    <!-- The name he could not find is carried over rather than typed twice. -->
    <SButton variant="primary" size="phone-wide" class="add" @click="$emit('addQuery')">
      Add "{{ query }}" as new
    </SButton>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  padding: 24px 16px;
}

.add {
  width: 100%;
}
</style>

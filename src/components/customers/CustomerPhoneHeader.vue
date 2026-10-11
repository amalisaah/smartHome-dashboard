<script setup lang="ts">
import { SButton, SInput, SText } from '@/components/atoms'

const query = defineModel<string>('query', { required: true })

defineEmits<{ newCustomer: [] }>()
</script>

<template>
  <div class="phone-header">
    <div class="title-row">
      <SText type="frame-title" as="h1" color="inverse">Customers</SText>
      <SButton variant="inverse" size="phone-bar" @click="$emit('newCustomer')">+ New</SButton>
    </div>
    <!-- 16px: below that, iOS zooms the page on focus. -->
    <SInput
      v-model="query"
      variant="on-dark"
      size="phone"
      aria-label="Search everyone — name or phone"
      placeholder="Name or phone"
    />
  </div>
</template>

<style scoped>
.phone-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: var(--color-fg);
  /* The search stays reachable while the list scrolls. */
  position: sticky;
  top: 0;
  z-index: 2;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>

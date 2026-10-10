<script setup lang="ts">
import { ref } from 'vue'
import { SBadge, SInput, SText } from '@/components/atoms'
import CustomerNameFields from './CustomerNameFields.vue'
import type { CustomerDraft } from '@/types/customers'

defineProps<{
  draft: CustomerDraft
  /** `phone` is D3's 48px door; `md` the laptop dialog's. */
  size?: 'phone' | 'md'
}>()

const emit = defineEmits<{ phoneLeft: [] }>()

/** The name is the first thing typed, wherever this form is opened. */
const nameFields = ref<InstanceType<typeof CustomerNameFields> | null>(null)
defineExpose({ focus: () => nameFields.value?.focus() })
</script>

<template>
  <div class="fields">
    <!-- Name and Phone are shared with block F's edit form; what follows is
         this form's own, because it is only asked when a record is started. -->
    <CustomerNameFields
      ref="nameFields"
      :fields="draft"
      :size="size"
      phone-required
      @phone-left="emit('phoneLeft')"
    />

    <SInput
      v-model="draft.asked"
      label="What she asked about · optional"
      :size="size ?? 'phone'"
      placeholder="e.g. cameras first, lights later"
    />

    <!-- Display copy: he is told what will happen, not asked to choose it. -->
    <span class="starts-as">
      <SText type="row-meta" color="fg-2-soft">Starts as</SText>
      <SBadge variant="category-outlined" size="inline">enquiry</SBadge>
      <SText type="row-meta" color="fg-2-soft">· today counts as first contact</SText>
    </span>
  </div>
</template>

<style scoped>
.fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.starts-as {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>

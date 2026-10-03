<script setup lang="ts">
import { ref } from 'vue'
import { SBadge, SInput, SText } from '@/components/atoms'
import type { CustomerDraft } from '@/types/customers'

defineProps<{
  draft: CustomerDraft
  /** `phone` is D3's 48px door; `md` the laptop dialog's. */
  size?: 'phone' | 'md'
}>()

const emit = defineEmits<{ phoneLeft: [] }>()

const nameField = ref<InstanceType<typeof SInput> | null>(null)
defineExpose({ focus: () => nameField.value?.focus() })
</script>

<template>
  <div class="fields">
    <SInput
      ref="nameField"
      v-model="draft.name"
      label="Name"
      :size="size ?? 'phone'"
      label-size="md"
      required
    />
    <!-- `focusout`, not `blur`: the listener lands on SInput's wrapper and blur
         does not bubble to it. Leaving the number is when it is worth checking. -->
    <SInput
      v-model="draft.phone"
      label="Phone"
      :size="size ?? 'phone'"
      label-size="md"
      type="tel"
      mono
      required
      @focusout="emit('phoneLeft')"
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

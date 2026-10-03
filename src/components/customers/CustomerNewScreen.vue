<script setup lang="ts">
import { computed } from 'vue'
import { SButton, SText } from '@/components/atoms'
import CustomerDuplicateNotice from './CustomerDuplicateNotice.vue'
import CustomerNewFields from './CustomerNewFields.vue'
import { isDraftSaveable, type CustomerDraft, type DuplicateMatch } from '@/types/customers'

const props = defineProps<{
  draft: CustomerDraft
  duplicate: DuplicateMatch | null
  saving?: boolean
}>()

defineEmits<{
  cancel: []
  saveAndOpenHouse: []
  save: []
  openDuplicate: [id: number]
  phoneLeft: []
}>()

const saveable = computed(() => isDraftSaveable(props.draft) && !props.saving)
</script>

<template>
  <div class="screen">
    <div class="header">
      <!-- A 44px target around a 14px word. -->
      <button type="button" class="cancel" @click="$emit('cancel')">
        <SText type="cell" color="muted-dark">Cancel</SText>
      </button>
      <SText type="screen-title" as="h1" color="inverse">New customer</SText>
      <span class="spacer" aria-hidden="true" />
    </div>

    <div class="body">
      <CustomerNewFields :draft="draft" @phone-left="$emit('phoneLeft')" />
    </div>

    <div class="actions">
      <SButton
        variant="primary"
        size="phone-cta"
        class="wide"
        :disabled="!saveable"
        @click="$emit('saveAndOpenHouse')"
      >
        Save and start her house →
      </SButton>
      <SButton
        variant="ghost"
        size="phone-ghost"
        class="wide"
        :disabled="!saveable"
        @click="$emit('save')"
      >
        Just save her
      </SButton>
    </div>

    <CustomerDuplicateNotice
      v-if="duplicate"
      :duplicate="duplicate"
      class="notice"
      @open="$emit('openDuplicate', $event)"
    />
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-fg);
}

.cancel {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-flag);
}

.cancel:hover :deep(.s-text) {
  color: var(--color-inverse);
}

.cancel:focus-visible {
  outline: 2px solid var(--color-action-on-dark);
  outline-offset: 2px;
}

/* Balances Cancel so the title sits centred on the header, not on what is left. */
.spacer {
  width: 44px;
  flex: none;
}

.body {
  padding: 18px 16px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--color-line);
}

.wide {
  width: 100%;
}

.notice {
  margin: 0 16px 16px;
}
</style>

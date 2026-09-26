<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { SBadge, SButton, SText } from '@/components/atoms'
import type { SaveStatus } from '@/composables/useItemDetail'
import { NEW_ITEM_TITLE, NO_GROUP_LABEL, UNTITLED, type ItemGroupRef } from '@/types/item'

const props = defineProps<{
  name: string
  group: ItemGroupRef | null
  /** The last save, the changes not yet saved, or what the connection means. */
  status: SaveStatus
  /** The record is open for typing. */
  editing?: boolean
  /** Something differs from the record, so there is something to save or throw away. */
  dirty?: boolean
  /** The write is in flight, so the header does not take a second press. */
  saving?: boolean
  /**
   * The record does not exist yet: the form is always open, the primary creates
   * rather than saves, and there is nothing to archive.
   */
  creating?: boolean
}>()

defineEmits<{ archive: []; edit: []; save: []; discard: []; cancel: [] }>()

const title = computed(() => props.name.trim() || (props.creating ? NEW_ITEM_TITLE : UNTITLED))
const untitled = computed(() => props.name.trim() === '')
</script>

<template>
  <div class="header">
    <div class="identity">
      <RouterLink :to="{ name: 'catalogue' }" class="crumb">
        <SText type="cell-meta" color="micro">Catalogue ›</SText>
      </RouterLink>

      <SText type="frame-title" as="h1" :color="untitled ? 'fg-3' : undefined">
        {{ title }}
      </SText>

      <!-- Solid: the group is his to choose. Dashed in risk when there isn't one. -->
      <SBadge v-if="group" variant="received" size="state">{{ group.name }}</SBadge>
      <SBadge v-else variant="missing" size="state">{{ NO_GROUP_LABEL }}</SBadge>
    </div>

    <div class="status">
      <!-- Unsaved work reads in risk: doing nothing costs something. -->
      <SText
        type="cell-meta"
        :color="status.tone === 'risk' ? 'risk' : undefined"
        role="status"
        aria-live="polite"
      >
        {{ status.label }}
      </SText>

      <template v-if="editing || creating">
        <!-- Two exits, never a third: Save or Discard, or Cancel when clean. -->
        <SButton
          v-if="dirty"
          variant="ghost"
          size="md"
          :disabled="saving"
          @click="$emit('discard')"
        >
          Discard
        </SButton>
        <SButton v-else variant="ghost" size="md" @click="$emit('cancel')">Cancel</SButton>

        <SButton size="md" :disabled="!dirty" :loading="saving" @click="$emit('save')">
          {{ creating ? 'Create item' : 'Save' }}
        </SButton>
      </template>

      <SButton v-else variant="secondary" size="md" @click="$emit('edit')">Edit</SButton>

      <!-- Reversible, so the ordinary button carrying the warning. Out of reach
           while dirty: it would archive something other than what is on screen. -->
      <SButton
        v-if="!creating"
        variant="secondary-risk"
        size="md"
        :disabled="dirty || saving"
        @click="$emit('archive')"
      >
        Archive
      </SButton>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-line);
}

.identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.crumb {
  flex: none;
  text-decoration: none;
  border-radius: var(--radius-flag);
}

.crumb:hover :deep(.s-text) {
  color: var(--color-action);
}

.crumb:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

.status {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
</style>

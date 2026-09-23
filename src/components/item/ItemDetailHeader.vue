<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { SBadge, SButton, SText } from '@/components/atoms'
import type { SaveStatus } from '@/composables/useItemDetail'
import { NO_GROUP_LABEL, UNTITLED, type ItemGroupRef } from '@/types/item'

const props = defineProps<{
  name: string
  group: ItemGroupRef | null
  /**
   * What the screen has to say about the work: the last save, or the changes
   * that have not been saved, or what the connection means for them.
   */
  status: SaveStatus
  /** The record is open for typing. */
  editing?: boolean
  /** Something differs from the record, so there is something to save or throw away. */
  dirty?: boolean
  /** The write is in flight, so the header does not take a second press. */
  saving?: boolean
}>()

defineEmits<{ archive: []; edit: []; save: []; discard: []; cancel: [] }>()

/** An emptied name still has to be referred to by something. */
const title = computed(() => props.name.trim() || UNTITLED)
const untitled = computed(() => props.name.trim() === '')
</script>

<template>
  <div class="header">
    <div class="identity">
      <!-- The breadcrumb is the way back to A, and the only navigation here. -->
      <RouterLink :to="{ name: 'catalogue' }" class="crumb">
        <SText type="cell-meta" color="micro">Catalogue ›</SText>
      </RouterLink>

      <SText type="frame-title" as="h1" :color="untitled ? 'fg-3' : undefined">
        {{ title }}
      </SText>

      <!-- Solid, because the group is his to choose. Dashed and in risk when
           there isn't one: a blank that is holding something up. -->
      <SBadge v-if="group" variant="received" size="state">{{ group.name }}</SBadge>
      <SBadge v-else variant="missing" size="state">{{ NO_GROUP_LABEL }}</SBadge>
    </div>

    <div class="status">
      <!-- Unsaved work reads in risk: it is the one state here where doing
           nothing costs something. -->
      <SText
        type="cell-meta"
        :color="status.tone === 'risk' ? 'risk' : undefined"
        role="status"
        aria-live="polite"
      >
        {{ status.label }}
      </SText>

      <template v-if="editing">
        <!-- Two exits, and never a third: with changes it is Save or Discard,
             without them there is nothing to save and Cancel is the way out. -->
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
          Save
        </SButton>
      </template>

      <SButton v-else variant="secondary" size="md" @click="$emit('edit')">Edit</SButton>

      <!-- The only removal there is, and it is reversible — so it is the
           ordinary button carrying the warning, not a red one. Out of reach
           while there is unsaved work: archiving with a draft open would be
           archiving something other than what is on screen. -->
      <SButton
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
  /* The name is the one thing here allowed to run out of room. */
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

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { SBadge, SButton, SText } from '@/components/atoms'
import { NO_GROUP_LABEL, UNTITLED, type ItemGroupRef } from '@/types/item'

const props = defineProps<{
  name: string
  group: ItemGroupRef | null
  /** `Saved 2 minutes ago`, from the screen's own clock. */
  savedLabel: string
  offline?: boolean
  /** The record is open for typing. `Edit` becomes `Done`. */
  editing?: boolean
}>()

defineEmits<{ archive: []; edit: []; done: [] }>()

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
      <!-- There is no Save button. This line is the confirmation. -->
      <SText
        type="cell-meta"
        :color="offline ? 'risk' : undefined"
        role="status"
        aria-live="polite"
      >
        {{ offline ? 'No connection — saved on this device' : savedLabel }}
      </SText>

      <!-- The record opens locked. `Done` is not a save — every field has
           already saved on its own blur — it only puts the record back to
           being read, which is why it is not a primary button. -->
      <SButton v-if="editing" variant="secondary" size="md" @click="$emit('done')">Done</SButton>
      <SButton v-else variant="secondary" size="md" @click="$emit('edit')">Edit</SButton>

      <!-- The only removal there is, and it is reversible — so it is the
           ordinary button carrying the warning, not a red one. -->
      <SButton variant="secondary-risk" size="md" @click="$emit('archive')">Archive</SButton>
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

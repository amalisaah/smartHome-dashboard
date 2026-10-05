<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { SText } from '@/components/atoms'
import {
  EDIT_VISIT_NOTES,
  FROM_THE_VISIT,
  INTERNET_LABEL,
  WIRING_LABEL,
} from '@/data/houseRoomsCopy'

/**
 * The two facts from the visit that decide what each room can take.
 *
 * They sit beside the room list and not inside it, read-only, because a room
 * with no neutral behind its switch box cannot have a smart switch whatever its
 * type says — and he is more likely to notice that while looking at the room
 * than while looking at the note. Editing stays on Visit notes, which is where
 * the words were written; the link goes there rather than opening a field here.
 */
defineProps<{ customerId: number; houseId: number; wiring: string; internet: string }>()
</script>

<template>
  <section class="card">
    <div class="head">
      <SText type="column-header" color="micro" as="h2">{{ FROM_THE_VISIT }}</SText>
      <RouterLink
        :to="{ name: 'house-detail', params: { id: customerId, houseId } }"
        class="link"
      >
        <SText type="tab" color="action-ink">{{ EDIT_VISIT_NOTES }}</SText>
      </RouterLink>
    </div>

    <div class="entry">
      <SText type="label">{{ WIRING_LABEL }}</SText>
      <SText type="cell" class="prose">{{ wiring }}</SText>
    </div>

    <div class="entry">
      <SText type="label">{{ INTERNET_LABEL }}</SText>
      <SText type="cell" class="prose">{{ internet }}</SText>
    </div>
  </section>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-line);
}

.entry {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* `cell` declares no leading, because a table row takes its height from its own
   padding. This is prose that wraps, so it takes the leading the reference
   draws it at. */
.prose {
  line-height: 1.55;
  text-wrap: pretty;
}

.link {
  text-decoration: none;
  border-radius: var(--radius-flag);
}

.link:hover :deep(.s-text) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
</style>

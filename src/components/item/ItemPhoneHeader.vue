<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { SText } from '@/components/atoms'
import { NO_GROUP_LABEL, UNTITLED, type ItemGroupRef } from '@/types/item'

const props = defineProps<{
  name: string
  group: ItemGroupRef | null
  /** Where back goes. Defaults to the catalogue — the Edit form points at the item. */
  backTo?: RouteLocationRaw
  /** Overrides the crumb's words when back is somewhere other than the catalogue. */
  backLabel?: string
  /** Overrides the title — the Edit form is a form, not the item. */
  title?: string
  /** The save timestamp, when the screen is one that saves. */
  savedLabel?: string
  offline?: boolean
}>()

const heading = computed(() => props.title ?? (props.name.trim() || UNTITLED))

/** The way back, and where back goes — the group he came through. */
const back = computed(
  () => props.backLabel ?? `‹ Catalogue · ${props.group?.name ?? NO_GROUP_LABEL}`,
)
</script>

<template>
  <div class="header">
    <RouterLink :to="backTo ?? { name: 'catalogue' }" class="back">
      <SText type="cell-meta" color="muted-dark" class="crumb">{{ back }}</SText>
    </RouterLink>
    <!-- The name wraps freely. In a customer's house it is the first thing he
         has to confirm he is looking at the right thing, so it is never cut. -->
    <SText type="heading" as="h1" color="inverse" class="name">{{ heading }}</SText>
    <!-- There is no Save button here either. This line is the confirmation. -->
    <SText
      v-if="savedLabel"
      type="cell-meta"
      :color="offline ? 'risk' : 'muted-dark'"
      role="status"
      aria-live="polite"
    >
      {{ offline ? 'No connection — saved on this device' : savedLabel }}
    </SText>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: var(--color-fg);
}

/* Flex, so the box is the height of the 11px mono crumb inside it. As a block it
   would take the header's own 15px sans strut and stand 19px — 5px taller than
   the line it draws, which the whole header would then inherit. */
.back {
  position: relative;
  display: flex;
  align-items: center;
  align-self: flex-start;
  max-width: 100%;
  text-decoration: none;
}

/* The door reaches 48px without the header growing to hold it. Stretching the
   link itself would push the whole header 4px past the drawn geometry, so the
   target is an overlay instead: it takes the thumb, and takes no space. */
.back::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: var(--hit-min);
}

.back:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
  border-radius: var(--radius-flag);
}

/* A crumb naming a long item runs out of room before the title does. */
.crumb {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.name {
  line-height: 1.25;
}
</style>

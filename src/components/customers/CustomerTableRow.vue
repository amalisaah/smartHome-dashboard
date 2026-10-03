<script setup lang="ts">
import { computed } from 'vue'
import { SBadge, SButton, SText } from '@/components/atoms'
import {
  CONTACT_KIND_LABEL,
  STATUS_BADGE,
  type CustomerRow,
  type LoggedContact,
} from '@/types/customers'
import { splitOnMatch } from '@/utils/format'

const props = defineProps<{
  row: CustomerRow
  query: string
  /** The contact logged against this row in this session, if there is one. */
  logged: LoggedContact | null
}>()

defineEmits<{
  open: []
  spoke: []
}>()

// Two moments: no `logged` entry, or one — the dialog collects the note before
// the entry is written, so there is no half-logged row. A different status in
// the answer is the third thing to render, and nothing here decides it.
const status = computed(() => props.logged?.result?.status ?? props.row.status)
const stage = computed(() => props.logged?.result?.stage ?? props.row.stage)
const statusCaption = computed(
  () => props.logged?.result?.statusCaption ?? props.row.statusCaption,
)

const nameParts = computed(() => splitOnMatch(props.row.name, props.query))
const phoneParts = computed(() => splitOnMatch(props.row.phone, props.query))
</script>

<template>
  <div
    class="row"
    role="row"
    tabindex="0"
    @click="$emit('open')"
    @keydown.enter.self.prevent="$emit('open')"
    @keydown.space.self.prevent="$emit('open')"
  >
    <!-- Never an area, never a house. -->
    <span class="cell cell--customer" role="cell">
      <SText type="ui">
        <template v-for="(part, index) in nameParts" :key="index">
          <mark v-if="part.match" class="match">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </SText>
      <SText type="list-meta">
        <template v-for="(part, index) in phoneParts" :key="index">
          <mark v-if="part.match" class="match">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </SText>
    </span>

    <!-- One chip, and the caption the log's answer may add under it. -->
    <span class="cell cell--stacked" role="cell">
      <SBadge :variant="STATUS_BADGE[status]" size="status">{{ status }}</SBadge>
      <SText v-if="statusCaption" type="hint" color="action-ink">{{ statusCaption }}</SText>
    </span>

    <SText type="list-meta" color="fg-2" role="cell">{{ stage }}</SText>

    <span class="cell cell--stacked" role="cell">
      <template v-if="logged">
        <SText type="cell-prompt" color="action-ink">today</SText>
      </template>
      <template v-else>
        <SText
          type="list-figure"
          :color="row.warn ? 'risk' : undefined"
          :class="{ 'figure--warn': row.warn }"
        >
          {{ row.quietForDays }} d
        </SText>
        <!-- Dashed always: the calendar set this and no click of his can. -->
        <SBadge
          v-if="row.dormantInDays !== null"
          :variant="row.soon ? 'missing' : 'dormant'"
          size="countdown"
        >
          dormant in {{ row.dormantInDays }} d
        </SBadge>
      </template>
    </span>

    <span class="cell cell--said" role="cell">
      <SText v-if="logged && logged.note.trim()" type="cell" class="pretty">
        {{ logged.note.trim() }}
      </SText>
      <SText v-else-if="logged" type="cell" color="fg-2" class="pretty">Spoke — no note</SText>
      <SText v-else type="cell" color="fg-2" class="pretty">{{ row.lastSaid ?? '—' }}</SText>
    </span>

    <!-- The press opens the dialog; nothing is written here. Clicks in this
         cell never open her. -->
    <span class="cell cell--contact" role="cell" @click.stop>
      <SText v-if="logged" type="list-meta" color="action-ink" class="stamp">
        ✓ {{ CONTACT_KIND_LABEL[logged.kind] }} · {{ logged.time }}
      </SText>
      <SButton v-else variant="chrome" size="row" @click="$emit('spoke')">Spoke today</SButton>
    </span>
  </div>
</template>

<style scoped>
/* The last row keeps its divider, unlike the catalogue's: the reference draws it
   against the footer's own top rule. */
.row {
  display: grid;
  grid-template-columns: var(--customer-columns);
  gap: 16px;
  padding: 12px 20px;
  min-height: 60px;
  border-bottom: 1px solid var(--color-divider);
  align-items: center;
  cursor: pointer;
  /* Colour only — nothing on this screen animates position or size. */
  transition: background-color 120ms ease-out;
}

.row:hover {
  background: var(--color-row-hover);
}

.row:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.cell--customer {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cell--stacked {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

/* The cell must be able to be narrower than the field's intrinsic width. */
.cell--said {
  min-width: 0;
}

.cell--contact {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

/* The ink comes from the `color` prop; SText carries no role for the weight. */
.figure--warn {
  font-weight: 600;
}

.pretty {
  text-wrap: pretty;
}

.stamp {
  white-space: nowrap;
}

.match {
  background: var(--color-match-highlight);
  color: inherit;
  border-radius: 3px;
}
</style>

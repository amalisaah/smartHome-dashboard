<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SCombobox } from '@/components/atoms'
import { formatCount } from '@/utils/format'

const props = defineProps<{
  /** Every item name in the catalogue, which is what the field searches. */
  catalogueNames: string[]
}>()

const emit = defineEmits<{
  /** A line for this name belongs in the table, new to the catalogue or not. */
  pick: [name: string, isNew: boolean]
}>()

/** Structural, not `InstanceType`: SCombobox is generic over its option type. */
const field = ref<{ focus: () => void; clear: () => void } | null>(null)
const query = ref('')

const options = computed(() =>
  props.catalogueNames.map((name) => ({ label: name, value: name })),
)

const trimmed = computed(() => query.value.trim())

const matchCount = computed(() => {
  const needle = trimmed.value.toLowerCase()
  if (!needle) return null
  return props.catalogueNames.filter((name) => name.toLowerCase().includes(needle)).length
})

/** Nothing matched, so the only way forward is to create the item here. */
const noMatch = computed(() => matchCount.value === 0)

const hint = computed(() =>
  noMatch.value ? `no match in ${formatCount(props.catalogueNames.length)} items` : undefined,
)

/**
 * One handler for both paths: the combobox hands over whatever was settled on,
 * and whether the catalogue already knows the name is what makes it new.
 */
function onSettle(name: string | number) {
  const value = String(name).trim()
  if (!value) return
  emit('pick', value, !props.catalogueNames.includes(value))
  query.value = ''
}

defineExpose({ focus: () => field.value?.focus() })
</script>

<template>
  <div class="create-row">
    <SCombobox
      ref="field"
      class="field"
      :options="options"
      :hint="hint"
      hide-chevron
      create-on-enter
      size="row"
      placeholder="Add an item…"
      aria-label="Add an invoice line"
      @update:query="query = $event"
      @update:model-value="onSettle"
    />

    <!-- Appears only when there is nothing to match, and creates in place. -->
    <SButton
      v-if="noMatch"
      variant="create"
      size="md"
      @click="onSettle(trimmed)"
    >
      + create "{{ trimmed }}" inline
    </SButton>
  </div>
</template>

<style scoped>
.create-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-line);
}

.field {
  flex: 1;
  min-width: 0;
}
</style>

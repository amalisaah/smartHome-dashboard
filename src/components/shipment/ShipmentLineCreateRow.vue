<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SCombobox } from '@/components/atoms'
import { formatCount } from '@/utils/format'

const props = defineProps<{
  /** Every item in the catalogue, which is what the field searches. */
  items: { id: number; name: string }[]
}>()

const emit = defineEmits<{
  /**
   * A line for this name belongs in the table. `itemId` is null when the
   * catalogue has never heard of it — saving is what will create the item.
   */
  pick: [name: string, itemId: number | null]
}>()

/** Structural, not `InstanceType`: SCombobox is generic over its option type. */
const field = ref<{ focus: () => void; clear: () => void } | null>(null)
const query = ref('')

const options = computed(() => props.items.map((item) => ({ label: item.name, value: item.name })))

const trimmed = computed(() => query.value.trim())

const matchCount = computed(() => {
  const needle = trimmed.value.toLowerCase()
  if (!needle) return null
  return props.items.filter((item) => item.name.toLowerCase().includes(needle)).length
})

/** Nothing matched, so the only way forward is to create the item here. */
const noMatch = computed(() => matchCount.value === 0)

const hint = computed(() =>
  noMatch.value ? `no match in ${formatCount(props.items.length)} items` : undefined,
)

/**
 * One handler for both paths: the combobox hands over whatever was settled on,
 * and whether the catalogue already knows the name is what makes it new.
 */
function onSettle(name: string | number) {
  const value = String(name).trim()
  if (!value) return
  const known = props.items.find((item) => item.name === value)
  emit('pick', value, known?.id ?? null)
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

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SInput, SSelect, STagInput, STextarea } from '@/components/atoms'
import PhotoDropZone from '@/components/item/PhotoDropZone.vue'
import type { ItemDraft, ItemGroupRef, ItemUnitOption } from '@/types/item'

/**
 * Everything he types, and nothing the system decided. One component for both
 * frames, so the laptop and the phone can never drift apart in what they offer
 * or the order they offer it in.
 */
const props = defineProps<{
  draft: ItemDraft
  groups: ItemGroupRef[]
  units: ItemUnitOption[]
  /** The phone's Edit form: one column, and every door at 48px. */
  stacked?: boolean
  /** Read, not typed. Every field goes inert; the values keep full ink. */
  locked?: boolean
  /**
   * Said in the row that has the problem, as its consequence. Only the name can
   * have one: every other field is optional to the item and to the wire.
   */
  nameError?: string
}>()

const emit = defineEmits<{ photo: [file: File]; commit: [] }>()

const groupOptions = computed(() => props.groups.map((it) => ({ label: it.name, value: it.id })))
const unitOptions = computed(() => props.units.map((it) => ({ label: it.label, value: it.value })))

/** 42px on the laptop as drawn, 48px on a phone. */
const door = computed(() => (props.stacked ? 'lg' : 'field') as 'lg' | 'field')

const nameField = ref<InstanceType<typeof SInput> | null>(null)
defineExpose({ focus: () => nameField.value?.focus() })

/** `<select>` yields strings; null is the no-group state and must survive. */
function setGroup(value: number | string) {
  props.draft.groupId = value === '' ? null : Number(value)
}
</script>

<template>
  <div class="fields" :class="{ 'fields--stacked': stacked }">
    <!-- 1 — Name + Group -->
    <div class="row row--name">
      <SInput
        ref="nameField"
        v-model="draft.name"
        label="Name"
        :size="door"
        :disabled="locked"
        placeholder="Untitled item"
        :error="!!nameError"
        :error-message="nameError"
      />
      <SSelect
        :model-value="draft.groupId ?? ''"
        label="Group"
        :size="door"
        :disabled="locked"
        placeholder="no group"
        :options="groupOptions"
        @update:model-value="setGroup"
      />
    </div>

    <!-- 2 — Keywords -->
    <STagInput
      v-model="draft.keywords"
      label="Keywords"
      :size="stacked ? 'lg' : 'md'"
      :disabled="locked"
      @commit="emit('commit')"
    />

    <!-- 3 — Supplier, Supplier link, Supplier contact -->
    <div class="row row--three">
      <SInput v-model="draft.supplier" label="Supplier" :size="door" :disabled="locked" />
      <SInput v-model="draft.supplierLink" label="Supplier link" :size="door" :disabled="locked" />
      <!-- Read digit by digit, so mono like every figure. -->
      <SInput
        v-model="draft.supplierContact"
        label="Supplier contact"
        :size="door"
        :disabled="locked"
        mono
      />
    </div>

    <!-- 4 — Lead time, Reorder level, Unit -->
    <div class="row row--three">
      <SInput
        v-model="draft.leadDays"
        label="Lead time"
        :size="door"
        :disabled="locked"
        mono
        align="right"
        suffix="days"
      />
      <SInput
        v-model="draft.reorderLevel"
        label="Reorder level"
        :size="door"
        :disabled="locked"
        mono
        align="right"
      />
      <SSelect
        v-model="draft.unit"
        label="Unit"
        :size="door"
        :disabled="locked"
        :options="unitOptions"
      />
    </div>

    <!-- 5 — Notes + Photo -->
    <div class="row row--notes">
      <STextarea
        v-model="draft.notes"
        label="Notes"
        :rows="4"
        :disabled="locked"
        placeholder="What the installer needs to know in the van."
      />
      <PhotoDropZone
        label="Photo"
        :photo-url="draft.photoUrl"
        :disabled="locked"
        @select="emit('photo', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.row {
  display: grid;
  gap: 16px;
}

.row--name {
  grid-template-columns: 2fr 1fr;
}

.row--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.row--notes {
  grid-template-columns: 1fr 200px;
  align-items: start;
}

.fields--stacked .row {
  grid-template-columns: minmax(0, 1fr);
}
</style>

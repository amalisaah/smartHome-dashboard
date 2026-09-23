<script setup lang="ts">
import { computed, ref } from 'vue'
import { SInput, SSelect, STagInput, STextarea } from '@/components/atoms'
import PhotoDropZone from '@/components/item/PhotoDropZone.vue'
import type { ItemDraft, ItemGroupRef, ItemUnitOption } from '@/types/item'

/**
 * Everything he types, in the handoff's order, and nothing the system decided.
 * The laptop lays it out in the grids the reference draws; the phone's Edit form
 * takes the same rows as one column, so the two can never drift apart in what
 * they offer or in the order they offer it.
 */
const props = defineProps<{
  draft: ItemDraft
  groups: ItemGroupRef[]
  units: ItemUnitOption[]
  /** The phone's Edit form: one column, and every door at 48px. */
  stacked?: boolean
  /**
   * Read, not typed. Every field goes inert and recedes onto `--surface`; the
   * values stay at full ink, because the locked record is still what he came to
   * look at.
   */
  locked?: boolean
}>()

const emit = defineEmits<{
  photo: [file: File]
  /**
   * A keyword landed or went. The column saves on a blur, and removing a chip
   * by click blurs nothing — so the tag input says so itself.
   */
  commit: []
}>()

const groupOptions = computed(() => props.groups.map((it) => ({ label: it.name, value: it.id })))
const unitOptions = computed(() => props.units.map((it) => ({ label: it.label, value: it.value })))

/** One door per posture: 42px on the laptop as drawn, the 48px one on a phone. */
const door = computed(() => (props.stacked ? 'lg' : 'field') as 'lg' | 'field')

const nameField = ref<InstanceType<typeof SInput> | null>(null)
defineExpose({ focus: () => nameField.value?.focus() })

/**
 * `<select>` yields strings even from numeric options, so the group comes back
 * as one. Null is the no-group state and has to survive the round trip.
 */
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
      <!-- A contact is read digit by digit, so it is mono like every figure. -->
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

/* The notes take the room; the photo takes the width it is read at. */
.row--notes {
  grid-template-columns: 1fr 200px;
  align-items: start;
}

/* The phone's Edit form: the same rows, one under another. */
.fields--stacked .row {
  grid-template-columns: minmax(0, 1fr);
}
</style>

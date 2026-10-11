<script setup lang="ts">
import { ref } from 'vue'
import { SInput, SText } from '@/components/atoms'
import RoomTypeChoice from '@/components/house/RoomTypeChoice.vue'
import { ADD_ROOM, ROOM_ADD_PLACEHOLDER } from '@/data/houseRoomsCopy'
import type { ApiSpaceSlug } from '@/types/api'

/**
 * The row at the bottom of the table, for rooms he walked past.
 *
 * It is the phone's dock laid out as a table row — the same field, the same
 * guess arriving as he types, the same six chips, and the same rule that return
 * adds the room and leaves the caret where it is. Nothing new is collected at
 * the desk that was not collected in the house.
 */
defineProps<{
  text: string
  type: ApiSpaceSlug | null
  guessed: boolean
}>()

const emit = defineEmits<{
  'update:text': [value: string]
  pick: [type: ApiSpaceSlug]
  add: []
}>()

const field = ref<InstanceType<typeof SInput> | null>(null)

const keepTyping = () => field.value?.focus()

defineExpose({ focus: keepTyping })

function submit() {
  emit('add')
  keepTyping()
}
</script>

<template>
  <form class="row" @submit.prevent="submit">
    <SText type="ref" color="action-ink" class="plus" aria-hidden="true">+</SText>

    <SInput
      ref="field"
      :model-value="text"
      :placeholder="ROOM_ADD_PLACEHOLDER"
      aria-label="Add a room"
      size="note"
      class="field"
      @update:model-value="emit('update:text', $event)"
    />

    <RoomTypeChoice
      :model-value="type"
      :guessed="guessed"
      size="grid"
      aria-label="Type for the room being added"
      @update:model-value="emit('pick', $event)"
    />

    <button type="submit" class="add" :title="ADD_ROOM" :aria-label="ADD_ROOM">+</button>
  </form>
</template>

<style scoped>
/* The same four tracks as a room row, so the field starts where the names do
   and the chips land under the chips above them. */
.row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 470px 36px;
  gap: 16px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-line);
}

.plus {
  justify-self: start;
}

/* The field carries its own box here — unlike a room row's, which is a name
   that already exists and only becomes a field when reached for. This one is a
   blank waiting to be typed into, and a blank with no box is not an invitation. */
.field {
  min-width: 0;
  /* Pulls the value back under the column head, as the flat fields above it. */
  margin-left: -10px;
}

.add {
  width: 32px;
  height: 32px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  border: none;
  border-radius: var(--radius-chip);
  background: var(--color-action);
  color: var(--color-inverse);
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.add:hover {
  background: var(--color-action-hover);
}

.add:active {
  transform: translateY(1px);
}

.add:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}
</style>

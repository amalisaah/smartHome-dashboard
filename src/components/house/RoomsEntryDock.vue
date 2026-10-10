<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SInput } from '@/components/atoms'
import RoomCommonNames from '@/components/house/RoomCommonNames.vue'
import RoomTypeChoice from '@/components/house/RoomTypeChoice.vue'
import {
  ROOM_FIELD_ADD,
  ROOM_FIELD_LABEL,
  ROOM_FIELD_PLACEHOLDER,
} from '@/data/houseRoomsCopy'
import type { CommonRoomName } from '@/types/houseRooms'
import type { ApiSpaceSlug } from '@/types/api'

/**
 * The dock above the keyboard, and the reason the whole tab works.
 *
 * **The field never closes.** Return or `Add` puts the room in the list,
 * empties the box, resets the chips and leaves the caret exactly where it was —
 * seven rooms is seven names and seven returns, with no save, no sheet and no
 * back. Everything here is arranged around not interrupting that: the common
 * names are a row he can tap without losing the caret, and the type chips are
 * beside the field rather than behind a step.
 */
const props = defineProps<{
  text: string
  /** The type in force for what is being typed, his pick or the system's guess. */
  type: ApiSpaceSlug | null
  guessed: boolean
  commonNames: readonly CommonRoomName[]
}>()

const emit = defineEmits<{
  'update:text': [value: string]
  pick: [type: ApiSpaceSlug]
  add: []
  addCommon: [common: CommonRoomName]
}>()

const field = ref<InstanceType<typeof SInput> | null>(null)

/** The caret goes back where it was, whatever just happened to the list. */
const keepTyping = () => field.value?.focus()

defineExpose({ focus: keepTyping })

function submit() {
  emit('add')
  keepTyping()
}

function addCommon(common: CommonRoomName) {
  emit('addCommon', common)
  keepTyping()
}

/** A chip is picked without the caret leaving the field it belongs to. */
function pick(type: ApiSpaceSlug) {
  emit('pick', type)
  keepTyping()
}

/** An empty or whitespace-only entry does nothing — a stray return is not a room. */
const canAdd = computed(() => props.text.trim() !== '')
</script>

<template>
  <div class="dock">
    <RoomCommonNames :names="commonNames" size="phone" @add="addCommon" />

    <form class="entry" @submit.prevent="submit">
      <SInput
        ref="field"
        :model-value="text"
        :placeholder="ROOM_FIELD_PLACEHOLDER"
        :aria-label="ROOM_FIELD_LABEL"
        size="phone"
        enter-key-hint="next"
        class="field"
        @update:model-value="emit('update:text', $event)"
      />
      <!-- Submit, so the phone's own return key adds the room and the button is
           the same act rather than a second one wired separately. -->
      <SButton type="submit" size="lg" :disabled="!canAdd">{{ ROOM_FIELD_ADD }}</SButton>
    </form>

    <RoomTypeChoice
      :model-value="type"
      :guessed="guessed"
      size="draft"
      aria-label="Type for this room"
      @update:model-value="pick"
    />
  </div>
</template>

<style scoped>
.dock {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px 14px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-line);
}

.entry {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.field {
  flex: 1;
  min-width: 0;
}
</style>

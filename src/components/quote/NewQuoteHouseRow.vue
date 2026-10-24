<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { SButton, SText } from '@/components/atoms'
import { ADD_ROOMS, NO_ROOMS_YET, READING_ROOMS } from '@/data/newQuoteCopy'
import { isQuotable, roomsPhrase, type NewQuoteHouse } from '@/types/newQuote'

/**
 * One house in step 2 — the same row on both devices.
 *
 * **A house with no rooms is not a row he can press.** The quote's rooms come
 * from the house, so a house nobody has walked would start a quote with nothing
 * to put lines against. It states that in words and offers the screen that
 * fixes it, rather than being greyed out with no explanation.
 *
 * A house whose count has not landed is drawn the same way as a quotable one
 * and simply cannot be pressed yet: it will be one or the other in a moment,
 * and flashing it through the can't-quote treatment on the way would be a
 * sentence he had no time to read and that was not true.
 */
const props = defineProps<{
  house: NewQuoteHouse
  customerId: number
  /** Offline, or a draft already in flight. The row is drawn but inert. */
  inert?: boolean
}>()

defineEmits<{ pick: [] }>()

const router = useRouter()

const quotable = computed(() => isQuotable(props.house))
const counting = computed(() => props.house.roomCount === null)
const pressable = computed(() => quotable.value && !props.inert)

/** The visit screen, which is where rooms are walked — Customers A. */
const addRooms = () =>
  router.push({
    name: 'house-detail',
    params: { id: props.customerId, houseId: props.house.id },
  })
</script>

<template>
  <button
    v-if="quotable || counting"
    type="button"
    class="row row--pressable"
    :disabled="!pressable"
    @click="$emit('pick')"
  >
    <SText type="row-name" as="span">{{ house.area }}</SText>

    <span class="right">
      <SText type="list-meta" :color="counting ? 'action' : 'fg-2'">
        {{ counting ? READING_ROOMS : roomsPhrase(house) }}
      </SText>
      <span class="chev" aria-hidden="true">›</span>
    </span>
  </button>

  <div v-else class="row">
    <span class="who">
      <SText type="row-name" color="fg-2" as="span">{{ house.area }}</SText>
      <SText type="list-meta" color="fg-2">{{ NO_ROOMS_YET }}</SText>
    </span>

    <SButton variant="secondary-action" size="md" class="add" @click="addRooms">
      {{ ADD_ROOMS }}
    </SButton>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 10px 16px;
  box-sizing: border-box;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-divider);
  color: inherit;
  text-align: left;
}

.row--pressable {
  cursor: pointer;
  transition: background-color 120ms ease-out;
}

.row--pressable:hover:not(:disabled),
.row--pressable:active:not(:disabled) {
  background: var(--color-surface);
}

/* Inert, not disabled-looking. Offline or mid-create, the house is still the
   right answer and the row still says so — it just cannot be taken yet. */
.row--pressable:disabled {
  cursor: default;
}

.row--pressable:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: -2px;
}

.who {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.chev {
  font-size: 18px;
  line-height: 1;
  color: var(--color-action);
}

.add {
  flex: none;
}
</style>

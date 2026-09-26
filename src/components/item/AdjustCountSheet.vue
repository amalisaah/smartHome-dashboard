<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  SButton,
  SInput,
  SSegmented,
  SSelect,
  SText,
  STextarea,
} from '@/components/atoms'
import { ADJUST_REASONS, OTHER_REASON } from '@/data/itemOptions'
import { DELTA_COLOR, type MovementKind } from '@/types/item'
import type { AdjustBasis } from '@/composables/useItemDetail'

/**
 * The only way stock moves. It asks for a reason because a count that changed
 * without one is what this screen exists to prevent, and it writes a movement
 * rather than editing a total. A bottom sheet on the phone, a dialog on the laptop.
 */
const props = defineProps<{
  /** What the count stands at now, so `New count` opens on it. */
  stockNow: number
  reasonError: string
  amountError: string
  /** The movement this will write, in the Movements-row format. */
  consequence: { delta: string; kind: MovementKind; text: string } | null
  /** Nothing is red until he has tried to record. */
  pressed: boolean
  phone?: boolean
  /** The write is in flight, so the sheet does not take a second press. */
  recording?: boolean
  /** The write came back refused. Said here, where the press was. */
  writeError?: string
}>()

const basis = defineModel<AdjustBasis>('basis', { required: true })
const countDraft = defineModel<string>('countDraft', { required: true })
const deltaDraft = defineModel<string>('deltaDraft', { required: true })
const reason = defineModel<string>('reason', { required: true })
const freeReason = defineModel<string>('freeReason', { required: true })

const emit = defineEmits<{ record: []; dismiss: [] }>()

const BASIS_OPTIONS: { label: string; value: AdjustBasis }[] = [
  { label: '± Change', value: 'delta' },
  { label: 'New count', value: 'count' },
]

const reasonOptions = computed(() =>
  [...ADJUST_REASONS, OTHER_REASON].map((it) => ({ label: it, value: it })),
)

const writingOwnReason = computed(() => reason.value === OTHER_REASON)

const sheetEl = ref<HTMLDivElement | null>(null)
const amountField = ref<InstanceType<typeof SInput> | null>(null)
const freeField = ref<InstanceType<typeof STextarea> | null>(null)

/** Choosing to write his own reason should put the caret where he writes it. */
watch(writingOwnReason, async (own) => {
  if (!own) return
  await nextTick()
  freeField.value?.focus()
})

/** Switching the basis moves the caret to the field that just appeared. */
watch(basis, async () => {
  await nextTick()
  amountField.value?.focus()
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('dismiss')
    return
  }
  if (event.key !== 'Tab') return

  const focusable = sheetEl.value?.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea',
  )
  if (!focusable || focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  amountField.value?.focus()
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="scrim" :class="{ 'scrim--phone': phone }" @mousedown.self="emit('dismiss')">
    <div
      ref="sheetEl"
      class="sheet"
      :class="{ 'sheet--phone': phone }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-title"
    >
      <SText id="adjust-title" type="dialog-title" as="h2">Adjust count</SText>

      <!-- `± Change` first: on site he knows what went, not what is left. -->
      <SSegmented v-model="basis" :options="BASIS_OPTIONS" size="lg" class="basis" />

      <SInput
        v-if="basis === 'delta'"
        ref="amountField"
        v-model="deltaDraft"
        label="Change"
        :size="phone ? 'lg' : 'field'"
        mono
        align="right"
        placeholder="−1"
        :caption="`Stock stands at ${stockNow}.`"
        :error="pressed && !!amountError"
        :error-message="amountError"
      />
      <SInput
        v-else
        ref="amountField"
        v-model="countDraft"
        label="New count"
        :size="phone ? 'lg' : 'field'"
        mono
        align="right"
        :caption="`Stock stands at ${stockNow}.`"
        :error="pressed && !!amountError"
        :error-message="amountError"
      />

      <SSelect
        v-model="reason"
        label="Reason"
        required
        :size="phone ? 'lg' : 'field'"
        placeholder="Why is it changing?"
        :options="reasonOptions"
        :error="pressed && !!reasonError"
        :error-message="reasonError"
      />
      <!-- The rest is prose, and prose gets the field that holds prose. -->
      <STextarea
        v-if="writingOwnReason"
        ref="freeField"
        v-model="freeReason"
        :rows="2"
        placeholder="Say what happened."
        aria-label="Reason"
      />

      <!-- What is about to be written, in the shape he will later read it in. -->
      <div class="consequence">
        <template v-if="consequence">
          <SText type="money" :color="DELTA_COLOR[consequence.kind]">
            {{ consequence.delta }}
          </SText>
          <SText type="row-meta" color="fg-2">{{ consequence.text }}</SText>
        </template>
        <SText v-else type="row-meta" color="fg-3">
          Nothing to record yet.
        </SText>
      </div>

      <SText v-if="writeError" type="row-meta" color="risk" class="write-error" role="alert">
        {{ writeError }}
      </SText>

      <div class="buttons">
        <SButton
          :size="phone ? 'lg' : 'md'"
          class="record"
          :loading="recording"
          @click="emit('record')"
        >
          Record movement
        </SButton>
        <SButton
          variant="ghost"
          :size="phone ? 'lg' : 'md'"
          :disabled="recording"
          @click="emit('dismiss')"
        >
          Cancel
        </SButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--color-scrim);
}

/* On a phone the sheet comes up from the edge he is holding. */
.scrim--phone {
  align-items: flex-end;
  padding: 0;
}

.sheet {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 420px;
  max-width: 100%;
  padding: 22px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-2);
  line-height: normal;
  animation: sheet-in 200ms ease-out;
}

.sheet--phone {
  width: 100%;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  border-bottom: none;
  animation: sheet-up 200ms ease-out;
}

@keyframes sheet-in {
  from {
    opacity: 0;
  }
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet,
  .sheet--phone {
    animation: none;
  }
}

.basis {
  align-self: stretch;
}

/* Above the button, because it is what the button will do. */
.consequence {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--color-divider);
}

/* Above the press that failed, not in a banner behind the sheet. */
.write-error {
  line-height: 1.5;
}

.buttons {
  display: flex;
  gap: 8px;
}

.record {
  flex: 1;
}
</style>

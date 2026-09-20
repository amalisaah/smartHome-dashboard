<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { SButton, SText } from '@/components/atoms'
import { RECEIVE_NOTE } from '@/data/shipmentCopy'
import type { ChipTone, ConsequenceLine } from '@/types/shipment'

const props = defineProps<{
  /** Empty while the shipment is unsaved and has no number yet. */
  shipmentRef: string
  /** What receiving will do, counted from the preview rows by the caller. */
  consequences: ConsequenceLine[]
}>()

const emit = defineEmits<{ receive: []; dismiss: [] }>()

/** `Receive SH-015?`, or `Receive this shipment?` before it has a number. */
const subject = computed(() => props.shipmentRef || 'this shipment')

const dialogEl = ref<HTMLDivElement | null>(null)
const confirmButton = ref<InstanceType<typeof SButton> | null>(null)

const FIGURE_COLOR: Record<ChipTone, 'action' | 'fg-2' | 'risk'> = {
  action: 'action',
  neutral: 'fg-2',
  warn: 'risk',
}

/** Receiving is the irreversible act, so the dialog holds the keyboard. */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('dismiss')
    return
  }
  if (event.key !== 'Tab') return

  const focusable = dialogEl.value?.querySelectorAll<HTMLElement>('button, [href], input, select')
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
  ;(confirmButton.value?.$el as HTMLElement | undefined)?.focus()
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="scrim">
    <div
      ref="dialogEl"
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receive-title"
    >
      <SText id="receive-title" type="dialog-title" as="h2">Receive {{ subject }}?</SText>

      <div class="consequences">
        <div v-for="line in consequences" :key="line.text" class="consequence">
          <SText type="count" :color="FIGURE_COLOR[line.tone]" class="figure">
            {{ line.figure }}
          </SText>
          <SText type="cell">{{ line.text }}</SText>
        </div>
      </div>

      <SText type="caption" class="note">{{ RECEIVE_NOTE }}</SText>

      <div class="buttons">
        <SButton ref="confirmButton" size="md" @click="$emit('receive')">Receive it</SButton>
        <SButton variant="ghost" size="md" @click="$emit('dismiss')">Not yet</SButton>
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

.dialog {
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
}

.consequences {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* The one place in this screen that reads as prose rather than as a table. */
  line-height: 1.6;
}

.consequence {
  display: flex;
  gap: 10px;
}

.figure {
  flex: none;
}

.note {
  line-height: 1.6;
  padding-top: 12px;
  border-top: 1px solid var(--color-divider);
}

.buttons {
  display: flex;
  gap: 8px;
}
</style>

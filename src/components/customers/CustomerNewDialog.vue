<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { SButton, SText } from '@/components/atoms'
import CustomerDuplicateNotice from './CustomerDuplicateNotice.vue'
import CustomerNewFields from './CustomerNewFields.vue'
import { isDraftSaveable, type CustomerDraft, type DuplicateMatch } from '@/types/customers'

const props = defineProps<{
  draft: CustomerDraft
  duplicate: DuplicateMatch | null
  saving?: boolean
}>()

const emit = defineEmits<{
  saveAndOpenHouse: []
  save: []
  dismiss: []
  openDuplicate: [id: number]
}>()

const saveable = computed(() => isDraftSaveable(props.draft) && !props.saving)

const dialogEl = ref<HTMLDivElement | null>(null)
const fields = ref<InstanceType<typeof CustomerNewFields> | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('dismiss')
    return
  }

  // Enter presses the primary from any field — three lines and two of them required.
  if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
    event.preventDefault()
    if (saveable.value) emit('saveAndOpenHouse')
    return
  }

  if (event.key !== 'Tab') return

  const focusable = dialogEl.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input, select',
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
  fields.value?.focus()
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="scrim" @mousedown.self="$emit('dismiss')">
    <div
      ref="dialogEl"
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-customer-title"
    >
      <SText id="new-customer-title" type="dialog-title" as="h2">New customer</SText>

      <CustomerNewFields ref="fields" :draft="draft" size="md" />

      <CustomerDuplicateNotice
        v-if="duplicate"
        :duplicate="duplicate"
        @open="$emit('openDuplicate', $event)"
      />

      <div class="buttons">
        <SButton size="md" :disabled="!saveable" @click="$emit('saveAndOpenHouse')">
          Save and start her house →
        </SButton>
        <SButton variant="secondary" size="md" :disabled="!saveable" @click="$emit('save')">
          Just save her
        </SButton>
        <span class="spacer" aria-hidden="true" />
        <SButton variant="ghost" size="md" @click="$emit('dismiss')">Cancel</SButton>
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

/* Wider than the 420px dialogs: this one holds a form, and the two save doors
   have to sit on one row with a way out beside them. */
.dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 520px;
  max-width: 100%;
  padding: 22px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-2);
  line-height: normal;
}

.buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--color-divider);
}

.spacer {
  flex: 1;
}
</style>

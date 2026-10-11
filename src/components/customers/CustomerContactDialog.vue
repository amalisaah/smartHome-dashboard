<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { SButton, SSelect, SText, STextarea } from '@/components/atoms'
import {
  CONTACT_KIND_OPTIONS,
  type ContactKind,
  type ContactLogDraft,
  type CustomerRow,
} from '@/types/customers'

/**
 * What he reached her by, and what she said. The contact is written when this
 * is submitted, not when the row's button was pressed — so Cancel is the way
 * back, and it is the only one: an entry, once written, cannot be deleted.
 */
const props = defineProps<{
  row: CustomerRow
  draft: ContactLogDraft
  saving?: boolean
  /** A write that came back other than 2xx. The dialog stays open holding it. */
  error?: string
}>()

const emit = defineEmits<{
  submit: []
  dismiss: []
}>()

const dialogEl = ref<HTMLDivElement | null>(null)
const noteField = ref<InstanceType<typeof STextarea> | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('dismiss')
    return
  }

  if (event.key !== 'Tab') return

  const focusable = dialogEl.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input, select, textarea',
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
  // The kind already answers itself with Call; the note is what he came to type.
  noteField.value?.focus()
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

const setKind = (kind: ContactKind) => (props.draft.kind = kind)
const setNote = (note: string) => (props.draft.note = note)
</script>

<template>
  <div class="scrim" @mousedown.self="$emit('dismiss')">
    <div ref="dialogEl" class="dialog" role="dialog" aria-modal="true" aria-labelledby="log-title">
      <div>
        <SText id="log-title" type="dialog-title" as="h2">Log contact</SText>
        <SText type="meta" color="fg-2">{{ row.name }} · {{ row.phone || 'no number' }}</SText>
      </div>

      <SSelect
        label="How"
        :model-value="draft.kind"
        :options="CONTACT_KIND_OPTIONS"
        :disabled="saving"
        @update:model-value="setKind"
      />

      <STextarea
        ref="noteField"
        label="Notes"
        :model-value="draft.note"
        :rows="3"
        :disabled="saving"
        placeholder="What did she say? Optional."
        @update:model-value="setNote"
      />

      <!-- Said where the problem is, as what it costs: nothing was recorded. -->
      <SText v-if="error" type="meta" color="risk">{{ error }}</SText>

      <div class="buttons">
        <SButton size="md" :disabled="saving" @click="$emit('submit')">
          {{ saving ? 'Logging…' : 'Log contact' }}
        </SButton>
        <span class="spacer" aria-hidden="true" />
        <SButton variant="ghost" size="md" :disabled="saving" @click="$emit('dismiss')">
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

/* Narrower than the new-customer dialog: two fields and one door. */
.dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 440px;
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

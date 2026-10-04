<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SInput, SText, STextarea } from '@/components/atoms'
import CustomerNameFields from './CustomerNameFields.vue'
import { useDialogKeys } from '@/composables/useDialogKeys'
import {
  isEditSaveable,
  isEditUnchanged,
  type CustomerEditDraft,
  type EditableCustomer,
} from '@/types/customers'

/**
 * Her details, corrected — name, number, email and what to remember about her.
 *
 * A dialog rather than a screen for the same reason the list adds an enquiry in
 * one: her page stays behind it, with its scroll position and everything else on
 * it. Nothing is written until he saves, so Cancel is a real way out — unlike a
 * contact, an edit *can* be undone, but by making the opposite edit, which is
 * not the same as never having made it.
 *
 * Only the name is required, because `PATCH /customers/{id}` says so: `name` is
 * not nullable on the wire and the other three are.
 *
 * Her notes are shown on the page behind this but not editable there: this is
 * the one place they are written, so there is no second field to disagree with.
 */
const props = defineProps<{
  record: EditableCustomer
  draft: CustomerEditDraft
  saving?: boolean
  /** A write that came back other than 2xx. The dialog stays open holding it. */
  error?: string
}>()

const emit = defineEmits<{ save: []; dismiss: [] }>()

/** Nothing to save when the name is gone, or when nothing actually changed. */
const saveable = computed(
  () =>
    isEditSaveable(props.draft) &&
    !isEditUnchanged(props.draft, props.record) &&
    !props.saving,
)

const dialogEl = ref<HTMLDivElement | null>(null)
const fields = ref<InstanceType<typeof CustomerNameFields> | null>(null)

useDialogKeys(dialogEl, {
  onDismiss: () => emit('dismiss'),
  // Her name is the first thing in the form and the thing most often wrong.
  initialFocus: () => fields.value?.focus(),
})

/**
 * Enter commits only what the button would commit, and only from a one-line
 * field. In the notes it is a new paragraph — a form holding prose cannot submit
 * on the key that writes it.
 */
function onEnter(event: KeyboardEvent) {
  if (!(event.target instanceof HTMLInputElement)) return
  event.preventDefault()
  if (saveable.value) emit('save')
}
</script>

<template>
  <div class="scrim" @mousedown.self="emit('dismiss')">
    <div
      ref="dialogEl"
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-customer-title"
      @keydown.enter="onEnter"
    >
      <div>
        <SText id="edit-customer-title" type="dialog-title" as="h2">Her details</SText>
        <!-- Whose record this is, since the name below it is about to change. -->
        <SText type="meta" color="fg-2">{{ record.name }}</SText>
      </div>

      <div class="fields">
        <CustomerNameFields ref="fields" :fields="draft" size="md" />

        <!-- What counts as a valid address is the API's call; nothing here
             blocks the save on it. -->
        <SInput
          v-model="draft.email"
          label="Email · optional"
          type="email"
          size="md"
        />

        <!-- The same field as the one on the page behind, same endpoint. -->
        <STextarea
          v-model="draft.notes"
          label="Notes about her"
          :rows="3"
          placeholder="Prefers voice notes to calls. Pays promptly."
        />
      </div>

      <!-- Said where the problem is, as what it costs: nothing was changed. -->
      <SText v-if="error" type="meta" color="risk">{{ error }}</SText>

      <div class="buttons">
        <SButton size="md" :disabled="!saveable" :loading="saving" @click="emit('save')">
          Save
        </SButton>
        <span class="spacer" aria-hidden="true" />
        <SButton variant="ghost" size="md" :disabled="saving" @click="emit('dismiss')">
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

/* The new-customer dialog's width: it holds the same fields, and two forms for
   the same two values may not be drawn on different sheets. */
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

/* The gap the new-customer form puts between its fields. */
.fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

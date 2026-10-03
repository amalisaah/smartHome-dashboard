<script setup lang="ts">
import { SButton, SInput, SText } from '@/components/atoms'
import CustomerCopyLine from '@/components/customers/CustomerCopyLine.vue'
import { useDialogKeys } from '@/composables/useDialogKeys'
import { deleteCost, deleteSwapLead, deleteSwapLink } from '@/data/customerRemovalCopy'
import { confirmsName, type RemovalFigures } from '@/types/customerDetail'
import { computed, defineEmits, defineProps, ref } from 'vue'

/**
 * The exit that cannot be undone, and the only amber on this screen.
 *
 * It does three things the anonymise dialog does not: it counts what the delete
 * costs before asking for anything, it offers the other exit from inside itself,
 * and it holds its own door shut until her name is typed. The gate is not a
 * spelling test — case and surrounding spaces are ignored — it is a way of
 * making him name whose records these are before they go.
 */
const props = defineProps<{
  name: string
  figures: RemovalFigures
}>()

const emit = defineEmits<{ confirm: []; dismiss: []; swap: [] }>()

const cost = computed(() => deleteCost(props.figures))

const typed = ref('')
const confirmed = computed(() => confirmsName(typed.value, props.name))

const dialogEl = ref<HTMLDivElement | null>(null)
const nameField = ref<InstanceType<typeof SInput> | null>(null)

useDialogKeys(dialogEl, {
  onDismiss: () => emit('dismiss'),
  // The gate is what he came to pass, so the caret is already in it.
  initialFocus: () => nameField.value?.focus(),
})

/** Enter commits only what the button would commit. */
function onEnter() {
  if (confirmed.value) emit('confirm')
}
</script>

<template>
  <div class="scrim" @mousedown.self="emit('dismiss')">
    <div
      ref="dialogEl"
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
    >
      <SText id="delete-title" type="frame-title" color="risk" as="h2">
        Delete {{ name }} and all her records?
      </SText>

      <!-- What it costs, counted. Counts only — no amounts anywhere in this
           module — and the month last, because that is the part he will feel. -->
      <div class="cost">
        <CustomerCopyLine
          v-for="(line, index) in cost.lines"
          :key="index"
          :line="line"
          type="cell"
          quiet-color="fg-2"
        />
      </div>

      <!-- The other exit, offered from inside this one. -->
      <SText type="cell" color="fg-2">
        {{ deleteSwapLead }}<button type="button" class="swap" @click="emit('swap')">
          <SText type="cell" color="action-ink">{{ deleteSwapLink }}</SText>
        </button>.
      </SText>
      <SInput
        ref="nameField"
        v-model="typed"
        label="Type her name to confirm"
        size="field"
        :error="true"
        @keydown.enter.prevent="onEnter"
      />

      <div class="buttons">
        <SButton variant="ghost" size="toolbar" @click="emit('dismiss')">Cancel</SButton>
        <SButton
          variant="destructive"
          size="toolbar"
          :disabled="!confirmed"
          @click="emit('confirm')"
        >
          Delete forever
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

/* 2px of amber, where every other dialog on this system draws 1px of line. The
   border is the warning; nothing inside it has to shout. */
.dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 520px;
  max-width: 100%;
  padding: 24px;
  background: var(--color-bg);
  border: 2px solid var(--color-risk);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-2);
  line-height: normal;
}

.cost {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: var(--color-row-risk-tint);
  border-radius: var(--radius-md);
  line-height: 1.6;
}

/* A word inside a sentence, so it carries the sentence's underline rather than
   a box of its own. */
.swap {
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-flag);
}

.swap:hover :deep(.s-text) {
  color: var(--color-action);
}

.swap:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

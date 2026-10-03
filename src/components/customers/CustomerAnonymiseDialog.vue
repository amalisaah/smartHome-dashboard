<script setup lang="ts">
import { computed, ref } from 'vue'
import { SButton, SText } from '@/components/atoms'
import { useDialogKeys } from '@/composables/useDialogKeys'
import { anonymiseBody } from '@/data/customerRemovalCopy'
import type { RemovalFigures } from '@/types/customerDetail'

/**
 * The exit the screen recommends. It states what is erased, what survives and
 * under what name, and then says plainly that it cannot be reversed — the
 * details are gone, not hidden.
 *
 */
const props = defineProps<{
  name: string
  figures: RemovalFigures
}>()

const emit = defineEmits<{ confirm: []; dismiss: [] }>()

const body = computed(() => anonymiseBody(props.figures))

const dialogEl = ref<HTMLDivElement | null>(null)
const keepButton = ref<InstanceType<typeof SButton> | null>(null)

useDialogKeys(dialogEl, {
  onDismiss: () => emit('dismiss'),
  initialFocus: () => (keepButton.value?.$el as HTMLElement | undefined)?.focus(),
})
</script>

<template>
  <div class="scrim" @mousedown.self="emit('dismiss')">
    <div
      ref="dialogEl"
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="anonymise-title"
    >
      <SText id="anonymise-title" type="frame-title" as="h2">
        Anonymise {{ name }}?
      </SText>

      <SText type="cell" color="fg-2" class="body">
        {{ body.before }}<b class="label">{{ body.label }}</b>{{ body.after }}
      </SText>

      <div class="buttons">
        <SButton ref="keepButton" variant="ghost" size="toolbar" @click="emit('dismiss')">
          Keep her
        </SButton>
        <SButton size="toolbar" @click="emit('confirm')">Anonymise</SButton>
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
  width: 520px;
  max-width: 100%;
  padding: 24px;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-2);
  /* The dialog sits outside the frame, so it sets its own rhythm rather than
     taking the document's 1.6 and standing every button 4px taller. */
  line-height: normal;
}

/* Prose, so it takes leading — the fields and buttons around it do not. */
.body {
  line-height: 1.6;
}

.label {
  color: var(--color-fg);
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { SButton, SText } from '@/components/atoms'

/**
 * The one confirm on this screen that guards typed work rather than a record.
 * Archive is reversible and says so; this is not — a discarded draft is gone
 * from the store and from session storage together.
 *
 * It **names the fields** rather than counting them. "Discard 4 changes?" asks
 * him to remember which four; the point of a confirm is to tell him what he is
 * about to lose while he can still keep it.
 */
const props = defineProps<{
  /** The fields that differ, as the labels above them read. */
  changes: string[]
}>()

const emit = defineEmits<{ discard: []; keep: [] }>()

/** `name, group and selling price` — a list read as a sentence, not a bullet. */
const listed = computed(() => {
  const all = props.changes
  if (all.length === 1) return all[0]
  return `${all.slice(0, -1).join(', ')} and ${all[all.length - 1]}`
})

const dialogEl = ref<HTMLDivElement | null>(null)
/** Focus opens on Keep: the destructive one should not be one keystroke away. */
const keepButton = ref<InstanceType<typeof SButton> | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('keep')
    return
  }
  if (event.key !== 'Tab') return

  const focusable = dialogEl.value?.querySelectorAll<HTMLElement>('button, [href]')
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
  ;(keepButton.value?.$el as HTMLElement | undefined)?.focus()
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="scrim" @mousedown.self="emit('keep')">
    <div
      ref="dialogEl"
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-title"
    >
      <SText id="discard-title" type="dialog-title" as="h2">
        Discard {{ changes.length === 1 ? 'this change' : 'these changes' }}?
      </SText>

      <SText type="body" class="consequence">
        Your edits to <SText type="ref" color="fg">{{ listed }}</SText> go, and the item keeps what
        it had. Nothing was saved, so there is nothing to undo afterwards.
      </SText>

      <div class="buttons">
        <SButton variant="secondary-risk" size="md" @click="emit('discard')">Discard them</SButton>
        <SButton ref="keepButton" variant="ghost" size="md" @click="emit('keep')">
          Keep editing
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

.consequence {
  line-height: 1.6;
}

.buttons {
  display: flex;
  gap: 8px;
}
</style>

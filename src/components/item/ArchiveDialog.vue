<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { SButton, SText } from '@/components/atoms'
import { UNTITLED } from '@/types/item'

/**
 * The only removal on this screen, and it is reversible — so the dialog names
 * what it costs rather than warning that it is dangerous, and neither button is
 * a red one. `Archive it` carries the same risk ink as the button that opened
 * it; `Keep` is the quiet way out.
 */
const props = defineProps<{ name: string }>()

const emit = defineEmits<{ archive: []; dismiss: [] }>()

const subject = computed(() => props.name.trim() || UNTITLED)

const dialogEl = ref<HTMLDivElement | null>(null)
/** Focus opens on `Keep`: the reversible act still should not be one keystroke. */
const keepButton = ref<InstanceType<typeof SButton> | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('dismiss')
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
  <div class="scrim" @mousedown.self="emit('dismiss')">
    <div
      ref="dialogEl"
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-title"
    >
      <SText id="archive-title" type="dialog-title" as="h2">Archive {{ subject }}?</SText>

      <SText type="body" class="consequence">
        Hidden from the catalogue and from new shipments. Movements are kept. You can restore it
        from Archived.
      </SText>

      <div class="buttons">
        <SButton variant="secondary-risk" size="md" @click="emit('archive')">Archive it</SButton>
        <SButton ref="keepButton" variant="ghost" size="md" @click="emit('dismiss')">Keep</SButton>
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

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { SButton, SInput, SText } from '@/components/atoms'
import { usable } from '@/composables/useGroupsMarkup'
import { bpsToMarkup, markupToBps } from '@/types/groups'

const props = defineProps<{
  /** Names already in the table — a group is refused rather than merged. */
  taken: (name: string) => boolean
}>()

const emit = defineEmits<{ create: [name: string, markup: string]; dismiss: [] }>()

const name = ref('')
const markup = ref('')

/** Nothing is red until he has tried to press. A blank form is not an error. */
const pressed = ref(false)

const dialogEl = ref<HTMLDivElement | null>(null)
const nameField = ref<InstanceType<typeof SInput> | null>(null)

/** Stated as what it stops, not as what it is — the rule the screens share. */
const nameError = computed(() => {
  if (!name.value.trim()) return 'A group needs a name before it can hold items.'
  // Named as the table will hold it — group names are a lowercase vocabulary.
  if (props.taken(name.value)) return `${name.value.trim().toLowerCase()} is already a group.`
  return ''
})

/**
 * Blank is allowed and means 1.00; anything else has to parse. This one does
 * not wait for the press, unlike the name: a field still being filled in is not
 * an error, but `one point six` sitting in a markup field already is, and the
 * caption underneath would otherwise go on promising it lands at 1.00.
 *
 * `1.` mid-decimal parses to 1, so typing a number never flickers red.
 */
const markupError = computed(() =>
  markup.value.trim() === '' || usable(markup.value)
    ? ''
    : 'Not a markup — something like 1.60, or leave it blank.',
)

const valid = computed(() => !nameError.value && !markupError.value)

/** What the row will read the moment it lands, blank field included. */
const landsAt = computed(() =>
  usable(markup.value) ? bpsToMarkup(markupToBps(markup.value)) : '1.00',
)

function submit() {
  pressed.value = true
  if (!valid.value) return
  emit('create', name.value.trim(), markup.value)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('dismiss')
    return
  }

  // Enter presses the primary from either field — the form is two lines long.
  if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
    event.preventDefault()
    submit()
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
  nameField.value?.focus()
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="scrim" @mousedown.self="$emit('dismiss')">
    <div ref="dialogEl" class="dialog" role="dialog" aria-modal="true" aria-labelledby="add-group-title">
      <SText id="add-group-title" type="dialog-title" as="h2">New group</SText>

      <div class="fields">
        <SInput
          ref="nameField"
          v-model="name"
          label="Group name"
          placeholder="smoke &amp; gas"
          required
          :error="pressed && !!nameError"
          :error-message="nameError"
        />

        <!-- Optional, so the field says what blank will do rather than leaving
             him to find out in the row afterwards. -->
        <SInput
          v-model="markup"
          label="Markup"
          size="md"
          mono
          align="right"
          placeholder="1.00"
          :caption="`Optional — the group starts at ${landsAt}.`"
          :error="!!markupError"
          :error-message="markupError"
          class="markup"
        />
      </div>

      <SText type="caption" class="note">
        An empty group reprices nothing. It takes items as you file them into it.
      </SText>

      <div class="buttons">
        <SButton size="md" @click="submit">Create group</SButton>
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

.fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* A markup is a figure, and a short one — the box keeps the width it is read
   at. Only the box: the caption under it is a sentence and takes the dialog. */
.markup :deep(.s-input-wrap) {
  width: 112px;
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

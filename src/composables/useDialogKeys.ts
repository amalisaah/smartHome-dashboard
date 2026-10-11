import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Escape, the Tab trap, and where the caret lands when a dialog opens.
 *
 * It deliberately does **not** restore focus on close. A dialog that can swap
 * itself for another one — delete offering anonymise instead — unmounts while
 * its replacement is mounting, and a dialog restoring focus on the way out would
 * take it off the control the new one just put it on. Where focus returns to is
 * the opener's business, because the opener is the thing it returns to.
 */
export function useDialogKeys(
  container: Ref<HTMLElement | null>,
  options: {
    onDismiss: () => void
    /**
     * Puts focus where the dialog opens it. Given as a call rather than an
     * element because a field knows how to focus itself and a button is its own
     * `$el` — the dialog says which control, not how to reach into it. The first
     * focusable stop, if absent.
     */
    initialFocus?: () => void
  },
) {
  const focusable = () =>
    Array.from(
      container.value?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea',
      ) ?? [],
    )

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      options.onDismiss()
      return
    }

    if (event.key !== 'Tab') return

    const stops = focusable()
    if (stops.length === 0) return

    const first = stops[0]
    const last = stops[stops.length - 1]

    // The disabled gate drops out of `focusable()` as it goes in and out of
    // being pressable, so the ends are read fresh on every Tab rather than once.
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
    if (options.initialFocus) options.initialFocus()
    else focusable()[0]?.focus()
  })

  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}

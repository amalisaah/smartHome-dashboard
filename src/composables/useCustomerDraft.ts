import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { createCustomer, findDuplicate } from '@/api/customers'
import { blankCustomerDraft, type DuplicateMatch } from '@/types/customers'

const DUPLICATE_DEBOUNCE_MS = 200

/**
 * The new-customer draft, shared by D3's phone screen and the laptop's dialog.
 *
 * The draft is a reactive object the fields write into rather than one replaced
 * per keystroke: a whole-object read-modify-write drops one of two fields set in
 * the same tick, which is what a browser autofilling a name and a phone does.
 */
export function useCustomerDraft(initialName = '') {
  const draft = reactive(blankCustomerDraft(initialName))
  const duplicate = ref<DuplicateMatch | null>(null)
  const saving = ref(false)

  let timer: ReturnType<typeof setTimeout> | undefined
  onBeforeUnmount(() => clearTimeout(timer))

  watch(
    () => draft.phone,
    (phone) => {
      clearTimeout(timer)
      duplicate.value = null
      timer = setTimeout(() => {
        findDuplicate(phone)
          .then((match) => {
            if (draft.phone === phone) duplicate.value = match
          })
          // A check that could not run is not a duplicate, and never blocks the save.
          .catch(() => {})
      }, DUPLICATE_DEBOUNCE_MS)
    },
  )

  /** Resolves to the id the save minted. */
  async function save(): Promise<number> {
    saving.value = true
    try {
      const { id } = await createCustomer(draft)
      return id
    } finally {
      saving.value = false
    }
  }

  function reset(name = '') {
    draft.name = name
    draft.phone = ''
    draft.asked = ''
    duplicate.value = null
  }

  return { draft, duplicate, saving, save, reset }
}

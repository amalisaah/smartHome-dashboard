import { reactive, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { createCustomer } from '@/api/customers'
import {
  blankCustomerDraft,
  type CustomerRecord,
  type DuplicateMatch,
} from '@/types/customers'
import { findDuplicateIn } from '@/utils/mapper/customerMapper'

/**
 * The new-customer draft, shared by D3's phone screen and the laptop's dialog.
 *
 * The draft is a reactive object the fields write into rather than one replaced
 * per keystroke: a whole-object read-modify-write drops one of two fields set in
 * the same tick, which is what a browser autofilling a name and a phone does.
 *
 * `existing` is the list the caller already has, so the duplicate check costs
 * no request. It runs when he leaves the phone field and again on the save,
 * not per keystroke: the list is unpaginated, and a scan of all of it is not
 * something to repeat between two digits of the same number.
 */
export function useCustomerDraft(
  existing: MaybeRefOrGetter<readonly CustomerRecord[]>,
  initialName = '',
) {
  const draft = reactive(blankCustomerDraft(initialName))
  const saving = ref(false)
  const duplicate = ref<DuplicateMatch | null>(null)

  /** On leaving the field, and on the save for a number never left. */
  function checkDuplicate() {
    duplicate.value = findDuplicateIn(toValue(existing), draft.phone)
  }

  // Editing the number makes the standing notice stale, and a stale accusation
  // is worse than none. Clearing is a write, not a scan.
  watch(() => draft.phone, () => (duplicate.value = null))

  /** Resolves to the id the save minted. */
  async function save(): Promise<number> {
    // He may have typed the number and pressed Enter without ever leaving it.
    checkDuplicate()
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

  return { draft, duplicate, saving, save, reset, checkDuplicate }
}

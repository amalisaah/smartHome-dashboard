import { computed, reactive, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { createCustomer } from '@/api/customers'
import { blankCustomerDraft, type CustomerRecord } from '@/types/customers'
import { findDuplicateIn } from '@/utils/mapper/customerMapper'

/**
 * The new-customer draft, shared by D3's phone screen and the laptop's dialog.
 *
 * The draft is a reactive object the fields write into rather than one replaced
 * per keystroke: a whole-object read-modify-write drops one of two fields set in
 * the same tick, which is what a browser autofilling a name and a phone does.
 *
 * `existing` is the list the caller already has. The duplicate check reads it
 * rather than the network — the list is unpaginated and in hand, so a keystroke
 * costs a comparison instead of a request, and the notice keeps up with typing.
 */
export function useCustomerDraft(
  existing: MaybeRefOrGetter<readonly CustomerRecord[]>,
  initialName = '',
) {
  const draft = reactive(blankCustomerDraft(initialName))
  const saving = ref(false)

  const duplicate = computed(() => findDuplicateIn(toValue(existing), draft.phone))

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
  }

  return { draft, duplicate, saving, save, reset }
}

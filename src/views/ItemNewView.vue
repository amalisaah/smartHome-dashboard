<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogueGroups } from '@/api/hooks/catalogue'
import { SBanner, SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import ItemNewScreen from '@/components/item/ItemNewScreen.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { ITEM_UNITS } from '@/data/itemOptions'
import { NEW_ITEM_ID, blankItemRecord, type ItemDetail } from '@/types/item'
import { toItemDerived, toItemGroups } from '@/utils/mapper/itemMapper'

/**
 * `/items/new` — the item that does not exist yet.
 *
 * One call, not three: there is no record to fetch and no ledger to fail. A
 * groups failure costs the Group field rather than the form — a name is what an
 * item needs, and filing it is something the item itself can still do later.
 */
const props = defineProps<{
  /** Seeds the name — the catalogue's empty state hands over what he searched for. */
  initialName?: string
}>()

/** Below ~900px the phone layout takes over. There is no third layout. */
const isPhone = useMediaQuery('(max-width: 899px)')

const online = useOnline()

const groupsQuery = useCatalogueGroups()

/** Built once: the fields are diffed against it, so it must not move as he types. */
const record = blankItemRecord()

// The mapper's own figures, with one caption changed: `reorder at 0` is read off
// the record, which is not the level he is typing into the field beside it.
const derived = toItemDerived(record, null, [])
derived.stockOnHand = { ...derived.stockOnHand, source: 'no movements yet' }

const item = computed<ItemDetail>(() => ({
  id: NEW_ITEM_ID,
  draft: record.draft,
  derived,
  groups: toItemGroups(groupsQuery.data.value ?? []),
  units: ITEM_UNITS,
  savedAt: '',
}))
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <SBanner
      v-if="groupsQuery.isError.value"
      variant="warn"
      label="heads up"
      title="The groups could not be loaded."
    >
      The Group field has nothing to offer. Create the item anyway — it can be filed from the item
      itself once they are back.
    </SBanner>

    <SText v-if="groupsQuery.isPending.value" type="body" color="fg-2" class="state">
      Loading…
    </SText>

    <ItemNewScreen
      v-else
      :item="item"
      :is-phone="isPhone"
      :offline="!online"
      :initial-name="props.initialName"
    />
  </AppLayout>
</template>

<style scoped>
/* Sits where the columns would have been, on the same gutter. */
.state {
  padding: 24px 20px;
}
</style>

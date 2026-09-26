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
 * `/items/new` — the item that does not exist yet. It is at its own address
 * rather than at an id, because the id is minted by the create and not by the
 * press that opened a blank form.
 *
 * One call, not three: there is no record to fetch and no ledger to fail. The
 * groups are the only thing it wants from the server, and a failure there costs
 * the Group field rather than the form — a name is what an item needs, and
 * filing it is something the item itself can still do afterwards.
 */
const props = defineProps<{
  /** Seeds the name — the catalogue's empty state hands over what he searched for. */
  initialName?: string
}>()

/** Below ~900px the phone layout takes over. There is no third layout. */
const isPhone = useMediaQuery('(max-width: 899px)')

const online = useOnline()

const groupsQuery = useCatalogueGroups()

/**
 * The blank record, built once: the fields are diffed against it to know what he
 * has filled in, so it must not move while he types. Its figures are the real
 * mapper's output for a record nothing has happened to — `never received`,
 * `no price yet` — which is what the item will say the moment it is created.
 */
const record = blankItemRecord()

/**
 * The mapper's own figures for it, with one caption changed: `reorder at 0` is
 * read off the record, and the record's reorder level is not the one he is
 * typing into the field beside it. Stock comes from movements, and there are
 * none — which is the thing that card can honestly say here.
 */
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

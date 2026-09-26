<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogueGroups } from '@/api/hooks/catalogue'
import { useItem, useItemMovements } from '@/api/hooks/item'
import { SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import ItemDetailScreen from '@/components/item/ItemDetailScreen.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useOnline } from '@/composables/useOnline'
import { ITEM_UNITS } from '@/data/itemOptions'
import type { ItemDetail } from '@/types/item'
import { toItemDerived, toItemGroups } from '@/utils/mapper/itemMapper'

const props = defineProps<{ itemId: number }>()

/** Below ~900px the phone layout takes over. There is no third layout. */
const isPhone = useMediaQuery('(max-width: 899px)')

const online = useOnline()

/**
 * Three calls, three fates. The item carries the fields and the figures; the
 * groups carry the select's options *and* the markup the price is rebuilt from
 * while overridden; the ledger carries the movements.
 *
 * Kept apart so a ledger that fails costs the screen its movements card and not
 * the fields he was typing into.
 */
const itemQuery = useItem(() => props.itemId)
const groupsQuery = useCatalogueGroups()
const movementsQuery = useItemMovements(() => props.itemId)

/**
 * The markup lives on the group, never on the item, so the price's group default
 * cannot be rebuilt until `GET /groups` lands. Null until then — the mapper
 * falls back to the server's own figure rather than inventing one.
 */
const markupBps = computed(() => {
  const record = itemQuery.data.value
  const group = groupsQuery.data.value?.find((it) => it.id === record?.draft.groupId)
  return group?.defaultMarkupBps ?? null
})

/** Null until the item lands — the screen below is not mounted before then. */
const item = computed<ItemDetail | null>(() => {
  const record = itemQuery.data.value
  if (!record) return null

  return {
    id: record.id,
    draft: record.draft,
    derived: toItemDerived(record, markupBps.value, movementsQuery.data.value ?? null),
    groups: toItemGroups(groupsQuery.data.value ?? []),
    units: ITEM_UNITS,
    savedAt: record.updatedAt,
  }
})

/** `isPending` is "nothing cached yet", so revalidating never blanks the screen. */
const loading = computed(() => itemQuery.isPending.value)
</script>

<template>
  <AppLayout :chrome="!isPhone">
    <SText v-if="itemQuery.isError.value" type="body" color="risk" class="state">
      Could not load this item.
    </SText>
    <SText v-else-if="loading" type="body" color="fg-2" class="state">Loading…</SText>

    <ItemDetailScreen
      v-else-if="item"
      :item="item"
      :is-phone="isPhone"
      :offline="!online"
    />
  </AppLayout>
</template>

<style scoped>
/* Sits where the columns would have been, on the same gutter. */
.state {
  padding: 24px 20px;
}
</style>

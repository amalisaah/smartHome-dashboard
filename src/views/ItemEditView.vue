<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogueGroups } from '@/api/hooks/catalogue'
import { useItem, useItemMovements } from '@/api/hooks/item'
import { SText } from '@/components/atoms'
import AppLayout from '@/components/app/AppLayout.vue'
import ItemEditScreen from '@/components/item/ItemEditScreen.vue'
import { useOnline } from '@/composables/useOnline'
import { ITEM_UNITS } from '@/data/itemOptions'
import type { ItemDetail } from '@/types/item'
import { toItemDerived, toItemGroups } from '@/utils/mapper/itemMapper'

/**
 * The phone's Edit form, at its own address rather than as a layer over the
 * item: the back gesture closes the form instead of leaving the record, and a
 * form he is halfway through survives a reload.
 */
const props = defineProps<{ itemId: number }>()

const online = useOnline()

const itemQuery = useItem(() => props.itemId)
const groupsQuery = useCatalogueGroups()
const movementsQuery = useItemMovements(() => props.itemId)

const markupBps = computed(() => {
  const record = itemQuery.data.value
  const group = groupsQuery.data.value?.find((it) => it.id === record?.draft.groupId)
  return group?.defaultMarkupBps ?? null
})

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
</script>

<template>
  <!-- The phone frame is the device; it carries its own header. -->
  <AppLayout :chrome="false">
    <SText v-if="itemQuery.isError.value" type="body" color="risk" class="state">
      Could not load this item.
    </SText>
    <SText v-else-if="itemQuery.isPending.value" type="body" color="fg-2" class="state">
      Loading…
    </SText>

    <ItemEditScreen v-else-if="item" :item="item" :offline="!online" />
  </AppLayout>
</template>

<style scoped>
.state {
  padding: 24px 16px;
}
</style>

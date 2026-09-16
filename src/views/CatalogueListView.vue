<script setup lang="ts">
import { computed } from 'vue'
import AppBar from '@/components/app/AppBar.vue'
import AppTabBar from '@/components/app/AppTabBar.vue'
import CatalogueEmptyState from '@/components/catalogue/CatalogueEmptyState.vue'
import CatalogueFooter from '@/components/catalogue/CatalogueFooter.vue'
import CataloguePhoneActionBar from '@/components/catalogue/CataloguePhoneActionBar.vue'
import CataloguePhoneFilters from '@/components/catalogue/CataloguePhoneFilters.vue'
import CataloguePhoneHeader from '@/components/catalogue/CataloguePhoneHeader.vue'
import CataloguePhoneRow from '@/components/catalogue/CataloguePhoneRow.vue'
import CataloguePhoneSkeleton from '@/components/catalogue/CataloguePhoneSkeleton.vue'
import CatalogueSummaryStrip from '@/components/catalogue/CatalogueSummaryStrip.vue'
import CatalogueTable from '@/components/catalogue/CatalogueTable.vue'
import CatalogueToolbar from '@/components/catalogue/CatalogueToolbar.vue'
import { useCatalogueList } from '@/composables/useCatalogueList'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { DRAFT_SHIPMENTS, SAVE_STATUS_DATE } from '@/data/catalogueMock'
import type { CatalogueItem } from '@/types/catalogue'

const TABS = ['Catalogue', 'Shipments', 'Groups & markup']

/** Below ~900px the phone layout takes over. There is no third layout. */
const isPhone = useMediaQuery('(max-width: 899px)')

const {
  loading,
  online,
  query,
  debouncedQuery,
  groupFilter,
  lowStockOnly,
  attentionOnly,
  sortColumn,
  sortDirection,
  visibleItems,
  toggleSort,
  matchedKeyword,
  totalCount,
  groupCount,
  lowStockCount,
  attentionCount,
  summary,
  isFiltered,
} = useCatalogueList()

const appBarStatus = computed(() =>
  online.value
    ? `${SAVE_STATUS_DATE} · all changes saved`
    : 'No connection — showing last known counts',
)

const showEmptyState = computed(
  () => !loading.value && visibleItems.value.length === 0 && debouncedQuery.value.trim() !== '',
)

// The screens these lead to are out of scope for this handoff.
const openItem = (_item: CatalogueItem) => {}
const logShipment = () => {}
const openDraft = () => {}
const addItemManually = () => {}
const addFromQuery = () => {}
</script>

<template>
  <main class="page">
    <div class="frame">
      <!-- A2 — phone 390 -->
      <template v-if="isPhone">
        <CataloguePhoneHeader v-model:query="query" :total-count="totalCount" :offline="!online" />
        <CataloguePhoneFilters
          v-model:group-filter="groupFilter"
          :low-stock-count="lowStockCount"
          :attention-count="attentionCount"
          :low-stock-only="lowStockOnly"
          :attention-only="attentionOnly"
          @toggle-low-stock="lowStockOnly = !lowStockOnly"
          @toggle-attention="attentionOnly = !attentionOnly"
        />

        <CataloguePhoneSkeleton v-if="loading" />
        <CatalogueEmptyState
          v-else-if="showEmptyState"
          phone
          :query="debouncedQuery.trim()"
          @add-query="addFromQuery"
        />
        <div v-else class="phone-rows">
          <CataloguePhoneRow
            v-for="item in visibleItems"
            :key="item.id"
            :item="item"
            :query="debouncedQuery"
            :matched-keyword="matchedKeyword(item)"
            @open="openItem(item)"
          />
        </div>

        <CataloguePhoneActionBar
          :match-count="visibleItems.length"
          :total-count="totalCount"
          :query="debouncedQuery"
          :filtered="isFiltered"
          @log-shipment="logShipment"
        />
      </template>

      <!-- A1 — laptop 1440 -->
      <template v-else>
        <AppBar :status="appBarStatus" :offline="!online" />
        <AppTabBar :tabs="TABS" active="Catalogue" />
        <CatalogueSummaryStrip
          :loading="loading"
          :capital-in-stock="summary.capitalInStock"
          :units-in-stock="summary.unitsInStock"
          :retail-value="summary.retailValue"
          :restock-count="summary.restockCount"
          :longest-restock-lead="summary.longestRestockLead"
          :drafts="DRAFT_SHIPMENTS"
          @log-shipment="logShipment"
          @open-draft="openDraft"
        />
        <CatalogueToolbar
          v-model:query="query"
          v-model:group-filter="groupFilter"
          :total-count="totalCount"
          :low-stock-count="lowStockCount"
          :attention-count="attentionCount"
          :low-stock-only="lowStockOnly"
          :attention-only="attentionOnly"
          @toggle-low-stock="lowStockOnly = !lowStockOnly"
          @toggle-attention="attentionOnly = !attentionOnly"
        />

        <CatalogueEmptyState
          v-if="showEmptyState"
          :query="debouncedQuery.trim()"
          @add-query="addFromQuery"
        />
        <CatalogueTable
          v-else
          :items="visibleItems"
          :query="debouncedQuery"
          :loading="loading"
          :sort-column="sortColumn"
          :sort-direction="sortDirection"
          @sort="toggleSort"
          @open="openItem"
        />

        <CatalogueFooter
          :total-count="totalCount"
          :group-count="groupCount"
          :sort-column="sortColumn"
          @add-item="addItemManually"
        />
      </template>
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 48px;
  background: var(--color-chrome);
}

.frame {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  background: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-elev-1);
  /* `clip` rather than `hidden`: it rounds the corners without becoming a
     scroll container, so the sticky table header still works. */
  overflow: clip;
  /* The reference sets no line-height, so rows sit at the fonts' own metrics. */
  line-height: normal;
}

@media (max-width: 1100px) {
  .page {
    padding: 24px;
  }
}

/* The phone frame is the device — no chrome around it. */
@media (max-width: 899px) {
  .page {
    padding: 0;
  }

  .frame {
    min-height: 100vh;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
}
</style>

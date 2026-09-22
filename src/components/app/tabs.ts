import type { RouteLocationRaw } from 'vue-router'

export interface AppTab {
  label: string
  to?: RouteLocationRaw
}

export const APP_TABS: AppTab[] = [
  { label: 'Catalogue', to: { name: 'catalogue' } },
  { label: 'Shipments', to: { name: 'shipments' } },
  { label: 'Groups & markup', to: { name: 'groups' } },
]

import type { RouteLocationRaw } from 'vue-router'

/**
 * The sections of the app, in the order the tab bar draws them. A tab with no
 * `to` is a section that has no screen yet: it is drawn, and it does nothing.
 */
export interface AppTab {
  label: string
  to?: RouteLocationRaw
}

export const APP_TABS: AppTab[] = [
  { label: 'Catalogue', to: { name: 'catalogue' } },
  { label: 'Shipments', to: { name: 'shipments' } },
  { label: 'Groups & markup' },
]

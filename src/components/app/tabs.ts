import type { RouteLocationRaw } from 'vue-router'

export interface AppTab {
  label: string
  to?: RouteLocationRaw
  /**
   * A path prefix this tab owns, for a section whose **list** is not built but
   * whose detail screens are. Jobs is the one: block C records a job, block E
   * lists them and does not exist yet, so the tab has nowhere to send him and
   * still has to light up while he is on `/jobs/0098`.
   *
   * A tab with a `to` needs none of this — it owns whatever its own path
   * prefixes.
   */
  owns?: string
}

export const APP_TABS: AppTab[] = [
  { label: 'Catalogue', to: { name: 'catalogue' } },
  { label: 'Quotes', to: { name: 'quotes' } },
  // No list to send him to — block E — so the label is inert and simply says
  // which section he is in when a quote's acceptance has led him here.
  { label: 'Jobs', owns: '/jobs' },
  { label: 'Customers', to: { name: 'customers' } },
  { label: 'Shipments', to: { name: 'shipments' } },
  { label: 'Groups & markup', to: { name: 'groups' } },
]

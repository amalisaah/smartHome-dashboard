import { createRouter, createWebHistory } from 'vue-router'
import { NEW_DRAFT } from '@/composables/useShipmentBuilder'
import AllocationPreviewView from '@/views/AllocationPreviewView.vue'
import CatalogueListView from '@/views/CatalogueListView.vue'
import DesignSystemView from '@/views/DesignSystemView.vue'
import ShipmentBuilderView from '@/views/ShipmentBuilderView.vue'
import ShipmentsListView from '@/views/ShipmentsListView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'catalogue',
      component: CatalogueListView,
    },
    {
      path: '/shipments',
      name: 'shipments',
      component: ShipmentsListView,
    },
    {
      // A shipment he has just started is not addressed by a ref, because it
      // does not have one: it is given a number when he saves it, not by the
      // click that opened a blank form. Declared above `:ref` so it wins.
      path: '/shipments/new',
      name: 'shipment-new',
      component: ShipmentBuilderView,
      props: { shipmentRef: NEW_DRAFT },
    },
    {
      path: '/shipments/new/preview',
      name: 'shipment-new-preview',
      component: AllocationPreviewView,
      props: { shipmentRef: NEW_DRAFT },
    },
    {
      // A saved shipment is addressed by its ref: it is what he calls it out loud.
      path: '/shipments/:ref',
      name: 'shipment-builder',
      component: ShipmentBuilderView,
      props: (route) => ({ shipmentRef: String(route.params.ref) }),
    },
    {
      path: '/shipments/:ref/preview',
      name: 'shipment-preview',
      component: AllocationPreviewView,
      props: (route) => ({ shipmentRef: String(route.params.ref) }),
    },
    {
      path: '/design-system',
      name: 'design-system',
      component: DesignSystemView,
    },
  ],
})

export default router

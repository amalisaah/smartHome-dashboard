import { createRouter, createWebHistory } from 'vue-router'
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
      // The shipment is addressed by its ref: it is what he calls it out loud.
      // A new shipment is minted a ref on the click that starts it, so there is
      // no second, ref-less route for one that has not been saved yet.
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

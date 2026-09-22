import { createRouter, createWebHistory } from 'vue-router'
import AllocationPreviewView from '@/views/AllocationPreviewView.vue'
import CatalogueListView from '@/views/CatalogueListView.vue'
import DesignSystemView from '@/views/DesignSystemView.vue'
import GroupsMarkupView from '@/views/GroupsMarkupView.vue'
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
      // A shipment he has just started is not addressed by an id, because it
      // does not have one: `POST /shipments` gives it a number when he saves,
      // not the click that opened a blank form. Declared above `:id` so it wins.
      path: '/shipments/new',
      name: 'shipment-new',
      component: ShipmentBuilderView,
      props: { shipmentId: null },
    },
    {
      // A saved shipment is addressed by the id the backend gave it. `SH-016` is
      // how he says that id out loud, and the screens render it that way.
      path: '/shipments/:id(\\d+)',
      name: 'shipment-builder',
      component: ShipmentBuilderView,
      props: (route) => ({ shipmentId: Number(route.params.id) }),
    },
    {
      path: '/shipments/:id(\\d+)/preview',
      name: 'shipment-preview',
      component: AllocationPreviewView,
      props: (route) => ({ shipmentId: Number(route.params.id) }),
    },
    {
      path: '/groups',
      name: 'groups',
      component: GroupsMarkupView,
    },
    {
      path: '/design-system',
      name: 'design-system',
      component: DesignSystemView,
    },
  ],
})

export default router

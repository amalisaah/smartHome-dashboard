import { createRouter, createWebHistory } from 'vue-router'
import AllocationPreviewView from '@/views/AllocationPreviewView.vue'
import CatalogueListView from '@/views/CatalogueListView.vue'
import CustomerDetailView from '@/views/CustomerDetailView.vue'
import CustomerListView from '@/views/CustomerListView.vue'
import CustomerNewView from '@/views/CustomerNewView.vue'
import CustomerPlaceholderView from '@/views/CustomerPlaceholderView.vue'
import DesignSystemView from '@/views/DesignSystemView.vue'
import GroupsMarkupView from '@/views/GroupsMarkupView.vue'
import ItemDetailView from '@/views/ItemDetailView.vue'
import ItemEditView from '@/views/ItemEditView.vue'
import ItemNewView from '@/views/ItemNewView.vue'
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
      // An item he has just started has no id: `POST /items` gives it a number
      // when he creates it, not the click that opened a blank form. Declared
      // above `:id` so it wins.
      path: '/items/new',
      name: 'item-new',
      component: ItemNewView,
      // The name he could not find is the name he is about to enter.
      props: (route) => ({
        initialName: typeof route.query.name === 'string' ? route.query.name : '',
      }),
    },
    {
      // One catalogue item. `/items` rather than `/catalogue` because that is
      // the resource the API names, and the list at `/` is a view of it.
      path: '/items/:id(\\d+)',
      name: 'item-detail',
      component: ItemDetailView,
      props: (route) => ({ itemId: Number(route.params.id) }),
    },
    {
      // The phone's Edit form. Its own address, so the back gesture closes the
      // form rather than leaving the item.
      path: '/items/:id(\\d+)/edit',
      name: 'item-edit',
      component: ItemEditView,
      props: (route) => ({ itemId: Number(route.params.id) }),
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
      path: '/customers',
      name: 'customers',
      component: CustomerListView,
    },
    {
      // A customer he has just started has no id: `POST /customers` gives her a
      // number when he saves, not the click that opened a blank form. Declared
      // above `:id` so it wins.
      path: '/customers/new',
      name: 'customer-new',
      component: CustomerNewView,
      // The name he could not find is the name he is about to enter.
      props: (route) => ({
        initialName: typeof route.query.name === 'string' ? route.query.name : '',
      }),
    },
    {
      // Her customer page — module 5, block F.
      path: '/customers/:id(\\d+)',
      name: 'customer-detail',
      component: CustomerDetailView,
      props: (route) => ({ customerId: Number(route.params.id) }),
    },
    {
      // Her house, which is where a phone row lands, and where "Start her house"
      // goes when she has none to name yet. Out of scope here.
      path: '/customers/:id(\\d+)/house',
      name: 'customer-house',
      component: CustomerPlaceholderView,
      props: (route) => ({ customerId: Number(route.params.id), destination: 'house' }),
    },
    {
      // A house she is about to have. It has no id yet — `POST
      // /customers/{id}/houses` mints one when the form is saved, not when the
      // button is pressed. Declared above `:houseId` for the same reason
      // `/items/new` is, though the `\d+` there would not match it anyway.
      path: '/customers/:id(\\d+)/houses/new',
      name: 'house-new',
      component: CustomerPlaceholderView,
      props: (route) => ({ customerId: Number(route.params.id), destination: 'house-new' }),
    },
    {
      // One named house of hers. A customer may have several, so a row in her
      // house list has to address the one it names rather than "her house".
      path: '/customers/:id(\\d+)/houses/:houseId(\\d+)',
      name: 'house-detail',
      component: CustomerPlaceholderView,
      props: (route) => ({ customerId: Number(route.params.id), destination: 'house' }),
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

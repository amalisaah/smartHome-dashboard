import { createRouter, createWebHistory } from 'vue-router'
import AllocationPreviewView from '@/views/AllocationPreviewView.vue'
import CatalogueListView from '@/views/CatalogueListView.vue'
import CustomerDetailView from '@/views/CustomerDetailView.vue'
import CustomerListView from '@/views/CustomerListView.vue'
import CustomerNewView from '@/views/CustomerNewView.vue'
import CustomerPlaceholderView from '@/views/CustomerPlaceholderView.vue'
import DesignSystemView from '@/views/DesignSystemView.vue'
import GroupsMarkupView from '@/views/GroupsMarkupView.vue'
import HouseInstalledCorrectView from '@/views/HouseInstalledCorrectView.vue'
import HouseInstalledView from '@/views/HouseInstalledView.vue'
import HouseNewView from '@/views/HouseNewView.vue'
import HouseRoomsView from '@/views/HouseRoomsView.vue'
import HouseVisitView from '@/views/HouseVisitView.vue'
import ItemDetailView from '@/views/ItemDetailView.vue'
import ItemEditView from '@/views/ItemEditView.vue'
import ItemNewView from '@/views/ItemNewView.vue'
import QuoteStubView from '@/views/QuoteStubView.vue'
import QuoteView from '@/views/QuoteView.vue'
import QuotesListView from '@/views/QuotesListView.vue'
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
      component: HouseNewView,
      props: (route) => ({ customerId: Number(route.params.id) }),
    },
    {
      // One named house of hers, on its Visit notes tab — module 5, block A. A
      // customer may have several, so a row in her house list has to address
      // the one it names rather than "her house", even though that is what the
      // screen is called once he is on it.
      path: '/customers/:id(\\d+)/houses/:houseId(\\d+)',
      name: 'house-detail',
      component: HouseVisitView,
      props: (route) => ({
        customerId: Number(route.params.id),
        houseId: Number(route.params.houseId),
      }),
    },
    {
      // The house's second tab — module 5, block B. Where `Walk the rooms →`
      // and `Edit rooms` both land.
      path: '/customers/:id(\\d+)/houses/:houseId(\\d+)/rooms',
      name: 'house-rooms',
      component: HouseRoomsView,
      props: (route) => ({
        customerId: Number(route.params.id),
        houseId: Number(route.params.houseId),
      }),
    },
    {
      // The third — module 5, block C.
      path: '/customers/:id(\\d+)/houses/:houseId(\\d+)/installed',
      name: 'house-installed',
      component: HouseInstalledView,
      props: (route) => ({
        customerId: Number(route.params.id),
        houseId: Number(route.params.houseId),
      }),
    },
    {
      // C2, correcting one room's counts by hand. Its own address, so the back
      // gesture closes the correction rather than leaving the house — the same
      // reason the phone's item form has one. The laptop has no such screen:
      // correcting there is a mode of C3's table, and the view redirects.
      path: '/customers/:id(\\d+)/houses/:houseId(\\d+)/installed/:roomId(\\d+)/correct',
      name: 'house-installed-correct',
      component: HouseInstalledCorrectView,
      props: (route) => ({
        customerId: Number(route.params.id),
        houseId: Number(route.params.houseId),
        roomId: Number(route.params.roomId),
      }),
    },
    {
      // The quote list — modules 3+4, block D.
      path: '/quotes',
      name: 'quotes',
      component: QuotesListView,
    },
    {
      // A quote he has just started has no id: `POST /quotes` gives it a number
      // when it is created, not the click that asked for a blank one. Declared
      // above `:id` so it wins — though the `\d+` there would not match it.
      //
      // A stub, because starting a quote picks the customer and the house
      // first and that picker is block G.
      path: '/quotes/new',
      name: 'quote-new',
      component: QuoteStubView,
      props: { destination: 'new' },
    },
    {
      // One quote. **Every row on the list lands here**, whatever its state —
      // one address per quote. `QuoteView` reads the state and renders the
      // builder for a draft or the quote's own page for the rest, because what
      // he can do to a quote depends on where it has got to.
      path: '/quotes/:id(\\d+)',
      name: 'quote-detail',
      component: QuoteView,
      props: (route) => ({ quoteId: Number(route.params.id) }),
    },
    {
      // Block B, "What did she agree to?" — the primary action on a sent
      // quote's page. Its own address, so the back gesture returns to the
      // quote rather than to the list.
      path: '/quotes/:id(\\d+)/answer',
      name: 'quote-answer',
      component: QuoteStubView,
      props: (route) => ({ reference: Number(route.params.id), destination: 'answer' }),
    },
    {
      // Block C, the job — the primary action on an accepted quote's page.
      // Addressed by the job's own number rather than the quote's: by this
      // point the job is the record, and the quote is what it came from.
      path: '/jobs/:id(\\d+)',
      name: 'job-detail',
      component: QuoteStubView,
      props: (route) => ({ reference: Number(route.params.id), destination: 'job' }),
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

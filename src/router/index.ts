import { createRouter, createWebHistory } from 'vue-router'
import CatalogueListView from '../views/CatalogueListView.vue'
import DesignSystemView from '../views/DesignSystemView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'catalogue',
      component: CatalogueListView,
    },
    {
      path: '/design-system',
      name: 'design-system',
      component: DesignSystemView,
    },
  ],
})

export default router

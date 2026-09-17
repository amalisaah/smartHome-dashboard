import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import './style.css'
import App from './App.vue'
import router from './router'
import { vueQueryOptions } from '@/api/queryClient'

createApp(App).use(router).use(VueQueryPlugin, vueQueryOptions).mount('#app')

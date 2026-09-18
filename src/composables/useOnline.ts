import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Whether the browser thinks it has a connection. The catalogue's only use of it
 * is the app-bar status line, which says "showing last known counts" — the design
 * changes nothing else when the network drops.
 */
export function useOnline() {
  const online = ref(true)

  const handleOnline = () => (online.value = true)
  const handleOffline = () => (online.value = false)

  onMounted(() => {
    online.value = navigator.onLine
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return online
}

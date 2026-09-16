import { onBeforeUnmount, readonly, ref } from 'vue'

/** Reactive `matchMedia`. The two frames are the two designs; this picks one. */
export function useMediaQuery(query: string) {
  const list = window.matchMedia(query)
  const matches = ref(list.matches)

  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }

  list.addEventListener('change', onChange)
  onBeforeUnmount(() => list.removeEventListener('change', onChange))

  return readonly(matches)
}

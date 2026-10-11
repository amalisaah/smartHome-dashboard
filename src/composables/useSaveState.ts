import { onScopeDispose, readonly, ref } from 'vue'

/**
 * Where a write has got to. One vocabulary for the whole app: the shipment
 * builder reports it into its own header bar, a customer screen reports it into
 * the app bar, and both mean the same four things by it.
 *
 * `idle` is nothing outstanding and nothing recently done — the resting state of
 * a screen that only reads.
 */
export type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

const appState = ref<SaveState>('idle')

/**
 * What the app bar reads. There is one app bar — the handoff names it as where
 * save state is said — so there is one state behind it, rather than a prop
 * threaded down through every view that happens to write something.
 */
export const saveState = readonly(appState)

/**
 * What a screen that writes uses.
 *
 * Leaving the screen settles it: a failure belongs to the screen it happened on
 * and must not follow him to the next one.
 */
export function useSaveReporter() {
  onScopeDispose(() => (appState.value = 'idle'))

  return {
    saving: () => (appState.value = 'saving'),
    saved: () => (appState.value = 'saved'),
    failed: () => (appState.value = 'failed'),
  }
}

import { QueryClient, type VueQueryPluginOptions } from '@tanstack/vue-query'
import { isRetryableError } from './http'

/**
 * One cache for the app. The defaults below are the ones worth stating
 * explicitly because an ops dashboard wants different behaviour from a
 * content site: figures on screen should be recent, but a tab left open
 * on a phone in a stockroom should not hammer the API.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A minute of freshness. Remounting a screen inside that window — a tab
      // switch, a route back — serves the cache without a request.
      staleTime: 60_000,
      // Kept for five minutes after the last watcher unmounts, so navigating
      // away and back paints instantly and revalidates behind the paint.
      gcTime: 5 * 60_000,
      // Stock and capital figures drive decisions, so coming back to the tab
      // revalidates, and so does regaining the network.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Two retries is enough to ride out a blip without leaving a spinner up for
      // ~7s on an endpoint that is simply down — and only for a failure retrying
      // can fix. A 400 or a 404 is the request being wrong and will be just as
      // wrong the second time, so it surfaces on the first answer.
      retry: (failureCount, error) => failureCount < 2 && isRetryableError(error),
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
    },
    mutations: {
      // Writes are not retried: a POST that may have landed must not be resent
      // on the client's guess. Retrying a write is an explicit per-mutation call.
      retry: 0,
    },
  },
})

export const vueQueryOptions: VueQueryPluginOptions = { queryClient }

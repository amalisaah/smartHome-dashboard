import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  completeJob,
  fetchJobDetail,
  fetchJobSummary,
  setAgreedTotal,
  setFittedQuantity,
  setJobType,
} from '@/api/jobDetail'
import { catalogueKeys } from '@/api/hooks/catalogue'
import { quoteKeys } from '@/api/hooks/quotes'
import type { ApiJobDetail, ApiJobSummary, ApiJobType } from '@/types/jobApi'

/**
 * Two keys, because the screen refreshes at two grains: the whole job when it
 * opens, and the money alone after each write that moves it.
 */
export const jobKeys = {
  all: ['jobs'] as const,
  detail: (id: number) => [...jobKeys.all, 'detail', id] as const,
  summary: (id: number) => [...jobKeys.all, 'summary', id] as const,
}

/**
 * `GET /jobs/{id}/detail` — the whole screen in one read.
 *
 * Cached hard, like the quote builder. Nothing but this screen moves a job, and
 * this screen writes its own changes into the cache as they land, so a
 * background refetch could only learn what it already knows — and would do it
 * while he is mid-figure, which is the one moment a table may not shift under
 * him.
 */
export function useJobDetail(id: MaybeRefOrGetter<number>) {
  const jobId = computed(() => toValue(id))

  return useQuery({
    queryKey: computed(() => jobKeys.detail(jobId.value)),
    queryFn: ({ signal }) => fetchJobDetail(jobId.value, signal),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

/**
 * What every write on this screen does afterwards: re-read the money.
 *
 * Profit, owed and the variance against the quote are derived on read from the
 * rows that just changed, so they are the only stale part of the payload — and
 * the detail endpoint's own guidance is to come back for this rather than for
 * the whole thing. It is **set** into the detail cache rather than invalidating
 * it, so the lines he is looking at are never re-fetched out from under him.
 */
function useSummaryRefresh() {
  const queryClient = useQueryClient()

  return async (id: number) => {
    const summary = await fetchJobSummary(id)
    queryClient.setQueryData(jobKeys.summary(id), summary)
    queryClient.setQueryData<ApiJobDetail>(jobKeys.detail(id), (current) =>
      current ? { ...current, summary } : current,
    )
    return summary
  }
}

export interface FittedVariables {
  jobId: number
  lineId: number
  quantity: number
}

/**
 * `PATCH /job-lines/{id}` — a corrected Fitted figure.
 *
 * Retried, unlike the acts further down this file. It is idempotent in the
 * strict sense: the body says what the quantity *is*, not how much to move it
 * by, so a request that timed out on the way back and goes again lands on the
 * same number. The screen is also used on a phone's tethered connection at 9pm,
 * where one dropped packet should not cost him the figure he typed.
 */
export function useSetFitted() {
  const queryClient = useQueryClient()
  const refreshSummary = useSummaryRefresh()

  return useMutation({
    mutationFn: ({ lineId, quantity }: FittedVariables) => setFittedQuantity(lineId, quantity),
    onSuccess: async (line, { jobId }) => {
      // The server's reading of the line replaces the screen's — same figures,
      // but `quantity_delta` and `is_substitution` come back authoritative.
      queryClient.setQueryData<ApiJobDetail>(jobKeys.detail(jobId), (current) =>
        current
          ? { ...current, lines: current.lines.map((row) => (row.id === line.id ? line : row)) }
          : current,
      )
      await refreshSummary(jobId)
    },
  })
}

/** `PATCH /jobs/{id}` — which of the four things completing will do. */
export function useSetJobType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, jobType }: { id: number; jobType: ApiJobType }) => setJobType(id, jobType),
    onSuccess: (job, { id }) => {
      // It changes no money, so there is nothing to re-read: the job comes back
      // whole and the only field that moved is the one he picked.
      queryClient.setQueryData<ApiJobDetail>(jobKeys.detail(id), (current) =>
        current ? { ...current, job_type: job.job_type } : current,
      )
    },
  })
}

/**
 * `PATCH /jobs/{id}` — what she is being charged.
 *
 * Moves profit and owed, so the summary follows it. Retried for the same reason
 * the Fitted figure is: the body states the total rather than adjusting it.
 */
export function useSetCharged() {
  const queryClient = useQueryClient()
  const refreshSummary = useSummaryRefresh()

  return useMutation({
    mutationFn: ({ id, agreedTotalPesewas }: { id: number; agreedTotalPesewas: number }) =>
      setAgreedTotal(id, agreedTotalPesewas),
    onSuccess: async (job, { id }) => {
      queryClient.setQueryData<ApiJobDetail>(jobKeys.detail(id), (current) =>
        current ? { ...current, agreed_total_pesewas: job.agreed_total_pesewas } : current,
      )
      await refreshSummary(id)
    },
  })
}

/**
 * `POST /jobs/{id}/complete`.
 *
 * **Not retried.** It draws stock, writes the house record and earns the money
 * in one transaction; a request that timed out on the way back may well have
 * done all three, and a silent second attempt would draw the devices twice. A
 * failure comes back to the bar with the job still open, for him to press
 * again.
 *
 * The quote list goes too: an accepted quote's row names the job it became, and
 * what that job is has just changed.
 */
export function useCompleteJob() {
  const queryClient = useQueryClient()
  const refreshSummary = useSummaryRefresh()

  return useMutation({
    mutationFn: ({ id }: { id: number }) => completeJob(id),
    retry: false,
    onSuccess: async (result, { id }) => {
      queryClient.setQueryData<ApiJobDetail>(jobKeys.detail(id), (current) =>
        current
          ? { ...current, status: result.status, completed_at: result.completed_at }
          : current,
      )
      await refreshSummary(id)
      // Completing moves stock, so the catalogue's counts are now stale.
      await queryClient.invalidateQueries({ queryKey: catalogueKeys.all })
      await queryClient.invalidateQueries({ queryKey: quoteKeys.listRows() })
    },
  })
}

export type { ApiJobSummary }

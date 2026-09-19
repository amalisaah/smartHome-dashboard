
import type { ApiError } from '@/types/api'

/**
 * The spec's `servers[0]`. Overridden per environment with `VITE_API_BASE_URL`.
 *
 * In dev it is the Vite proxy instead — `/api`, forwarded to the same host (see
 * `vite.config.ts`). That is not a preference: the API's CORS answers
 * `GET,HEAD,POST`, so a `PATCH` or `DELETE` straight from the browser dies at
 * the preflight. Going through our own origin means there is no preflight.
 */
const DEFAULT_BASE_URL = import.meta.env.DEV ? '/api' : 'http://localhost:4000'

const configuredBase = import.meta.env.VITE_API_BASE_URL as string | undefined

/** Trailing slash stripped so `${API_BASE_URL}/items` is never `//items`. */
export const API_BASE_URL = (configuredBase?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '')

/**
 * A request that reached the server and came back other than 2xx. `status` is the
 * HTTP code, `details` the field-level list the API sends on a 400. A request that
 * never reached the server — DNS, offline, CORS, an aborted connection — throws
 * `status: 0` instead, which is what separates "retry this" from "this is wrong".
 */
export class ApiRequestError extends Error {
  readonly status: number
  readonly details?: ApiError['details']

  constructor(status: number, message: string, details?: ApiError['details']) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.details = details
  }

  /** Nothing came back, so nothing about the request itself is known to be wrong. */
  get isNetworkFailure(): boolean {
    return this.status === 0
  }
}

/**
 * Worth trying again: a connection that never landed, or a server that failed on
 * its own account. A 4xx is the request being wrong and will be just as wrong the
 * second time, so it surfaces immediately rather than after three spinners.
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof ApiRequestError)) return false
  return error.isNetworkFailure || error.status >= 500
}

/** The API's error envelope, or a plain message when the body is not one. */
async function toRequestError(response: Response): Promise<ApiRequestError> {
  try {
    const body = (await response.json()) as Partial<ApiError>
    if (typeof body?.message === 'string') {
      return new ApiRequestError(response.status, body.message, body.details)
    }
  } catch {
    // A gateway or a proxy answered with HTML; the status is all there is to say.
  }
  return new ApiRequestError(response.status, `${response.status} ${response.statusText}`.trim())
}

/**
 * `query` drops `undefined` entries, so a caller can pass the whole filter shape
 * and let the unset ones fall away instead of assembling the string itself.
 */
function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
  // The base may be a path on our own origin (the dev proxy) rather than an
  // absolute URL; the second argument is ignored when the first is absolute.
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  return url.toString()
}

export async function apiGet<T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (cause) {
    // An abort is TanStack cancelling a superseded query, not a failure to report.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiRequestError(0, 'Could not reach the API.')
  }

  if (!response.ok) throw await toRequestError(response)
  return (await response.json()) as T
}

/**
 * A write. Same error contract as `apiGet`, so a caller tells "the request was
 * wrong" from "the request never landed" the same way on both — which is what
 * lets a screen keep what he typed when the network drops rather than blame him
 * for it. Writes are never retried automatically; see `queryClient`.
 */
export async function apiSend<T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiRequestError(0, 'Could not reach the API.')
  }

  if (!response.ok) throw await toRequestError(response)
  // `204` and an empty body are both "it worked and there is nothing to say".
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

import type { RemovalFigures } from '@/types/customerDetail'

/**
 * ⚠️ MOCK — the counts block F's two exits are about.
 *
 * TODO(api): replace with real figures. Every value here is invented, and there
 * is nothing on the wire to read instead: quotes, jobs and payments belong to a
 * module that does not exist yet, so no endpoint can say what anonymising or
 * deleting her would cost. The anonymous label is minted by
 * `POST /customers/{id}/anonymise` and cannot be known before the act.
 *
 * Shaped as the reference draws it, so F1's footer band can be compared against
 * it; swapping this for a request changes nothing above `RemovalFigures`.
 */
export const removalFiguresMock: RemovalFigures = {
  records: '2 quotes, 1 job',
  recordCounts: ['2 quotes', '1 job'],
  anonymousLabel: 'Customer #0141',
  month: 'August',
}

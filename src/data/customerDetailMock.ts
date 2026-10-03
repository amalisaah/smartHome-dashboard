/**
 * ⚠️ MOCK — module 5, block F.
 *
 * **Every value in this file is invented.** The handoff calls these "supplied":
 * the UI renders them and computes none of them, and the endpoints that would
 * answer them do not exist yet. They are shaped exactly as the reference draws
 * them so the screen can be seen and reviewed, and so that replacing this file
 * with a request changes nothing above `CustomerDetailDisplay`.
 *
 * What is NOT mocked, and comes from the API like every other screen:
 *   - her name, phone, status and notes — `GET /customers/{id}`
 *   - her contact history — `GET /customers/{id}/contact-logs`
 *   - the phrase beside her number — derived from `days_since_last_contact`
 *     by `lastContactPhrase`
 *
 * What each field below is still waiting on, so the seam is obvious:
 *
 *   - `house` — `GET /customers/{id}/houses`, then a composition call per house
 *     for rooms and devices, summed; the fault count and the condition tags are
 *     further still. Three requests deep for a summary card.
 *   - `figures` — quotes, jobs and payments belong to a module that does not
 *     exist yet. The anonymous label is minted by `POST /customers/{id}/anonymise`
 *     and cannot be known before the act.
 *   - `anonymisedOn` — `anonymised_at` on the record, once the act is wired.
 *     Already read from the record for one that arrived anonymised; this is only
 *     the stand-in for an anonymise taken in front of him, which does not write.
 */

import type { CustomerDetailDisplay } from '@/types/customerDetail'

/** The reference's own figures, so F1 can be compared against it pixel for pixel. */
export const customerDetailMock: CustomerDetailDisplay = {
  house: {
    rooms: 6,
    devices: 16,
    faultCount: 1,
    faultCaption: 'Master, one of two bulbs',
    conditions: ['no neutral · hall, master', 'internet weak'],
  },
  figures: {
    records: '2 quotes, 1 job',
    recordCounts: ['2 quotes', '1 job'],
    anonymousLabel: 'Customer #0141',
    month: 'August',
  },
  anonymisedOn: '30 Sep',
}

/**
 * ⚠️ MOCK — module 5, block F.
 *
 * **Every value in this file is invented.** The handoff calls these "supplied":
 * the UI renders them and computes none of them, and the endpoints that would
 * answer them either do not exist yet or were out of scope for this build. They
 * are shaped exactly as the reference draws them so the screen can be seen and
 * reviewed, and so that replacing this file with a request changes nothing above
 * `CustomerDetailDisplay`.
 *
 * What is NOT mocked: her name, phone, status and notes, which come from
 * `GET /customers/{id}` through `useCustomer` like every other screen.
 *
 * What each field is waiting on, so the seam is obvious when someone wires it:
 *
 *   - `history` — `GET /customers/{id}/contact-logs` answers notes and dates, but
 *     has no entry kind for a *status change*, which is a third of this list and
 *     the one the handoff makes a point of. Nothing on the wire records that
 *     `quoted → customer` happened on 14 Aug, or why.
 *   - `lastContactPhrase` — `days_since_last_contact` is on the record, but the
 *     handoff supplies the phrase, not the number, so the screen does not decide
 *     where `8 d ago` becomes `last week`.
 *   - `house` — `GET /customers/{id}/houses`, then a composition call per house
 *     for rooms and devices, summed; the fault count and the condition tags are
 *     further still. Three requests deep for a summary card.
 *   - `figures` — quotes, jobs and payments belong to a module that does not
 *     exist yet. The anonymous label is minted by `POST /customers/{id}/anonymise`
 *     and cannot be known before the act.
 *   - `anonymisedOn` — `anonymised_at` on the record, once the act is wired.
 */

import type { CustomerDetailDisplay } from '@/types/customerDetail'

/** The reference's own figures, so F1 can be compared against it pixel for pixel. */
export const customerDetailMock: CustomerDetailDisplay = {
  lastContactPhrase: 'last contact 8 d ago',
  history: [
    {
      id: 'h1',
      date: '22 Sep',
      kind: 'note',
      text: 'Master bulb flickering — wants someone to look this week.',
    },
    {
      id: 'h2',
      date: '3 Sep',
      kind: 'note',
      text: 'Feedback call. Happy. Asked about a camera for the back gate.',
    },
    {
      id: 'h3',
      date: '14 Aug',
      kind: 'status-change',
      from: 'quoted',
      to: 'customer',
      caption: 'job completed',
    },
    { id: 'h4', date: '20 Jun', kind: 'no-note' },
    {
      id: 'h5',
      date: '9 Jun',
      kind: 'status-change',
      from: 'enquiry',
      to: 'quoted',
      caption: 'after site visit',
    },
    {
      id: 'h6',
      date: '2 Jun',
      kind: 'note',
      text: 'First contact. Referred by Kojo Mensah.',
    },
  ],
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

/**
 * The same screen for a customer nobody has visited. The handoff draws no frame
 * for it — "show the card with `No house yet` and a `Start her house` link in
 * place of counts" — so only the house differs, and it differs by being absent.
 */
export const customerDetailMockNoHouse: CustomerDetailDisplay = {
  ...customerDetailMock,
  house: null,
}

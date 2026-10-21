/**
 * The quote list's rows, until `GET /quotes` can answer them.
 *
 * **Why a mock and not the endpoint.** `GET /quotes` returns `customer_id` and
 * `house_id` and no names (gap report C10, confirmed against `openapi.json`),
 * so every row on this screen would read `Quote 0139 · premium` with no
 * household on it — which is the one thing the list exists to show. It also
 * carries no days-waiting count, no "edited … ago" phrase and no job link. Four
 * of the six fields a row renders are missing, so this screen is built against
 * a fixture and swapped over in one file when the API answers them.
 *
 * The seam is `fetchQuoteListRows`. When C10 lands, that function becomes an
 * `apiGet` plus a mapper and nothing above it changes.
 *
 * The rows are in the order the server would send them — waiting oldest first,
 * drafts last-edited first, answered most recent first — because the row order
 * is supplied too. Nothing here is sorted again downstream.
 *
 * Counts are **not** in this file. The tab counts, the column counts and the
 * laptop summary are all derived from these rows, so adding one here moves
 * every figure on the screen the way adding a real quote would.
 */

import type { QuoteListRow } from '@/types/quoteList'

/**
 * Eighteen quotes — the load a one-van installer actually carries. Larger than
 * the reference frame draws, so the counts, the summary and the match counts
 * are exercised rather than decorative.
 *
 * The `answered` rows are the ones inside the 30-day window. Which quotes are
 * recent enough is the server's call, so they simply are not in this list once
 * they fall out of it; the screen never filters by date.
 */
const ROWS: QuoteListRow[] = [
  // --- waiting on her, oldest first: the top one is the one to chase --------
  row({ number: '0128', surname: 'Addo', area: 'Haatso', level: 'basic', status: 'sent', daysWaiting: 34 }),
  row({ number: '0135', surname: 'Baidoo', area: 'Tesano', level: 'comfortable', status: 'sent', daysWaiting: 24 }),
  row({ number: '0139', surname: 'Mensah', area: 'Airport Residential', level: 'premium', status: 'sent', daysWaiting: 19 }),
  row({ number: '0144', surname: 'Boateng', area: 'Spintex', level: 'comfortable', status: 'sent', daysWaiting: 9 }),
  row({ number: '0146', surname: 'Quaye', area: 'Dzorwulu', level: 'custom', title: 'Gate + two cameras', status: 'sent', daysWaiting: 4 }),
  row({ number: '0150', surname: 'Amponsah', area: 'Cantonments', level: 'premium', title: 'Second floor only', status: 'sent', daysWaiting: 2 }),
  // The singular label — `1 day waiting`, not `1 days waiting`.
  row({ number: '0147', surname: 'Darko', area: 'Trasacco', level: 'luxury', status: 'sent', daysWaiting: 1 }),

  // --- drafts, last edited first -------------------------------------------
  row({ number: '0152', surname: 'Annan', area: 'Osu', level: 'custom', title: 'Shop front', status: 'draft', editedText: 'edited 40 min ago' }),
  row({ number: '0148', surname: 'Ofori', area: 'Labone', level: 'comfortable', status: 'draft', editedText: 'edited 2 h ago' }),
  row({ number: '0151', surname: 'Tagoe', area: 'Dome', level: 'basic', status: 'draft', editedText: 'edited 1 d ago' }),
  row({ number: '0145', surname: 'Nkrumah', area: 'Achimota', level: 'basic', status: 'draft', editedText: 'edited 6 d ago' }),

  // --- answered in the last 30 days, most recent first ----------------------
  row({ number: '0149', surname: 'Bediako', area: 'Airport Hills', level: 'luxury', status: 'accepted', answeredOn: '14 Oct', jobNumber: '0103' }),
  // She gave a reason and he wrote it down.
  row({ number: '0138', surname: 'Kotei', area: 'Madina', level: 'basic', status: 'declined', answeredOn: '11 Oct', declinedReason: 'Her landlord said no.' }),
  // She declined and he did not. The row shows nothing where the reason goes.
  row({ number: '0143', surname: 'Quarshie', area: 'Dansoman', level: 'basic', status: 'declined', answeredOn: '8 Oct' }),
  row({ number: '0141', surname: 'Owusu', area: 'Cantonments', level: 'premium', status: 'accepted', answeredOn: '6 Oct', jobNumber: '0100' }),
  row({ number: '0142', surname: 'Adjei', area: 'East Legon', level: 'comfortable', status: 'accepted', answeredOn: '2 Oct', jobNumber: '0098' }),
  row({ number: '0137', surname: 'Nyarko', area: 'Abelemkpe', level: 'comfortable', status: 'accepted', answeredOn: '29 Sep', jobNumber: '0096' }),
  row({ number: '0140', surname: 'Asante', area: 'Tema Comm. 25', level: 'comfortable', status: 'declined', answeredOn: '26 Sep', declinedReason: 'Went with someone cheaper.' }),
]

/**
 * Fills in the nulls so a fixture row states only what its status carries. The
 * id is the number, because that is what it is — `0139` is quote 139 written
 * the way he reads it.
 */
function row(
  fields: Pick<QuoteListRow, 'number' | 'surname' | 'area' | 'level' | 'status'> &
    Partial<QuoteListRow>,
): QuoteListRow {
  return {
    id: Number(fields.number),
    title: null,
    daysWaiting: null,
    editedText: null,
    answeredOn: null,
    jobNumber: null,
    declinedReason: null,
    ...fields,
  }
}

/**
 * The seam. Async and copying the array, so that swapping it for `apiGet`
 * changes this function and nothing that calls it — and so no screen can edit
 * the fixture in place and have it stick.
 */
export async function fetchQuoteListRows(): Promise<QuoteListRow[]> {
  return ROWS.map((entry) => ({ ...entry }))
}

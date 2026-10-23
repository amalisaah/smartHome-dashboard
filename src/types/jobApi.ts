/**
 * The job as the wire carries it — `GET /jobs`.
 *
 * There is no job *module* in this app yet; blocks C and E are not built. This
 * file exists because two screens that **are** built have to read jobs: the
 * quote list, to say which job an accepted quote became, and the customer's
 * removal band, to say what deleting her would destroy.
 *
 * So it is deliberately only the list shape. The job's lines, costs and
 * payments are endpoints of their own and are not typed here — when block C
 * lands it will bring the rest, and this will still be what `GET /jobs`
 * answers.
 */

/** `scheduled -> in_progress -> completed | cancelled` */
export type ApiJobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

/**
 * What completing the job does to the house record — not decoration. `install`
 * adds, `upgrade` adds to what is there, `repair` swaps leaving net quantity
 * unchanged, `relocation` moves a row.
 */
export type ApiJobType = 'install' | 'repair' | 'relocation' | 'upgrade'

/** What a payment leaves outstanding. Derived from the rows, never stored. */
export type ApiJobBalanceState = 'unpaid' | 'part_paid' | 'settled' | 'overpaid'

export interface ApiJobRecord {
  id: number
  /** Null for a callout with no quote behind it — a bulb died, he went out. */
  quote_id: number | null
  customer_id: number
  house_id: number
  job_type: ApiJobType
  status: ApiJobStatus
  title: string | null
  scheduled_for: string | null
  started_at: string | null
  /** When the work was finished. Money is *earned* at this moment. */
  completed_at: string | null
  labour_charge_pesewas: number
  materials_charge_pesewas: number
  /** OWNER-ONLY. What the quote estimated misc would cost, frozen at creation. */
  misc_cost_estimate_snapshot_pesewas: number
  agreed_total_pesewas: number
  payment_link_url: string | null
  notes: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
  /** Sum of this job's payments. */
  received_pesewas: number
  /** `agreed_total` minus received. Negative when she overpaid. */
  owed_pesewas: number
  balance_state: ApiJobBalanceState
}

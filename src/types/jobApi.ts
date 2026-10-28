/**
 * The job as the wire carries it — `GET /jobs` and `GET /jobs/{id}/detail`.
 *
 * Two shapes, because there are two reads. `ApiJobRecord` is the list row the
 * quote list and the customer's removal band join against. `ApiJobDetail` is
 * block C's whole screen in one response: the job, its lines, the household's
 * names, the slice of the quote that captions the header, the owner's money
 * summary, the payments and the costs.
 *
 * The detail endpoint exists because the screen needed seven reads without it —
 * the job returns ids where the header needs words, and the figures it compares
 * against live on the quote. It carries no figure of its own: every field is
 * produced by the same code that serves the narrow endpoints, so `/summary`
 * stays the cheap way to refresh the money after a write.
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

/** The room a line recorded, snapshotted when the job was created. */
export interface ApiJobLineRoom {
  id: number
  name: string | null
  space_slug: string | null
}

/**
 * One line of the job: what was fitted, beside what the quote said.
 *
 * The `quoted_*` fields are frozen at creation and never move again, which is
 * what lets the screen say a line changed after the quote itself has been
 * edited. `is_substitution` and `quantity_delta` are the server's reading of
 * them — the same reading `@/utils/mapper/jobMapper` repeats locally while an
 * edit is still in flight.
 */
export interface ApiJobLine {
  id: number
  job_id: number
  room_id: number | null
  room: ApiJobLineRoom | null
  item_id: number
  item_name: string | null
  need: string
  /** What was actually fitted. */
  quantity: number
  unit_selling_price_pesewas: number
  /** OWNER-ONLY. */
  unit_landed_cost_pesewas: number
  /** OWNER-ONLY: quantity × landed cost. */
  line_cost_pesewas: number
  /** quantity × selling price — the customer-safe twin of `line_cost_pesewas`. */
  line_selling_total_pesewas: number
  quoted_item_id: number | null
  /** Null unless this line is a substitution. */
  quoted_item_name: string | null
  quoted_quantity: number | null
  is_substitution: boolean
  /** Actual minus quoted. Null on a line the quote never had. */
  quantity_delta: number | null
  note: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

/** How a job line paired against the quote. */
export type ApiJobVarianceOutcome = 'as_quoted' | 'changed' | 'substituted' | 'added' | 'dropped'

export interface ApiJobVarianceLine {
  item_id: number | null
  quoted_item_id: number | null
  quantity: number
  quoted_quantity: number | null
  quantity_delta: number | null
  outcome: ApiJobVarianceOutcome
}

/** Derived on read, never stored. */
export interface ApiJobVariance {
  /** Actual misc minus the quote's estimate. Positive means it cost more. */
  misc_delta_pesewas: number
  /**
   * OWNER-ONLY. The quote's own expected profit, read back rather than
   * recomputed — the figure he was looking at when he set the price. Null on a
   * job with no quote behind it, and then the card's variance line has nothing
   * to say and is not drawn.
   */
  expected_profit_pesewas: number | null
  /** OWNER-ONLY. `profit` minus `expected_profit`. Negative means it made less. */
  profit_variance_pesewas: number | null
  lines: ApiJobVarianceLine[]
}

/** `GET /jobs/{id}/summary` — the owner's money, and the only place profit lives. */
export interface ApiJobSummary {
  job_id: number
  status: ApiJobStatus
  /** Recognised at `completed_at`, and zero until then. */
  earned_pesewas: number
  earned_at: string | null
  agreed_total_pesewas: number
  labour_charge_pesewas: number
  materials_charge_pesewas: number
  /** OWNER-ONLY: Σ quantity × landed cost. */
  device_cost_pesewas: number
  /** OWNER-ONLY: the sum of this job's costs. */
  misc_cost_actual_pesewas: number
  misc_cost_estimate_snapshot_pesewas: number
  /** OWNER-ONLY: device cost plus actual misc. Labour is excluded. */
  cost_total_pesewas: number
  /** OWNER-ONLY: agreed total minus cost total. May be negative. */
  profit_pesewas: number
  received_pesewas: number
  owed_pesewas: number
  balance_state: ApiJobBalanceState
  payment_link_url: string | null
  variance: ApiJobVariance
}

/** `GET /jobs/{id}/payments` */
export interface ApiJobPayment {
  id: number
  job_id: number
  amount_pesewas: number
  /** A label for reconciliation; nothing is processed here. */
  method: string
  paid_at: string
  reference: string | null
  note: string | null
  created_at: string
  updated_at: string
}

/** Where a cost was entered. `field` is the one to trust. */
export type ApiJobCostSource = 'field' | 'desk'

/** `GET /jobs/{id}/costs` */
export interface ApiJobCost {
  id: number
  job_id: number
  label: string
  amount_pesewas: number
  incurred_at: string
  receipt_url: string | null
  source: ApiJobCostSource
  created_at: string
  updated_at: string
}

/** The slice of the source quote the job's header and Charged caption read. */
export interface ApiJobQuoteRef {
  id: number
  accepted_at: string | null
  /**
   * What was agreed **on the quote**. The job's own `agreed_total_pesewas`
   * starts as a copy of this and can be moved afterwards, so this is the only
   * stable record of the original figure — which is what makes the Charged
   * field dashed until he moves it off this number.
   */
  agreed_total_pesewas: number | null
}

/** `GET /jobs/{id}/detail` — block C's whole screen in one read. */
export interface ApiJobDetail {
  id: number
  quote_id: number | null
  customer_id: number
  house_id: number
  job_type: ApiJobType
  status: ApiJobStatus
  title: string | null
  scheduled_for: string | null
  started_at: string | null
  completed_at: string | null
  labour_charge_pesewas: number
  materials_charge_pesewas: number
  misc_cost_estimate_snapshot_pesewas: number
  agreed_total_pesewas: number
  payment_link_url: string | null
  notes: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
  customer_name: string
  /** Null when the customer has only one house, and then the header omits it. */
  house_label: string | null
  quote: ApiJobQuoteRef | null
  lines: ApiJobLine[]
  summary: ApiJobSummary
  payments: ApiJobPayment[]
  costs: ApiJobCost[]
}

/** One stock movement the completion wrote. */
export interface ApiJobStockMovement {
  id: number
  item_id: number
  quantity_delta: number
  reason: string
  reference_id: number | null
  occurred_at: string
}

/** An item the completion put below zero. Never blocks the completion. */
export interface ApiNegativeStock {
  item_id: number
  item_name: string | null
  stock_on_hand: number
}

/** What completing did to the house record. */
export interface ApiHouseEffect {
  id: number
  effect: string
  installed_device_id: number
  previous_room_id: number | null
  previous_status: string | null
  previous_quantity: number | null
}

/** `POST /jobs/{id}/complete` */
export interface ApiJobCompletion {
  id: number
  status: ApiJobStatus
  completed_at: string | null
  lines: ApiJobLine[]
  stock: {
    movements: ApiJobStockMovement[]
    negative_stock: ApiNegativeStock[]
  }
  house_effects: ApiHouseEffect[]
}

// ── Raw shapes returned by the Frappe backend ──────────────────────────────
// The live `getDashboardData` server script returns a superset of the visible
// upande_kaitet file; every field here is treated as optional so the UI degrades
// gracefully whether it gets the basic or the enriched contract.

export interface RawOplItem {
  pli_id?: string
  item_code?: string
  item_name?: string
  bunches?: number
  stems?: number
  length?: string
  shelf?: string
  bucket?: string
  box_id?: string | null
  warehouse?: string
  picked_qty?: number
  stage?: string
  packed_bunches?: number
  boxes?: number
  is_packed?: boolean
}

export interface RawOpl {
  opl_id: string
  sales_order?: string
  customer?: string
  order_name?: string
  delivery_date?: string
  farm?: string
  team?: string
  consignee?: string
  priority?: string
  truck?: string
  issuing_percentage?: number
  packing_percentage?: number
  packing_progress?: number
  total_bunches?: number
  total_stems?: number
  packed_bunches?: number
  opl_status?: string
  is_ready_to_issue?: boolean
  is_being_issued?: boolean
  is_issued?: boolean
  has_fpl?: boolean
  fpl_status?: string | null
  fpl_completion?: number
  has_box_labels?: boolean
  box_count?: number
  box_progress?: string
  boxes_loaded?: number
  boxes_delivered?: number
  has_delivery?: boolean
  shelf_locations?: string
  item_count?: number
  items?: RawOplItem[]
  current_stage?: string
  is_urgent?: boolean
  needs_issuing?: boolean
  needs_packing?: boolean
  needs_box_labels?: boolean
  is_complete?: boolean
  varieties?: Variety[]
}

export interface RawDashboardResponse {
  success: boolean
  opls?: RawOpl[]
  ready_to_issue?: RawOpl[]
  box_labels_today?: RawBoxLabel[]
  team_stats?: Record<string, unknown>
  total_opls?: number
  ready_count?: number
  urgent_count?: number
  total_box_progress?: string
  boxes_printed_today?: number
  // optional enriched aggregates
  avg_issuing_pct?: number
  avg_packing_pct?: number
  global_issuing_pct?: number
  global_packing_pct?: number
  issuing_packing_gap?: number
  total_pick_stems?: number
  total_issued_stems?: number
  total_planned_stems?: number
  total_packed_stems?: number
  timestamp?: string
  debug?: string
}

export interface RawBoxLabel {
  box_number?: string | number
  customer?: string
  order_pick_list?: string
  box_total_count?: string | number
}

// ── Normalised shapes the UI actually renders ──────────────────────────────

export interface Variety {
  name: string
  stems: number
}

export type StageKey = 'ready' | 'issued' | 'packing' | 'packed' | 'labeled' | 'loaded' | 'dispatched' | 'draft'

export interface Opl {
  oplId: string
  orderName: string
  salesOrder: string
  customer: string
  team: string
  priority: string
  deliveryDate: string
  currentStage: string
  stageKey: StageKey
  isUrgent: boolean
  totalBunches: number
  totalStems: number
  boxProgress: string
  boxesPacked: number
  boxesExpected: number
  shelfLocations: string[]
  varieties: Variety[]
  issuingPct: number
  packingPct: number
}

export interface BoxLabel {
  boxNumber: string
  customer: string
  oplId: string
  totalBoxes: string
}

export interface KpiAggregates {
  avgIssuing: number
  avgPacking: number
  fulfillment: number
  gap: number
  totalPlannedStems: number
  totalPackedStems: number
  totalIssuedStems: number
  totalPickStems: number
}

export interface Dashboard {
  success: boolean
  opls: Opl[]
  readyToIssue: Opl[]
  boxLabels: BoxLabel[]
  totalOpls: number
  readyCount: number
  totalBoxesPacked: number
  totalBoxesExpected: number
  totalStems: number
  urgentCount: number
  aggregates: KpiAggregates
  timestamp: string
}

export interface DeliveryTotals {
  orders: number
  boxes: number
  stems: number
}

export type DateRange = 'today' | 'yesterday' | 'last7' | 'custom'

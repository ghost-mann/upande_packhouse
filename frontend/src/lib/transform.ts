import type {
  BoxLabel,
  Dashboard,
  KpiAggregates,
  Opl,
  RawBoxLabel,
  RawDashboardResponse,
  RawOpl,
  StageKey,
  Variety,
} from './types'

function stageKeyOf(stage: string | undefined): StageKey {
  const s = (stage || '').toLowerCase()
  if (s.includes('dispatch')) return 'dispatched'
  if (s.includes('load')) return 'loaded'
  if (s.includes('label')) return 'labeled'
  if (s.includes('pack') && !s.includes('start')) return 'packed'
  if (s.includes('pack')) return 'packing'
  if (s.includes('issued')) return 'issued'
  if (s.includes('draft')) return 'draft'
  return 'ready'
}

// Derive a variety breakdown from the OPL line items if the backend didn't
// already provide one. Items share an item_name → roll their stems together.
function deriveVarieties(raw: RawOpl): Variety[] {
  if (raw.varieties?.length) return raw.varieties
  const byName = new Map<string, number>()
  for (const it of raw.items || []) {
    const name = (it.item_name || it.item_code || 'Unknown').trim()
    byName.set(name, (byName.get(name) || 0) + (it.stems || 0))
  }
  return [...byName.entries()]
    .map(([name, stems]) => ({ name, stems }))
    .sort((a, b) => b.stems - a.stems)
}

function parseBoxProgress(raw: RawOpl): { progress: string; packed: number; expected: number } {
  // Prefer an explicit "x/y" string; otherwise fall back to box_count.
  if (raw.box_progress && raw.box_progress.includes('/')) {
    const [p, e] = raw.box_progress.split('/').map((n) => parseInt(n, 10) || 0)
    return { progress: raw.box_progress, packed: p, expected: e }
  }
  const expected = raw.box_count || 0
  const packed = raw.boxes_loaded || (raw.has_box_labels ? expected : 0)
  return { progress: `${packed}/${expected}`, packed, expected }
}

function normaliseOpl(raw: RawOpl): Opl {
  const { progress, packed, expected } = parseBoxProgress(raw)
  const shelves = (raw.shelf_locations || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== 'N/A' && s.toLowerCase() !== 'not shelved')

  return {
    oplId: raw.opl_id,
    orderName: raw.order_name || raw.sales_order || raw.opl_id,
    salesOrder: raw.sales_order || '',
    customer: raw.customer || '—',
    team: raw.team || 'Unassigned',
    priority: raw.priority || 'Normal',
    deliveryDate: raw.delivery_date || '',
    currentStage: raw.current_stage || 'Ready to Issue',
    stageKey: stageKeyOf(raw.current_stage),
    isUrgent: !!raw.is_urgent,
    totalBunches: raw.total_bunches || 0,
    totalStems: raw.total_stems || 0,
    boxProgress: progress,
    boxesPacked: packed,
    boxesExpected: expected,
    shelfLocations: shelves,
    varieties: deriveVarieties(raw),
    issuingPct: Math.round(raw.issuing_percentage || 0),
    packingPct: Math.round(raw.packing_percentage ?? raw.packing_progress ?? 0),
  }
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function computeAggregates(opls: Opl[], raw: RawDashboardResponse): KpiAggregates {
  const n = opls.length || 1
  const avgIssuing = raw.avg_issuing_pct ?? clampPct(opls.reduce((s, o) => s + o.issuingPct, 0) / n)
  const avgPacking = raw.avg_packing_pct ?? clampPct(opls.reduce((s, o) => s + o.packingPct, 0) / n)

  const totalStems = opls.reduce((s, o) => s + o.totalStems, 0)
  // Estimate stem-weighted progress when the backend doesn't supply totals.
  const totalPackedStems =
    raw.total_packed_stems ?? Math.round(opls.reduce((s, o) => s + (o.totalStems * o.packingPct) / 100, 0))
  const totalIssuedStems =
    raw.total_issued_stems ?? Math.round(opls.reduce((s, o) => s + (o.totalStems * o.issuingPct) / 100, 0))
  const totalPlannedStems = raw.total_planned_stems ?? totalStems
  const totalPickStems = raw.total_pick_stems ?? totalStems

  const fulfillment =
    raw.global_packing_pct ?? (totalPlannedStems ? clampPct((totalPackedStems / totalPlannedStems) * 100) : 0)
  const gap = raw.issuing_packing_gap ?? avgPacking - avgIssuing

  return {
    avgIssuing,
    avgPacking,
    fulfillment,
    gap: Math.round(gap),
    totalPlannedStems,
    totalPackedStems,
    totalIssuedStems,
    totalPickStems,
  }
}

function normaliseBoxLabel(raw: RawBoxLabel): BoxLabel {
  return {
    boxNumber: String(raw.box_number ?? '?'),
    customer: raw.customer || '—',
    oplId: raw.order_pick_list || '—',
    totalBoxes: String(raw.box_total_count ?? '?'),
  }
}

// When the backend omits box_labels_today, synthesise the panel from OPLs that
// already have labels so the print-room view is never empty without reason.
function deriveBoxLabels(opls: Opl[], raw: RawDashboardResponse): BoxLabel[] {
  if (raw.box_labels_today?.length) return raw.box_labels_today.map(normaliseBoxLabel)
  return opls
    .filter((o) => o.boxesPacked > 0 || ['labeled', 'loaded', 'dispatched', 'packed'].includes(o.stageKey))
    .map((o) => ({
      boxNumber: o.boxesPacked ? String(o.boxesPacked) : '—',
      customer: o.customer,
      oplId: o.oplId,
      totalBoxes: String(o.boxesExpected || o.boxesPacked || '?'),
    }))
}

export function transformDashboard(raw: RawDashboardResponse | null | undefined): Dashboard {
  const rawOpls = raw?.opls?.length ? raw.opls : raw?.ready_to_issue || []
  const opls = (rawOpls || []).map(normaliseOpl)
  const readyToIssue = (raw?.ready_to_issue || []).map(normaliseOpl)
  const aggregates = computeAggregates(opls, raw || ({} as RawDashboardResponse))

  const totalBoxesPacked = opls.reduce((s, o) => s + o.boxesPacked, 0)
  const totalBoxesExpected = opls.reduce((s, o) => s + o.boxesExpected, 0)
  const totalStems = opls.reduce((s, o) => s + o.totalStems, 0)

  return {
    success: !!raw?.success,
    opls,
    readyToIssue: readyToIssue.length ? readyToIssue : opls.filter((o) => o.stageKey === 'ready'),
    boxLabels: deriveBoxLabels(opls, raw || ({} as RawDashboardResponse)),
    totalOpls: raw?.total_opls ?? opls.length,
    readyCount: raw?.ready_count ?? readyToIssue.length,
    totalBoxesPacked,
    totalBoxesExpected,
    totalStems,
    urgentCount: raw?.urgent_count ?? opls.filter((o) => o.isUrgent).length,
    aggregates,
    timestamp: raw?.timestamp || '',
  }
}

export function emptyDashboard(): Dashboard {
  return transformDashboard({ success: false })
}

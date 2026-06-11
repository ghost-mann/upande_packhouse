import { getDoc, getListAll } from './api'

// ── Raw doctype shapes (only fields we read) ──
export interface SE {
  name: string
  posting_date?: string
  posting_time?: string
  creation?: string
  custom_farm?: string
  custom_greenhouse?: string
  custom_stem_length?: string
  custom_harvester?: string
  custom_harvester_payroll_number?: string
  custom_harvest_batch_no?: string
  custom_bucket_id?: string
  custom_received_bucket_id?: string
  custom_graded_by?: string
  custom_grader_payroll_number?: string
  custom_bunch_id?: string
  custom_bunched_by?: string
  custom_scanned_packing?: unknown
  custom_opl_scanned?: string
  to_warehouse?: string
  from_warehouse?: string
  stock_entry_type?: string
  docstatus?: number
}
export interface ShelfItem {
  name: string
  bucket_id?: string
  variety?: string
  greenhouse?: string
  stem_length?: string
  stem_qty?: number | string
  date_added?: string
  shelf_name: string
  shelf_farm: string
}
export interface AllocStatus {
  name: string
  bucket_id?: string
  item_code?: string
  stem_length?: string
  shelf_location?: string
  shelf_farm?: string
  total_quantity?: number
  allocated_quantity?: number
  available_quantity?: number
  bucket_allocations?: { sales_order: string; quantity_allocated: number; cancelled: 0 | 1 }[]
}
export interface OplRow {
  custom_bucket?: string
  custom_issued?: 0 | 1
  custom_shelf?: string
  stock_qty?: number | string
  custom_box_id?: string
  parent: string
  opl_customer?: string
  opl_order_name?: string
  opl_team?: string
  opl_status?: string
  opl_issuing_pct?: number | string
  opl_date?: string
  opl_sales_order?: string
  opl_consignee?: string
}

export type StageKey = 'Harvest' | 'Grading' | 'Receiving' | 'Shelving' | 'Allocation' | 'Issue'
export interface Journey {
  number: number
  isLatest: boolean
  sessionKey: string
  farm: string
  variety: string
  batchNo: string
  flowerType: 'spray' | 'standard'
  startDate: string
  endDate: string
  harvestSEs: SE[]
  gradingSEs: SE[]
  receivingSEs: SE[]
  shelfData: ShelfItem[]
  alloc: AllocStatus | null
  oplData: OplRow[]
}

const lc = (s?: string) => (s || '').toLowerCase()
const seDate = (se: SE) => se.posting_date || ''

export function parseBatch(batchNo?: string) {
  if (!batchNo) return { sessionKey: '', farm: '', variety: '', date: '' }
  const p = batchNo.split('-')
  const [prefix = '', farm = '', variety = '', y = '', m = '', d = ''] = p
  const date = [y, m, (d || '').trim()].filter(Boolean).join('-')
  return { sessionKey: `${prefix}-${farm}-${variety}-${date}`.toLowerCase(), farm, variety, date }
}

// ── Bucket mode ──
export async function loadBucketJourneys(id: string): Promise<Journey[]> {
  const [harvest, receiving, shelfParents, allocRows, oplParents] = await Promise.all([
    getListAll<SE>({ doctype: 'Stock Entry', filters: [['custom_bucket_id', '=', id], ['stock_entry_type', '=', 'Harvesting']], fields: ['name', 'posting_date', 'posting_time', 'custom_farm', 'custom_greenhouse', 'custom_stem_length', 'custom_harvester', 'custom_harvester_payroll_number', 'custom_harvest_batch_no', 'to_warehouse', 'docstatus'], orderBy: 'posting_date asc, posting_time asc' }),
    getListAll<SE>({ doctype: 'Stock Entry', filters: [['custom_received_bucket_id', '=', id], ['stock_entry_type', 'in', ['Receiving', 'Late Receipt']]], fields: ['name', 'posting_date', 'posting_time', 'custom_farm', 'custom_stem_length', 'custom_harvest_batch_no', 'custom_received_bucket_id', 'to_warehouse', 'from_warehouse', 'stock_entry_type', 'docstatus'], orderBy: 'posting_date asc, posting_time asc' }),
    getListAll<{ name: string; shelf_id: string; farm: string }>({ doctype: 'Shelf', filters: [['Shelf Item', 'bucket_id', '=', id]], fields: ['name', 'shelf_id', 'farm'] }),
    getListAll<AllocStatus>({ doctype: 'Bucket Allocation Status', filters: [['bucket_id', '=', id]], fields: ['name', 'bucket_id', 'item_code', 'stem_length', 'shelf_location', 'shelf_farm', 'total_quantity', 'allocated_quantity', 'available_quantity'] }),
    getListAll<{ name: string }>({ doctype: 'Order Pick List', filters: [['Pick List Item', 'custom_bucket', '=', id]], fields: ['name'] }),
  ])

  // Grading via batch nos
  const batchNos = [...new Set(harvest.map((h) => h.custom_harvest_batch_no).filter(Boolean))] as string[]
  let grading: SE[] = []
  if (batchNos.length) {
    grading = await getListAll<SE>({ doctype: 'Stock Entry', filters: [['custom_harvest_batch_no', 'in', batchNos], ['stock_entry_type', '=', 'Grading']], fields: ['name', 'posting_date', 'posting_time', 'custom_farm', 'custom_graded_by', 'custom_grader_payroll_number', 'custom_bunch_id', 'custom_stem_length', 'custom_harvest_batch_no', 'custom_bunched_by', 'custom_scanned_packing', 'to_warehouse', 'from_warehouse', 'docstatus'], orderBy: 'posting_date asc, posting_time asc' })
  }

  // Full shelf docs → items for this bucket
  const shelfItems: ShelfItem[] = []
  for (const sp of shelfParents) {
    const doc = await getDoc<{ name: string; farm: string; items?: ShelfItem[] }>('Shelf', sp.name).catch(() => null)
    if (!doc) continue
    for (const it of doc.items || []) {
      if (lc(it.bucket_id) === lc(id)) shelfItems.push({ ...it, shelf_name: doc.name, shelf_farm: doc.farm })
    }
  }

  // Full alloc
  let alloc: AllocStatus | null = null
  if (allocRows[0]) alloc = await getDoc<AllocStatus>('Bucket Allocation Status', allocRows[0].name).catch(() => null)

  // Full OPL docs → pick list items for this bucket
  const oplRows: OplRow[] = []
  for (const op of oplParents) {
    const doc = await getDoc<Record<string, unknown> & { locations?: OplRow[] }>('Order Pick List', op.name).catch(() => null)
    if (!doc) continue
    for (const loc of (doc.locations as OplRow[]) || []) {
      if (lc(loc.custom_bucket) === lc(id))
        oplRows.push({ ...loc, parent: doc.name as string, opl_customer: doc.customer as string, opl_order_name: doc.custom_order_name as string, opl_team: doc.custom_team as string, opl_status: doc.custom_status as string, opl_issuing_pct: doc.custom_issuing_percentage as number, opl_date: doc.date_created as string, opl_sales_order: doc.sales_order as string, opl_consignee: doc.custom_consignee as string })
    }
  }

  return buildJourneys(harvest, grading, receiving, shelfItems, alloc, oplRows)
}

function buildJourneys(harvest: SE[], grading: SE[], receiving: SE[], shelfItems: ShelfItem[], alloc: AllocStatus | null, oplRows: OplRow[]): Journey[] {
  const groups = new Map<string, Journey>()
  const ensure = (key: string, farm: string, variety: string, batchNo: string): Journey => {
    let j = groups.get(key)
    if (!j) {
      j = { number: 0, isLatest: false, sessionKey: key, farm, variety, batchNo, flowerType: 'standard', startDate: '', endDate: '', harvestSEs: [], gradingSEs: [], receivingSEs: [], shelfData: [], alloc: null, oplData: [] }
      groups.set(key, j)
    }
    return j
  }
  const place = (se: SE, bucket: 'harvestSEs' | 'gradingSEs' | 'receivingSEs') => {
    const pb = parseBatch(se.custom_harvest_batch_no)
    const key = pb.sessionKey || `loose-${se.name}`
    const j = ensure(key, pb.farm || se.custom_farm || '', pb.variety || '', se.custom_harvest_batch_no || '')
    j[bucket].push(se)
  }
  harvest.forEach((s) => place(s, 'harvestSEs'))
  grading.forEach((s) => place(s, 'gradingSEs'))
  receiving.forEach((s) => place(s, 'receivingSEs'))

  const journeys = [...groups.values()]
  for (const j of journeys) {
    const dates = [...j.harvestSEs, ...j.gradingSEs, ...j.receivingSEs].map(seDate).filter(Boolean).sort()
    j.startDate = dates[0] || ''
    j.endDate = dates[dates.length - 1] || ''
    const hb = new Set(j.harvestSEs.map((h) => h.custom_harvest_batch_no))
    const gb = j.gradingSEs.map((g) => g.custom_harvest_batch_no)
    j.flowerType = j.gradingSEs.length && j.harvestSEs.length && gb.some((b) => hb.has(b)) ? 'spray' : 'standard'
  }
  journeys.sort((a, b) => a.startDate.localeCompare(b.startDate))
  journeys.forEach((j, i) => { j.number = i + 1; j.isLatest = i === journeys.length - 1 })

  // Match shelf items / alloc / opl to the nearest preceding same-variety journey
  const pick = (eventDate: string, variety: string) => {
    const cands = journeys.filter((j) => !variety || lc(j.variety) === lc(variety))
    const pool = cands.length ? cands : journeys
    let best = pool[0]
    for (const j of pool) if (j.startDate <= eventDate && (!best || j.startDate >= best.startDate)) best = j
    return best
  }
  for (const si of shelfItems) { const j = pick(si.date_added || '', si.variety || ''); if (j) j.shelfData.push(si) }
  if (alloc) { const j = pick('', alloc.item_code || ''); if (j) j.alloc = alloc }
  for (const row of oplRows) { const j = pick(row.opl_date || '', ''); if (j) j.oplData.push(row) }

  return journeys
}

// ── Bunch mode (single journey) ──
export interface BunchResult {
  bunchId: string
  gradingSEs: SE[]
  harvestSEs: SE[]
  receivingSEs: SE[]
  shelfData: ShelfItem[]
  oplData: OplRow[]
  farm: string
  variety: string
  stemLength: string
  bunchedBy: string
  gradingDate: string
}

export async function loadBunchJourney(bunchId: string): Promise<BunchResult | null> {
  const grading = await getListAll<SE>({ doctype: 'Stock Entry', filters: [['custom_bunch_id', '=', bunchId], ['stock_entry_type', '=', 'Grading']], fields: ['name', 'posting_date', 'posting_time', 'creation', 'custom_farm', 'custom_graded_by', 'custom_grader_payroll_number', 'custom_bunch_id', 'custom_stem_length', 'custom_harvest_batch_no', 'custom_bunched_by', 'custom_scanned_packing', 'custom_opl_scanned', 'to_warehouse', 'from_warehouse', 'docstatus'], orderBy: 'posting_date asc, posting_time asc' })
  const batchNos = [...new Set(grading.map((g) => g.custom_harvest_batch_no).filter(Boolean))] as string[]

  let harvest: SE[] = [], receiving: SE[] = []
  if (batchNos.length) {
    ;[harvest, receiving] = await Promise.all([
      getListAll<SE>({ doctype: 'Stock Entry', filters: [['custom_harvest_batch_no', 'in', batchNos], ['stock_entry_type', '=', 'Harvesting']], fields: ['name', 'posting_date', 'custom_bucket_id', 'custom_farm', 'custom_greenhouse', 'custom_stem_length', 'custom_harvest_batch_no', 'custom_harvester', 'to_warehouse'], orderBy: 'posting_date asc' }),
      getListAll<SE>({ doctype: 'Stock Entry', filters: [['custom_harvest_batch_no', 'in', batchNos], ['stock_entry_type', 'in', ['Receiving', 'Late Receipt']]], fields: ['name', 'posting_date', 'stock_entry_type', 'custom_farm', 'custom_stem_length', 'custom_harvest_batch_no', 'custom_received_bucket_id', 'to_warehouse', 'from_warehouse'], orderBy: 'posting_date asc' }),
    ])
  }

  const bucketIds = [...new Set(harvest.map((h) => h.custom_bucket_id).filter(Boolean))] as string[]
  const shelfData: ShelfItem[] = []
  for (const bid of bucketIds) {
    const parents = await getListAll<{ name: string; farm: string }>({ doctype: 'Shelf', filters: [['Shelf Item', 'bucket_id', '=', bid]], fields: ['name', 'farm'] }).catch(() => [])
    for (const sp of parents) {
      const doc = await getDoc<{ name: string; farm: string; items?: ShelfItem[] }>('Shelf', sp.name).catch(() => null)
      if (!doc) continue
      for (const it of doc.items || []) if (lc(it.bucket_id) === lc(bid)) shelfData.push({ ...it, shelf_name: doc.name, shelf_farm: doc.farm })
    }
  }

  const oplNames = [...new Set(grading.map((g) => g.custom_opl_scanned).filter(Boolean))] as string[]
  const oplData: OplRow[] = []
  for (const n of oplNames) {
    const doc = await getDoc<Record<string, unknown> & { locations?: OplRow[] }>('Order Pick List', n).catch(() => null)
    if (!doc) continue
    for (const loc of (doc.locations as OplRow[]) || []) {
      if (!bucketIds.length || bucketIds.map(lc).includes(lc(loc.custom_bucket)))
        oplData.push({ ...loc, parent: doc.name as string, opl_customer: doc.customer as string, opl_order_name: doc.custom_order_name as string, opl_team: doc.custom_team as string, opl_status: doc.custom_status as string, opl_date: doc.date_created as string, opl_sales_order: doc.sales_order as string, opl_consignee: doc.custom_consignee as string })
    }
  }

  if (!grading.length && !harvest.length && !receiving.length && !shelfData.length && !oplData.length) return null
  const g0 = grading[0]
  return {
    bunchId, gradingSEs: grading, harvestSEs: harvest, receivingSEs: receiving, shelfData, oplData,
    farm: g0?.custom_farm || harvest[0]?.custom_farm || '',
    variety: parseBatch(g0?.custom_harvest_batch_no).variety || '',
    stemLength: g0?.custom_stem_length || '',
    bunchedBy: g0?.custom_bunched_by || '',
    gradingDate: g0?.posting_date || '',
  }
}

export function fmtDate(d?: string) {
  if (!d) return ''
  const dt = new Date(d.includes(' ') ? d.split(' ')[0] + 'T00:00:00' : d + 'T00:00:00')
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

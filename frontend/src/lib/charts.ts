import type { Dashboard, Opl, StageKey } from './types'

export interface StageDatum {
  key: StageKey
  label: string
  count: number
  color: string
}

const STAGE_META: Record<StageKey, { label: string; color: string; order: number }> = {
  ready: { label: 'Ready', color: '#29cd42', order: 0 },
  issued: { label: 'Issued', color: '#2490ef', order: 1 },
  packing: { label: 'Packing', color: '#7c5cfc', order: 2 },
  packed: { label: 'Packed', color: '#16c8c8', order: 3 },
  labeled: { label: 'Labeled', color: '#fc9c30', order: 4 },
  loaded: { label: 'Loaded', color: '#f59e0b', order: 5 },
  dispatched: { label: 'Dispatched', color: '#94a3b8', order: 6 },
  draft: { label: 'Draft', color: '#cbd5e1', order: 7 },
}

export function stageBreakdown(opls: Opl[]): StageDatum[] {
  const counts = new Map<StageKey, number>()
  for (const o of opls) counts.set(o.stageKey, (counts.get(o.stageKey) || 0) + 1)
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count, label: STAGE_META[key].label, color: STAGE_META[key].color }))
    .sort((a, b) => STAGE_META[a.key].order - STAGE_META[b.key].order)
}

export interface TeamDatum {
  team: string
  stems: number
  opls: number
  issuing: number
  packing: number
}

export function teamBreakdown(opls: Opl[]): TeamDatum[] {
  const map = new Map<string, { stems: number; opls: number; iss: number; pack: number }>()
  for (const o of opls) {
    const cur = map.get(o.team) || { stems: 0, opls: 0, iss: 0, pack: 0 }
    cur.stems += o.totalStems
    cur.opls += 1
    cur.iss += o.issuingPct
    cur.pack += o.packingPct
    map.set(o.team, cur)
  }
  return [...map.entries()]
    .map(([team, v]) => ({
      team,
      stems: v.stems,
      opls: v.opls,
      issuing: Math.round(v.iss / v.opls),
      packing: Math.round(v.pack / v.opls),
    }))
    .sort((a, b) => b.stems - a.stems)
}

export interface CustomerDatum {
  customer: string
  stems: number
  boxes: number
}

export function topCustomers(opls: Opl[], limit = 6): CustomerDatum[] {
  const map = new Map<string, { stems: number; boxes: number }>()
  for (const o of opls) {
    const cur = map.get(o.customer) || { stems: 0, boxes: 0 }
    cur.stems += o.totalStems
    cur.boxes += o.boxesExpected
    map.set(o.customer, cur)
  }
  return [...map.entries()]
    .map(([customer, v]) => ({ customer, ...v }))
    .sort((a, b) => b.stems - a.stems)
    .slice(0, limit)
}

// Issuing-vs-packing funnel rendered as a radial gauge trio.
export function flowGauges(d: Dashboard) {
  return [
    { name: 'Issuing', value: d.aggregates.avgIssuing, fill: '#2490ef' },
    { name: 'Packing', value: d.aggregates.avgPacking, fill: '#7c5cfc' },
    { name: 'Fulfillment', value: d.aggregates.fulfillment, fill: '#29cd42' },
  ]
}

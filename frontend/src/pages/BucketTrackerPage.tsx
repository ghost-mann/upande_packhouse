import { useState } from 'react'
import { Package, Search, Sparkles } from 'lucide-react'
import PageBar, { Main } from '../components/ui/PageBar'
import Segmented from '../components/Segmented'
import StatusLabel, { type Tone } from '../components/ui/StatusLabel'
import { openDoc } from '../lib/api'
import { fmtDate, loadBucketJourneys, loadBunchJourney, type BunchResult, type Journey, type OplRow } from '../lib/bucket'

type Mode = 'bucket' | 'bunch'
type View = 'hint' | 'loading' | 'results' | 'empty'

function journeyStatus(j: Journey): { label: string; tone: Tone } {
  const issued = j.oplData.some((o) => o.custom_issued === 1)
  if (j.oplData.length && issued) return { label: 'Issued', tone: 'success' }
  if (j.oplData.length) return { label: 'Pending Issue', tone: 'warning' }
  if (j.shelfData.length) return { label: 'On Shelf', tone: 'primary' }
  if (j.receivingSEs.length) return { label: 'Received', tone: 'info' }
  if (j.gradingSEs.length) return { label: 'Graded', tone: 'info' }
  return { label: 'Harvested', tone: 'success' }
}

const STAGES: Record<'spray' | 'standard', string[]> = {
  spray: ['Harvest', 'Grading', 'Receiving', 'Shelving', 'Allocation', 'Issue'],
  standard: ['Harvest', 'Receiving', 'Shelving', 'Grading', 'Allocation', 'Issue'],
}

function stageDone(j: Journey, stage: string): boolean {
  switch (stage) {
    case 'Harvest': return j.harvestSEs.length > 0
    case 'Grading': return j.gradingSEs.length > 0
    case 'Receiving': return j.receivingSEs.length > 0
    case 'Shelving': return j.shelfData.length > 0 || j.oplData.some((o) => o.custom_issued === 1)
    case 'Allocation': return (j.alloc?.bucket_allocations?.length || 0) > 0
    case 'Issue': return j.oplData.some((o) => o.custom_issued === 1)
    default: return false
  }
}

export default function BucketTrackerPage() {
  const [mode, setMode] = useState<Mode>('bucket')
  const [input, setInput] = useState('')
  const [view, setView] = useState<View>('hint')
  const [error, setError] = useState('')
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [bunch, setBunch] = useState<BunchResult | null>(null)
  const [selected, setSelected] = useState(0)

  const track = async (id = input) => {
    const q = id.trim()
    if (!q) return
    setError('')
    setView('loading')
    try {
      if (mode === 'bucket') {
        const js = await loadBucketJourneys(q)
        if (!js.length) { setView('empty'); return }
        setJourneys(js)
        setSelected(js[js.length - 1].number)
        setBunch(null)
        setView('results')
      } else {
        const b = await loadBunchJourney(q)
        if (!b) { setView('empty'); return }
        setBunch(b)
        setJourneys([])
        setView('results')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed')
      setView('empty')
    }
  }

  const switchMode = (m: Mode) => { setMode(m); setView('hint'); setInput(''); setJourneys([]); setBunch(null) }
  const current = journeys.find((j) => j.number === selected) || journeys[0]

  return (
    <>
      <PageBar title="Traceability">
        <Segmented value={mode} onChange={switchMode} options={[{ value: 'bucket', label: 'Bucket' }, { value: 'bunch', label: 'Bunch' }]} size="sm" />
        <div className="glass-soft flex items-center gap-2 rounded-2xl px-3 py-1.5" style={{ width: 240 }}>
          <Search size={14} className="shrink-0 text-ink-mute" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && track()}
            placeholder={mode === 'bucket' ? 'Enter Bucket ID' : 'Enter Bunch ID'}
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-mute"
          />
        </div>
        <button onClick={() => track()} className="rounded-2xl bg-accent-blue px-4 py-1.5 text-[13px] font-semibold text-white shadow-glass-sm transition hover:opacity-90">Track</button>
      </PageBar>

      <Main>
        {view === 'hint' && <Hint mode={mode} />}
        {view === 'loading' && (
          <div className="glass grid place-items-center rounded-2.5xl py-20 text-[13px] text-ink-mute">
            <div className="mb-3 h-9 w-9 animate-spin rounded-full border-[3px] border-accent-blue/30 border-t-accent-blue" />
            Tracing {mode} journey…
          </div>
        )}
        {view === 'empty' && (
          <div className="glass grid place-items-center rounded-2.5xl py-20 text-center">
            <Package size={26} className="mb-2 text-ink-mute" />
            <p className="text-[14px] font-semibold text-ink">Not Found</p>
            <p className="text-[12px] text-ink-mute">{error || `No records found for this ${mode === 'bucket' ? 'Bucket' : 'Bunch'} ID.`}</p>
          </div>
        )}

        {view === 'results' && mode === 'bucket' && current && (
          <>
            <BucketSummary id={input.trim().toUpperCase()} journeys={journeys} />
            {journeys.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {journeys.map((j) => {
                  const active = j.number === selected
                  return (
                    <button key={j.number} onClick={() => setSelected(j.number)} className={['rounded-2xl px-3.5 py-2 text-left transition', active ? 'bg-accent-blue text-white shadow-sm' : 'glass-soft text-ink-soft hover:bg-gray-100'].join(' ')}>
                      <div className="text-[12.5px] font-bold">Journey {j.number}</div>
                      <div className={['text-[10.5px]', active ? 'text-white/70' : 'text-ink-mute'].join(' ')}>{j.variety || '—'} · {fmtDate(j.startDate)}</div>
                    </button>
                  )
                })}
              </div>
            )}
            <JourneyPanel j={current} />
          </>
        )}

        {view === 'results' && mode === 'bunch' && bunch && <BunchPanel b={bunch} onTrackBucket={(bid) => { setMode('bucket'); setInput(bid); setTimeout(() => track(bid), 0) }} />}
      </Main>
    </>
  )
}

function Hint({ mode }: { mode: Mode }) {
  return (
    <div className="glass glass-sheen relative rounded-2.5xl p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-accent-blue/25 to-accent-purple/25 text-accent-blue"><Sparkles size={18} /></span>
        <div>
          <h2 className="text-[15px] font-bold text-ink">Traceability</h2>
          <p className="text-[12px] text-ink-mute">Track a {mode === 'bucket' ? 'bucket' : 'bunch'}'s full journey across the packhouse.</p>
        </div>
      </div>
      <div className="mt-5 space-y-2 text-[12px] text-ink-soft">
        <Flow label="Spray roses" chain="Harvest + Grading → Receiving → Shelving → Allocation → Issue" />
        <Flow label="Standard roses" chain="Harvest → Receiving → Shelving → Grading → Allocation → Issue" />
        <Flow label="Bunch" chain="Grading → Receiving → Shelf → OPL → Issue → Packing" />
      </div>
      <p className="mt-4 text-[11px] text-ink-mute">{mode === 'bucket' ? 'e.g. 5c8f60 · E0DE9D · 7D1BF6' : 'e.g. BQ-001-ABC'}</p>
    </div>
  )
}
function Flow({ label, chain }: { label: string; chain: string }) {
  return <div className="flex flex-wrap items-center gap-2"><span className="w-28 shrink-0 font-semibold text-ink">{label}</span><span className="rounded-lg bg-gray-50 px-2.5 py-1 font-medium">{chain}</span></div>
}

function BucketSummary({ id, journeys }: { id: string; journeys: Journey[] }) {
  const dates = journeys.flatMap((j) => [j.startDate, j.endDate]).filter(Boolean).sort()
  const status = journeyStatus(journeys[journeys.length - 1])
  return (
    <div className="glass glass-sheen relative flex flex-wrap items-center gap-x-10 gap-y-3 rounded-2.5xl p-5">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-mute">Bucket</div>
        <div className="text-[18px] font-bold text-ink">{id}</div>
      </div>
      <Meta label="Journeys" value={String(journeys.length)} />
      <Meta label="First Use" value={fmtDate(dates[0])} />
      <Meta label="Latest Activity" value={fmtDate(dates[dates.length - 1])} />
      <div className="ml-auto"><StatusLabel tone={status.tone}>{status.label}</StatusLabel></div>
    </div>
  )
}
function Meta({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[10px] font-semibold uppercase tracking-wide text-ink-mute">{label}</div><div className="text-[14px] font-bold text-ink">{value || '--'}</div></div>
}

function JourneyPanel({ j }: { j: Journey }) {
  const status = journeyStatus(j)
  const stages = STAGES[j.flowerType]
  return (
    <div className="glass glass-sheen relative space-y-5 rounded-2.5xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-ink">Journey {j.number} · {j.variety || '—'}</h2>
            {j.isLatest && <StatusLabel tone="primary">Latest</StatusLabel>}
          </div>
          <p className="mt-0.5 text-[12px] text-ink-mute">{j.farm} · {j.batchNo ? (j.batchNo.length > 52 ? j.batchNo.slice(0, 52) + '…' : j.batchNo) : ''}</p>
        </div>
        <StatusLabel tone={status.tone}>{status.label}</StatusLabel>
      </div>

      {/* Journey path */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stages.map((s) => {
          const done = stageDone(j, s)
          return (
            <div key={s} className={['rounded-2xl border p-3 text-center transition', done ? 'border-accent-green/30 bg-accent-green/[0.06]' : 'border-line bg-gray-50'].join(' ')}>
              <div className="text-[12px] font-bold text-ink">{s}</div>
              <div className={['mt-1 text-[10.5px] font-semibold', done ? 'text-accent-green' : 'text-ink-mute'].join(' ')}>{done ? 'Done' : '--'}</div>
            </div>
          )
        })}
      </div>

      {/* Detail sections */}
      {j.harvestSEs.length > 0 && (
        <Section title="Harvest">
          {j.harvestSEs.map((h) => (
            <DetailGrid key={h.name} items={[['Farm', h.custom_farm], ['Greenhouse', (h.custom_greenhouse || '').split(' - ')[0]], ['Stem Length', h.custom_stem_length], ['Harvester', h.custom_harvester_payroll_number || h.custom_harvester], ['Date', fmtDate(h.posting_date)], ['To Warehouse', h.to_warehouse], ['Stock Entry', h.name]]} />
          ))}
        </Section>
      )}
      {j.gradingSEs.length > 0 && (
        <Section title={`Grading (${j.gradingSEs.length})`}>
          {j.gradingSEs.map((g) => (
            <DetailGrid key={g.name} items={[['Graded By', g.custom_grader_payroll_number || g.custom_graded_by], ['Stem Length', g.custom_stem_length], ['Bunch ID', g.custom_bunch_id], ['Bunched By', g.custom_bunched_by], ['Packing Scanned', g.custom_scanned_packing ? 'Yes' : 'No'], ['Date', fmtDate(g.posting_date)], ['Stock Entry', g.name]]} />
          ))}
        </Section>
      )}
      {j.receivingSEs.length > 0 && (
        <Section title="Receiving">
          {j.receivingSEs.map((r) => (
            <DetailGrid key={r.name} items={[['Type', r.stock_entry_type], ['From', r.from_warehouse], ['To', r.to_warehouse], ['Stem Length', r.custom_stem_length], ['Farm', r.custom_farm], ['Date', fmtDate(r.posting_date)], ['Stock Entry', r.name]]} />
          ))}
        </Section>
      )}
      {j.shelfData.length > 0 && (
        <Section title="Shelving">
          {j.shelfData.map((s, i) => (
            <DetailGrid key={i} items={[['Shelf', s.shelf_name], ['Farm', s.shelf_farm], ['Variety', s.variety], ['Stem Length', s.stem_length], ['Stem Qty', String(s.stem_qty ?? '')], ['Date Added', fmtDate(s.date_added)]]} />
          ))}
        </Section>
      )}
      {j.alloc && (
        <Section title="Allocation">
          <DetailGrid items={[['Variety', j.alloc.item_code], ['Total Stems', String(j.alloc.total_quantity ?? '')], ['Allocated', String(j.alloc.allocated_quantity ?? '')], ['Available', String(j.alloc.available_quantity ?? '')], ['Shelf', j.alloc.shelf_location], ['Farm', j.alloc.shelf_farm]]} />
        </Section>
      )}

      {/* Sales Orders */}
      {!!j.alloc?.bucket_allocations?.length && (
        <Section title={`Sales Orders (${j.alloc.bucket_allocations.length})`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {j.alloc.bucket_allocations.map((a, i) => {
              const share = j.alloc!.total_quantity ? Math.round((a.quantity_allocated / j.alloc!.total_quantity!) * 100) : 0
              return (
                <button key={i} onClick={() => openDoc('Sales Order', a.sales_order)} className={['glass-soft glass-sheen relative rounded-2xl p-3.5 text-left transition hover:bg-gray-100', a.cancelled ? 'opacity-60' : ''].join(' ')}>
                  <div className="flex items-center justify-between"><span className="text-[12.5px] font-bold text-accent-blue">{a.sales_order}</span><StatusLabel tone={a.cancelled ? 'danger' : 'success'}>{a.cancelled ? 'Cancelled' : 'Active'}</StatusLabel></div>
                  <div className="mt-1 text-[12px] text-ink-soft">{a.quantity_allocated.toLocaleString()} stems allocated</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-accent-blue" style={{ width: `${share}%` }} /></div>
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {/* OPLs */}
      {j.oplData.length > 0 && <OplCards rows={j.oplData} />}
    </div>
  )
}

function OplCards({ rows }: { rows: OplRow[] }) {
  const byParent = new Map<string, OplRow>()
  rows.forEach((r) => { if (!byParent.has(r.parent)) byParent.set(r.parent, r) })
  return (
    <Section title={`Order Pick Lists (${byParent.size})`}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...byParent.values()].map((r) => {
          const pct = Number(r.opl_issuing_pct) || (r.custom_issued ? 100 : 0)
          const badge: { label: string; tone: Tone } = r.custom_issued ? { label: 'Issued', tone: 'success' } : pct > 0 ? { label: `${Math.round(pct)}% Issued`, tone: 'warning' } : { label: 'Pending', tone: 'default' }
          return (
            <button key={r.parent} onClick={() => openDoc('Order Pick List', r.parent)} className="glass-soft glass-sheen relative rounded-2xl p-3.5 text-left transition hover:bg-gray-100">
              <div className="flex items-center justify-between gap-2"><span className="truncate text-[12.5px] font-bold text-ink">{r.opl_order_name || r.parent}</span><StatusLabel tone={badge.tone}>{badge.label}</StatusLabel></div>
              <div className="mt-1 text-[11.5px] text-ink-soft">{r.opl_customer || '—'}{r.opl_consignee ? ` · ${r.opl_consignee}` : ''}</div>
              <div className="mt-0.5 text-[11px] text-ink-mute">{r.opl_sales_order} · {r.opl_team}</div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                <Mini label="Shelf" value={r.custom_shelf || '--'} />
                <Mini label="Stems" value={String(r.stock_qty ?? '--')} />
                <Mini label="Box" value={r.custom_box_id || '--'} />
              </div>
            </button>
          )
        })}
      </div>
    </Section>
  )
}
function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-gray-50 px-1.5 py-1"><div className="text-[9px] font-semibold uppercase text-ink-mute">{label}</div><div className="truncate text-[11px] font-bold text-ink">{value}</div></div>
}

function BunchPanel({ b, onTrackBucket }: { b: BunchResult; onTrackBucket: (id: string) => void }) {
  const issued = b.oplData.some((o) => o.custom_issued === 1)
  const tone: Tone = issued ? 'success' : b.oplData.length ? 'warning' : b.shelfData.length ? 'primary' : b.receivingSEs.length ? 'info' : b.gradingSEs.length ? 'info' : 'warning'
  const label = issued ? 'Issued' : b.oplData.length ? 'On OPL' : b.shelfData.length ? 'On Shelf' : b.receivingSEs.length ? 'Received' : b.gradingSEs.length ? 'Graded' : 'In Field'
  const bucketIds = [...new Set(b.harvestSEs.map((h) => h.custom_bucket_id).filter(Boolean))] as string[]
  const steps: { letter: string; title: string; meta: [string, string | undefined][]; date?: string; tone: string }[] = []
  b.harvestSEs.forEach((h) => steps.push({ letter: 'H', tone: 'bg-accent-green', title: 'Harvest', meta: [['Farm', h.custom_farm], ['Greenhouse', (h.custom_greenhouse || '').split(' - ')[0]], ['Bucket', h.custom_bucket_id], ['Harvester', h.custom_harvester]], date: fmtDate(h.posting_date) }))
  b.gradingSEs.forEach((g) => steps.push({ letter: 'G', tone: 'bg-accent-purple', title: 'Grading', meta: [['Graded By', g.custom_grader_payroll_number || g.custom_graded_by], ['Stem Length', g.custom_stem_length], ['Bunched By', g.custom_bunched_by], ['Packing Scanned', g.custom_scanned_packing ? 'Yes' : 'No']], date: fmtDate(g.posting_date) }))
  b.receivingSEs.forEach((r) => steps.push({ letter: 'R', tone: 'bg-accent-blue', title: 'Receiving', meta: [['Bucket', r.custom_received_bucket_id], ['From', r.from_warehouse], ['To', r.to_warehouse], ['Farm', r.custom_farm]], date: fmtDate(r.posting_date) }))
  b.shelfData.forEach((s) => steps.push({ letter: 'S', tone: 'bg-accent-orange', title: 'Shelf', meta: [['Shelf', s.shelf_name], ['Farm', s.shelf_farm], ['Variety', s.variety], ['Qty', String(s.stem_qty ?? '')]], date: fmtDate(s.date_added) }))
  const byParent = new Map<string, OplRow>(); b.oplData.forEach((r) => { if (!byParent.has(r.parent)) byParent.set(r.parent, r) })
  ;[...byParent.values()].forEach((o) => steps.push({ letter: 'P', tone: 'bg-accent-teal', title: 'Order Pick List', meta: [['OPL', o.parent], ['Customer', o.opl_customer], ['Sales Order', o.opl_sales_order], ['Box', o.custom_box_id]], date: fmtDate(o.opl_date) }))

  return (
    <div className="space-y-5">
      <div className="glass glass-sheen relative flex flex-wrap items-center gap-x-10 gap-y-3 rounded-2.5xl p-5">
        <div><div className="text-[10px] font-semibold uppercase tracking-wide text-ink-mute">Bunch</div><div className="text-[18px] font-bold text-ink">{b.bunchId}</div></div>
        <Meta label="Variety" value={b.variety} />
        <Meta label="Farm" value={b.farm} />
        <Meta label="Graded" value={fmtDate(b.gradingDate)} />
        <Meta label="Stem Length" value={b.stemLength} />
        <div className="ml-auto"><StatusLabel tone={tone}>{label}</StatusLabel></div>
      </div>

      <div className="glass glass-sheen relative rounded-2.5xl p-5">
        <h2 className="mb-4 text-[14px] font-bold text-ink">Detailed Timeline</h2>
        <div className="relative space-y-4 pl-2">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={['grid h-8 w-8 place-items-center rounded-full text-[12px] font-bold text-white', s.tone].join(' ')}>{s.letter}</span>
                {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-gray-100" />}
              </div>
              <div className="glass-soft flex-1 rounded-2xl p-3">
                <div className="flex items-center justify-between"><span className="text-[12.5px] font-bold text-ink">{s.title}</span>{s.date && <span className="text-[11px] text-ink-mute">{s.date}</span>}</div>
                <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                  {s.meta.filter(([, v]) => v).map(([kk, vv]) => (
                    <div key={kk}><span className="text-[10px] font-semibold uppercase text-ink-mute">{kk}</span><div className="truncate text-[12px] font-medium text-ink">{vv}</div></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {bucketIds.length > 0 && (
        <Section title="Linked Buckets">
          <div className="flex flex-wrap gap-2">
            {bucketIds.map((bid) => (
              <button key={bid} onClick={() => onTrackBucket(bid)} className="glass-soft rounded-xl px-3 py-1.5 text-[12px] font-semibold text-accent-blue transition hover:bg-gray-100">Track Bucket {bid}</button>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-soft">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
function DetailGrid({ items }: { items: [string, string | undefined][] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {items.filter(([, v]) => v != null && v !== '').map(([k, v]) => (
        <div key={k} className="rounded-xl bg-gray-50 px-3 py-2">
          <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-mute">{k}</div>
          <div className="truncate text-[12px] font-semibold text-ink">{v}</div>
        </div>
      ))}
    </div>
  )
}

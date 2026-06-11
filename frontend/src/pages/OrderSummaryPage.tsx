import { useCallback, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList, Flower2, Layers, Package, PackageCheck, Send, Truck, Warehouse } from 'lucide-react'
import PageBar, { Main } from '../components/ui/PageBar'
import { DateField, GlassSelect, LiveButton, SearchInput } from '../components/ui/controls'
import { FullRow, Td, Th, THead, TableWrap, Tr } from '../components/ui/Table'
import StatusLabel, { type Tone } from '../components/ui/StatusLabel'
import KpiCard from '../components/KpiCard'
import { EmptyState } from '../components/States'
import { useLiveData, todayISO } from '../hooks/useLiveData'
import { callMethod, openDoc } from '../lib/api'
import { num } from '../lib/format'

interface OrderLine {
  customer: string
  sales_order: string
  order_name: string
  line_no: number | string
  variety: string
  length: string | number
  box_type: string
  pack_rate: number | string
  boxes_ordered: number
  stems_ordered: number
  confirmed_stems: number
  processing_location: string
  team: string
  allocated_stems: number
  issued_stems: number
  packed_stems: number
  boxes_packed: number
  staged_boxes: number
  loaded_boxes: number
  dispatched_stems: number
  opl_id?: string
  fpl_id?: string
  dispatch_ref?: string
  status: string
}
interface Resp {
  success: boolean
  error?: string
  data?: OrderLine[]
}

const STATUS_ORDER = [
  'Not Allocated', 'Partially Allocated', 'Allocated', 'Partially Issued', 'Issued',
  'Partially Packed', 'Packed', 'Box Labels Generated', 'Partially Staged', 'Staged',
  'Partially Loaded', 'Loaded', 'Dispatched',
]
const STATUS_TONE: Record<string, Tone> = {
  'Not Allocated': 'default',
  'Partially Allocated': 'warning', 'Partially Issued': 'warning', 'Partially Packed': 'warning',
  'Partially Staged': 'warning', 'Partially Loaded': 'warning',
  Allocated: 'info', Packed: 'info',
  Issued: 'primary', 'Box Labels Generated': 'primary', Staged: 'primary',
  Loaded: 'success', Dispatched: 'success',
}

const dash = (v: number) => (v > 0 ? num(v) : <span className="text-ink-mute">--</span>)
const COLS = 21

export default function OrderSummaryPage() {
  const [deliveryDate, setDeliveryDate] = useState(todayISO())
  const [location, setLocation] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const fetcher = useCallback(
    () => callMethod<Resp>('fetchOrderSummaryData', { delivery_date: deliveryDate || todayISO(), processing_location: location }),
    [deliveryDate, location],
  )
  const { data, loading, error, lastUpdated, refresh } = useLiveData(fetcher, { intervalMs: 60_000 })

  const allRows = useMemo(() => (data?.success ? data.data || [] : []), [data])

  const locationOptions = useMemo(() => {
    const set = new Set(allRows.map((r) => r.processing_location).filter(Boolean))
    return [...set].sort().map((l) => ({ value: l, label: l }))
  }, [allRows])

  const statusCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of allRows) m.set(r.status, (m.get(r.status) || 0) + 1)
    return m
  }, [allRows])

  const rows = useMemo(() => {
    const term = search.toLowerCase().trim()
    return allRows.filter((r) => {
      if (status && r.status !== status) return false
      if (term) {
        const hay = `${r.customer || ''} ${r.sales_order || ''} ${r.order_name || ''} ${r.variety || ''}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [allRows, search, status])

  const k = useMemo(() => {
    const sum = (f: (r: OrderLine) => number) => rows.reduce((s, r) => s + (f(r) || 0), 0)
    return {
      orders: new Set(rows.map((r) => r.sales_order)).size,
      lines: rows.length,
      stems: sum((r) => r.stems_ordered),
      confirmed: sum((r) => r.confirmed_stems),
      boxes: sum((r) => r.boxes_ordered),
      allocated: sum((r) => r.allocated_stems),
      boxesPacked: sum((r) => r.boxes_packed),
      staged: sum((r) => r.staged_boxes),
      loaded: sum((r) => r.loaded_boxes),
      dispatched: sum((r) => r.dispatched_stems),
    }
  }, [rows])

  return (
    <>
      <PageBar
        title="Order Summary"
        subtitle={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Syncing…'}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search customer / order / variety…" />
        <DateField label="Delivery" value={deliveryDate} onChange={setDeliveryDate} />
        <GlassSelect value={location} onChange={setLocation} options={locationOptions} placeholder="All Locations" />
        <LiveButton loading={loading} onClick={refresh} />
      </PageBar>

      <Main>
        {error && <div className="glass rounded-2xl px-4 py-3 text-[12px] font-medium text-accent-red">API error: {error}</div>}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-10">
          <KpiCard icon={ClipboardList} label="Orders" value={num(k.orders)} tint="text-accent-blue" glow="from-accent-blue/20 to-sky-300/30" />
          <KpiCard icon={Layers} label="Lines" value={num(k.lines)} tint="text-accent-purple" glow="from-accent-purple/20 to-indigo-300/30" />
          <KpiCard icon={Flower2} label="Stems Ordered" value={num(k.stems)} tint="text-accent-blue" glow="from-accent-blue/20 to-sky-300/30" />
          <KpiCard icon={CheckCircle2} label="Confirmed" value={num(k.confirmed)} tint="text-accent-green" glow="from-accent-green/20 to-emerald-300/30" />
          <KpiCard icon={Package} label="Boxes Ordered" value={num(k.boxes)} tint="text-accent-orange" glow="from-accent-orange/20 to-amber-300/30" />
          <KpiCard icon={Layers} label="Allocated" value={num(k.allocated)} tint="text-accent-purple" glow="from-accent-purple/20 to-indigo-300/30" />
          <KpiCard icon={PackageCheck} label="Boxes Packed" value={num(k.boxesPacked)} tint="text-accent-orange" glow="from-accent-orange/20 to-amber-300/30" />
          <KpiCard icon={Warehouse} label="Staged" value={num(k.staged)} tint="text-accent-blue" glow="from-accent-teal/20 to-cyan-300/30" />
          <KpiCard icon={Truck} label="Loaded" value={num(k.loaded)} tint="text-accent-purple" glow="from-accent-purple/20 to-indigo-300/30" />
          <KpiCard icon={Send} label="Dispatched" value={num(k.dispatched)} tint="text-accent-green" glow="from-accent-green/20 to-emerald-300/30" />
        </div>

        {/* Status strip */}
        <div className="glass glass-sheen relative flex flex-wrap gap-2 rounded-2.5xl p-3">
          <StatusPill label="All" count={allRows.length} active={status === ''} onClick={() => setStatus('')} />
          {STATUS_ORDER.filter((s) => (statusCounts.get(s) || 0) > 0).map((s) => (
            <StatusPill key={s} label={s} count={statusCounts.get(s) || 0} active={status === s} tone={STATUS_TONE[s]} onClick={() => setStatus(s)} />
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 px-1">
            <h2 className="text-[13px] font-bold text-ink">Order Lines</h2>
            <span className="rounded-full bg-accent-blue/15 px-2.5 py-0.5 text-[11px] font-bold text-accent-blue tnum">
              {rows.length} {rows.length === 1 ? 'line' : 'lines'}
            </span>
          </div>
          <TableWrap minWidth={1840}>
            <THead>
              <tr>
                {['Customer', 'Order', 'Order Name', 'Ln', 'Variety', 'Len', 'Box Type', 'Pack Rate', 'Boxes', 'Stems Ord', 'Confirmed', 'Location', 'Team', 'Allocated', 'Issued', 'Packed', 'Box Pkd', 'Staged', 'Loaded', 'Dispatched', 'Status'].map((h, i) => (
                  <Th key={h} className={i >= 3 && i <= 10 ? 'text-right' : i >= 13 && i <= 19 ? 'text-right' : ''}>{h}</Th>
                ))}
              </tr>
            </THead>
            <tbody>
              {loading && !rows.length ? (
                <FullRow colSpan={COLS}><div className="py-10 text-center text-[12px] text-ink-mute">Loading order data…</div></FullRow>
              ) : !rows.length ? (
                <FullRow colSpan={COLS}><EmptyState message="No order lines found" /></FullRow>
              ) : (
                rows.map((r, i) => {
                  const prev = rows[i - 1]
                  const newCustomer = !prev || prev.customer !== r.customer
                  const newOrder = !prev || prev.sales_order !== r.sales_order
                  return (
                    <Tr key={i} topBorder={newCustomer}>
                      <Td className="font-bold">{newCustomer ? r.customer : ''}</Td>
                      <Td>{newOrder ? <button onClick={() => openDoc('Sales Order', r.sales_order)} className="font-medium text-accent-blue hover:underline">{r.sales_order}</button> : ''}</Td>
                      <Td className="text-ink-soft">{newOrder ? r.order_name || '--' : ''}</Td>
                      <Td className="text-right text-ink-soft tnum">{r.line_no}</Td>
                      <Td className="font-semibold">{r.variety || '--'}</Td>
                      <Td className="text-ink-soft">{r.length || '--'}</Td>
                      <Td className="text-ink-soft">{r.box_type || '--'}</Td>
                      <Td className="text-right text-ink-soft tnum">{r.pack_rate || '--'}</Td>
                      <Td className="text-right tnum">{dash(r.boxes_ordered)}</Td>
                      <Td className="text-right tnum">{dash(r.stems_ordered)}</Td>
                      <Td className="text-right tnum">{dash(r.confirmed_stems)}</Td>
                      <Td className="text-ink-soft">{r.processing_location || '--'}</Td>
                      <Td className="text-ink-soft">{r.team || '--'}</Td>
                      <Td className="text-right tnum">{r.allocated_stems > 0 ? <LinkNum v={r.allocated_stems} dt="Order Pick List" name={r.opl_id} /> : dash(0)}</Td>
                      <Td className="text-right tnum">{r.issued_stems > 0 ? <LinkNum v={r.issued_stems} dt="Order Pick List" name={r.opl_id} /> : dash(0)}</Td>
                      <Td className="text-right tnum">{r.packed_stems > 0 ? <LinkNum v={r.packed_stems} dt="Farm Pack List" name={r.fpl_id} /> : dash(0)}</Td>
                      <Td className="text-right tnum">{r.boxes_packed > 0 ? <LinkNum v={r.boxes_packed} dt="Farm Pack List" name={r.fpl_id} /> : dash(0)}</Td>
                      <Td className="text-right tnum">{dash(r.staged_boxes)}</Td>
                      <Td className="text-right tnum">{dash(r.loaded_boxes)}</Td>
                      <Td className="text-right tnum">{r.dispatched_stems > 0 ? <LinkNum v={r.dispatched_stems} dt="Dispatch Form" name={r.dispatch_ref?.split(',')[0].trim()} /> : dash(0)}</Td>
                      <Td><StatusLabel tone={STATUS_TONE[r.status] || 'default'}>{r.status}</StatusLabel></Td>
                    </Tr>
                  )
                })
              )}
            </tbody>
          </TableWrap>
        </div>
      </Main>
    </>
  )
}

function StatusPill({ label, count, active, tone, onClick }: { label: string; count: number; active: boolean; tone?: Tone; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition',
        active ? 'bg-accent-blue text-white shadow-sm' : 'bg-gray-50 text-ink-soft hover:bg-gray-100',
      ].join(' ')}
    >
      {label}
      <span className={['rounded-full px-1.5 text-[10px] tnum', active ? 'bg-gray-50' : 'bg-gray-100'].join(' ')}>{count}</span>
      {tone && !active && <span className={['h-1.5 w-1.5 rounded-full', toneDot(tone)].join(' ')} />}
    </button>
  )
}
function toneDot(t: Tone) {
  return { success: 'bg-accent-green', warning: 'bg-accent-orange', danger: 'bg-accent-red', info: 'bg-accent-purple', primary: 'bg-accent-blue', default: 'bg-ink-mute' }[t]
}

function LinkNum({ v, dt, name }: { v: number; dt: string; name?: string }) {
  if (!name) return <>{num(v)}</>
  return <button onClick={() => openDoc(dt, name)} className="font-medium text-accent-blue hover:underline tnum">{num(v)}</button>
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Boxes, CheckCircle2, Flower2, Layers, Percent, ShoppingCart, Sprout, UserCheck, Users, X } from 'lucide-react'
import PageBar, { Main } from '../components/ui/PageBar'
import { DateField, GlassSelect, LiveButton, SpinnerOverlay } from '../components/ui/controls'
import Typeahead from '../components/ui/Typeahead'
import { TableWrap, THead, Th, Td } from '../components/ui/Table'
import StatusLabel, { type Tone } from '../components/ui/StatusLabel'
import KpiCard from '../components/KpiCard'
import { EmptyState } from '../components/States'
import { useToast } from '../components/ui/toast'
import { useLiveData, todayISO } from '../hooks/useLiveData'
import { callMethod, openDoc } from '../lib/api'
import { num } from '../lib/format'

interface ConfirmedEntry { farm: string; stems: number }
interface Row {
  sales_order: string; line_no: number; order_name: string
  customer: string; transaction_date: string; delivery_date: string
  item_code: string; length: string
  stems_ordered: number; boxes_ordered: number
  farm_name: string; stock_total: number | null; stock_status: string; fulfillment_percentage: number
  custom_confirmed_stems_table?: ConfirmedEntry[]
}
interface Resp { success: boolean; data: Row[]; error?: string }

const entriesOf = (r: Row) => r.custom_confirmed_stems_table || []
const confirmedTotal = (r: Row) => entriesOf(r).reduce((s, e) => s + (e.stems || 0), 0)
const myStemsOf = (r: Row, loc: string) => (loc ? entriesOf(r).find((e) => e.farm === loc)?.stems || 0 : 0)
const remainingOf = (r: Row) => Math.max(0, (r.stems_ordered || 0) - confirmedTotal(r))
const lineKey = (r: Row) => `${r.sales_order}-${r.line_no}`

const statusTone = (s: string): Tone => (s === 'Sufficient' ? 'success' : s === 'Partial' ? 'warning' : 'danger')
const COLS = 17

export default function AllocationPlanningPage() {
  const [deliveryDate, setDeliveryDate] = useState(todayISO())
  const [location, setLocation] = useState(() => localStorage.getItem('selectedLocation') || '')
  const [f, setF] = useState({ customer: '', order: '', variety: '', length: '', farm: '', confirmedBy: '' })
  const [rows, setRows] = useState<Row[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const { show, node: toastNode } = useToast()

  const fetcher = useCallback(
    () => callMethod<Resp>('fetchSalesAllocationPlanningData', { delivery_date: deliveryDate || todayISO(), farm: f.farm || '' }),
    [deliveryDate, f.farm],
  )
  const { data, loading, error, lastUpdated, refresh } = useLiveData(fetcher, { intervalMs: 60_000 })

  useEffect(() => {
    if (data?.success) setRows(data.data || [])
  }, [data])

  const setLoc = (v: string) => {
    setLocation(v)
    if (v) localStorage.setItem('selectedLocation', v)
    else localStorage.removeItem('selectedLocation')
  }

  // Filter source lists
  const lists = useMemo(() => {
    const uniq = (vals: (string | undefined)[]) => [...new Set(vals.filter((x): x is string => !!x))].sort()
    const farms = new Set<string>()
    rows.forEach((r) => { if (r.farm_name && r.farm_name !== 'Unknown') farms.add(r.farm_name); entriesOf(r).forEach((e) => e.farm && farms.add(e.farm)) })
    return {
      customers: uniq(rows.map((r) => r.customer)),
      orders: uniq(rows.map((r) => r.sales_order)),
      varieties: uniq(rows.map((r) => r.item_code)),
      lengths: uniq(rows.map((r) => r.length)),
      stockFarms: uniq(rows.map((r) => r.farm_name).filter((x) => x !== 'No Stock Available')),
      farms: [...farms].sort(),
    }
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (f.customer && r.customer !== f.customer) return false
      if (f.order && r.sales_order !== f.order) return false
      if (f.variety && r.item_code !== f.variety) return false
      if (f.length && r.length !== f.length) return false
      if (f.farm && r.farm_name !== f.farm) return false
      if (f.confirmedBy) {
        const tot = confirmedTotal(r)
        if (f.confirmedBy === 'Unconfirmed') { if (tot !== 0) return false }
        else if (f.confirmedBy === 'Partial') { if (!(tot > 0 && tot < r.stems_ordered)) return false }
        else if (!entriesOf(r).some((e) => e.farm === f.confirmedBy)) return false
      }
      return true
    })
  }, [rows, f])

  // KPIs (line-deduped where noted)
  const k = useMemo(() => {
    const seen = new Set<string>()
    let boxes = 0, confirmed = 0, mine = 0, ordered = 0
    const customers = new Set<string>()
    for (const r of filtered) {
      customers.add(r.customer)
      const key = lineKey(r)
      if (!seen.has(key)) {
        seen.add(key)
        boxes += r.boxes_ordered || 0
        confirmed += confirmedTotal(r)
        mine += myStemsOf(r, location)
        ordered += r.stems_ordered || 0
      }
    }
    const stock = filtered.reduce((s, r) => s + (r.stock_total || 0), 0)
    return {
      customers: customers.size, lines: seen.size, entries: filtered.length,
      boxes, confirmed, mine, ordered, stock,
      pct: ordered > 0 ? Math.round((confirmed / ordered) * 100) : 0,
    }
  }, [filtered, location])

  // ── Mutations ──
  const doConfirm = async (r: Row) => {
    if (!location) return show('Please select your farm first', 'error')
    const raw = inputs[lineKey(r)]
    const stems = parseInt(raw ?? '', 10)
    if (isNaN(stems) || stems < 0) return show('Enter a valid number of stems', 'error')
    const max = remainingOf(r) + myStemsOf(r, location)
    if (stems > max) return show(`Maximum ${max.toLocaleString()} stems`, 'error')
    setBusy(true)
    try {
      const res = await callMethod<{ success: boolean; error?: string; data?: { confirmed_entries?: ConfirmedEntry[] } }>(
        'confimSalesOrderItem',
        { sales_order: r.sales_order, line_no: r.line_no, processing_location: location, action: 'confirm', stems },
      )
      if (!res?.success) return show(res?.error || 'Failed to update', 'error')
      show(`${stems.toLocaleString()} stems confirmed for ${location}`)
      applyConfirm(r, location, stems, res.data?.confirmed_entries)
    } catch (e) {
      show('Error updating', 'error')
    } finally {
      setBusy(false)
    }
  }

  const doRemove = async (r: Row, farm: string) => {
    if (farm !== location) return show('You can only remove your own confirmations', 'error')
    setBusy(true)
    try {
      const res = await callMethod<{ success: boolean; error?: string }>('confimSalesOrderItem', {
        sales_order: r.sales_order, line_no: r.line_no, processing_location: farm, action: 'unconfirm', stems: 0,
      })
      if (!res?.success) return show(res?.error || 'Failed to remove', 'error')
      show(`Confirmation removed for ${farm}`)
      mutateRow(r, (row) => ({ ...row, custom_confirmed_stems_table: entriesOf(row).filter((e) => e.farm !== farm) }))
    } catch {
      show('Error removing confirmation', 'error')
    } finally {
      setBusy(false)
    }
  }

  const mutateRow = (target: Row, fn: (r: Row) => Row) =>
    setRows((rs) => rs.map((r) => (r.sales_order === target.sales_order && r.line_no === target.line_no ? fn(r) : r)))

  const applyConfirm = (r: Row, farm: string, stems: number, serverEntries?: ConfirmedEntry[]) =>
    mutateRow(r, (row) => {
      if (serverEntries) return { ...row, custom_confirmed_stems_table: serverEntries }
      const list = [...entriesOf(row)]
      const idx = list.findIndex((e) => e.farm === farm)
      if (stems === 0) { if (idx >= 0) list.splice(idx, 1) }
      else if (idx >= 0) list[idx] = { ...list[idx], stems }
      else list.push({ farm, stems })
      return { ...row, custom_confirmed_stems_table: list }
    })

  const activeFilters = (Object.entries(f) as [keyof typeof f, string][]).filter(([, v]) => v)
  const clearAll = () => setF({ customer: '', order: '', variety: '', length: '', farm: '', confirmedBy: '' })

  // Render table rows with line grouping
  let lastKey = ''
  return (
    <>
      <SpinnerOverlay show={busy} />
      {toastNode}
      <PageBar title="Sales Allocation Planning" subtitle={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Syncing…'}>
        <GlassSelect label="My Farm" value={location} onChange={setLoc} options={lists.farms.map((x) => ({ value: x, label: x }))} placeholder="Select farm" />
        <LiveButton loading={loading} onClick={refresh} />
      </PageBar>

      <Main>
        {error && <div className="glass rounded-2xl px-4 py-3 text-[12px] font-medium text-accent-red">API error: {error}</div>}

        {/* Filters */}
        <div className="glass glass-sheen relative flex flex-wrap items-end gap-2.5 rounded-2.5xl p-4">
          <DateField label="Delivery" value={deliveryDate} onChange={setDeliveryDate} />
          <Typeahead label="Customer" value={f.customer} onChange={(v) => setF((s) => ({ ...s, customer: v }))} options={lists.customers} />
          <Typeahead label="Sales Order" value={f.order} onChange={(v) => setF((s) => ({ ...s, order: v }))} options={lists.orders} />
          <Typeahead label="Variety" value={f.variety} onChange={(v) => setF((s) => ({ ...s, variety: v }))} options={lists.varieties} width={150} />
          <Typeahead label="Length" value={f.length} onChange={(v) => setF((s) => ({ ...s, length: v }))} options={lists.lengths} width={110} />
          <Typeahead label="Stock Farm" value={f.farm} onChange={(v) => setF((s) => ({ ...s, farm: v }))} options={lists.stockFarms} />
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-mute">Confirmed By</span>
            <GlassSelect value={f.confirmedBy} onChange={(v) => setF((s) => ({ ...s, confirmedBy: v }))} placeholder="All" options={[...lists.farms.map((x) => ({ value: x, label: x })), { value: 'Unconfirmed', label: 'Unconfirmed' }, { value: 'Partial', label: 'Partial' }]} />
          </div>
          {activeFilters.length > 0 && (
            <button onClick={clearAll} className="glass-soft flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-ink-soft transition hover:bg-gray-100">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9">
          <KpiCard icon={Users} label="Customers" value={num(k.customers)} tint="text-accent-blue" glow="from-accent-blue/20 to-sky-300/30" />
          <KpiCard icon={Layers} label="Order Lines" value={num(k.lines)} tint="text-accent-purple" glow="from-accent-purple/20 to-indigo-300/30" />
          <KpiCard icon={Sprout} label="Stock Entries" value={num(k.entries)} tint="text-accent-green" glow="from-accent-green/20 to-emerald-300/30" />
          <KpiCard icon={Boxes} label="Total Boxes" value={num(k.boxes)} tint="text-accent-orange" glow="from-accent-orange/20 to-amber-300/30" />
          <KpiCard icon={CheckCircle2} label="Confirmed Stems" value={num(k.confirmed)} tint="text-accent-green" glow="from-accent-green/20 to-emerald-300/30" />
          <KpiCard icon={UserCheck} label="My Confirmed" value={num(k.mine)} tint="text-accent-blue" glow="from-accent-teal/20 to-cyan-300/30" />
          <KpiCard icon={Flower2} label="Ordered Stems" value={num(k.ordered)} tint="text-accent-purple" glow="from-accent-purple/20 to-indigo-300/30" />
          <KpiCard icon={ShoppingCart} label="Available Stock" value={num(k.stock)} tint="text-accent-orange" glow="from-accent-orange/20 to-amber-300/30" />
          <KpiCard icon={Percent} label="Confirmed %" value={`${k.pct}%`} tint="text-accent-green" glow="from-accent-green/20 to-emerald-300/30" />
        </div>

        <div>
          <h2 className="mb-2 px-1 text-[13px] font-bold text-ink">Farm-wise Stock &amp; Partial Confirmation</h2>
          <TableWrap minWidth={1320}>
            <THead>
              <tr>
                {['Customer', 'Order Date', 'Deliv Date', 'Order', 'Order Name', 'Ln', 'Variety', 'Len', 'Ordered', 'Boxes', 'Stock Farm', 'Stock', 'Status', '%', 'Confirmed', 'Action', 'Balance'].map((h, i) => (
                  <Th key={h} className={[8, 9, 11, 13, 16].includes(i) ? 'text-right' : ''}>{h}</Th>
                ))}
              </tr>
            </THead>
            <tbody>
              {loading && !filtered.length ? (
                <tr><td colSpan={COLS} className="py-10 text-center text-[12px] text-ink-mute">Loading…</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={COLS}><EmptyState message="No orders available" /></td></tr>
              ) : (
                filtered.map((r, i) => {
                  const key = lineKey(r)
                  const isNew = key !== lastKey
                  lastKey = key
                  const tot = confirmedTotal(r), ordered = r.stems_ordered || 0
                  const remaining = remainingOf(r), mine = myStemsOf(r, location)
                  const pctC = ordered > 0 ? Math.min(100, Math.round((tot / ordered) * 100)) : 0
                  const balance = (r.stock_total || 0) - ordered
                  const pct = r.fulfillment_percentage || 0
                  const farmBad = r.farm_name === 'No Stock Available' || r.farm_name === 'Unknown'
                  return (
                    <tr key={i} className={['transition-colors hover:bg-gray-50', isNew ? 'border-t border-line' : ''].join(' ')}>
                      <Td className="font-bold">{isNew ? r.customer : ''}</Td>
                      <Td className="text-ink-soft">{isNew ? r.transaction_date : ''}</Td>
                      <Td className="text-ink-soft">{isNew ? r.delivery_date : ''}</Td>
                      <Td>{isNew ? <button onClick={() => openDoc('Sales Order', r.sales_order)} className="font-medium text-accent-blue hover:underline">{r.sales_order || '--'}</button> : ''}</Td>
                      <Td className="text-ink-soft">{isNew ? r.order_name || '--' : ''}</Td>
                      <Td className="text-ink-soft tnum">{isNew ? r.line_no : ''}</Td>
                      <Td className="font-semibold">{isNew ? r.item_code : ''}</Td>
                      <Td className="text-ink-soft">{isNew ? r.length : ''}</Td>
                      <Td className="text-right tnum">{isNew ? num(ordered) : ''}</Td>
                      <Td className="text-right tnum">{isNew ? num(r.boxes_ordered) : ''}</Td>
                      <Td className={farmBad ? 'text-accent-red' : 'text-accent-green'}>{r.farm_name || 'Unknown'}</Td>
                      <Td className="text-right tnum">{r.stock_total != null ? num(r.stock_total) : '--'}</Td>
                      <Td><StatusLabel tone={statusTone(r.stock_status)}>{r.stock_status || 'No Stock'}</StatusLabel></Td>
                      <Td className={['text-right font-semibold tnum', pct >= 100 ? 'text-accent-green' : pct >= 50 ? 'text-accent-orange' : 'text-accent-red'].join(' ')}>{pct}%</Td>
                      <Td>{isNew ? <ConfirmedCell row={r} total={tot} ordered={ordered} pctC={pctC} location={location} onRemove={doRemove} /> : ''}</Td>
                      <Td>{isNew ? <ActionCell remaining={remaining} mine={mine} ordered={ordered} total={tot} location={location} value={inputs[key]} onInput={(v) => setInputs((s) => ({ ...s, [key]: v }))} onConfirm={() => doConfirm(r)} onRemove={() => doRemove(r, location)} /> : ''}</Td>
                      <Td className={['text-right font-semibold tnum', balance >= 0 ? 'text-accent-green' : 'text-accent-red'].join(' ')}>{balance.toLocaleString()}</Td>
                    </tr>
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

function ConfirmedCell({ row, total, ordered, pctC, location, onRemove }: { row: Row; total: number; ordered: number; pctC: number; location: string; onRemove: (r: Row, farm: string) => void }) {
  const entries = entriesOf(row)
  const fill = pctC >= 100 ? 'from-accent-green to-emerald-400' : pctC > 0 ? 'from-accent-orange to-amber-400' : 'from-slate-300 to-slate-200'
  return (
    <div className="min-w-[170px]">
      <div className="flex flex-wrap gap-1">
        {entries.length ? entries.map((e) => {
          const mine = e.farm === location
          return (
            <span key={e.farm} className={['inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold', mine ? 'bg-accent-blue/15 text-accent-blue' : 'bg-accent-green/12 text-accent-green'].join(' ')} title={`${e.farm}: ${e.stems} stems`}>
              {e.farm}: {e.stems.toLocaleString()}
              {mine && <X size={11} className="cursor-pointer hover:opacity-70" onClick={() => onRemove(row, e.farm)} />}
            </span>
          )
        }) : <span className="text-[11px] text-ink-mute">None</span>}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div className={['h-full rounded-full bg-gradient-to-r transition-[width]', fill].join(' ')} style={{ width: `${pctC}%` }} />
        </div>
        <span className="text-[10px] font-semibold text-ink-soft tnum">{total.toLocaleString()}/{ordered.toLocaleString()}</span>
      </div>
    </div>
  )
}

function ActionCell({ remaining, mine, ordered, total, location, value, onInput, onConfirm, onRemove }: {
  remaining: number; mine: number; ordered: number; total: number; location: string
  value?: string; onInput: (v: string) => void; onConfirm: () => void; onRemove: () => void
}) {
  if (!location) return <span className="text-[11px] text-ink-mute">Select farm</span>
  if (remaining > 0 || mine > 0) {
    const max = remaining + mine
    const def = mine > 0 ? mine : Math.min(remaining, ordered)
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number" min={0} max={max} title={`Max ${max}`}
          value={value ?? String(def)}
          onChange={(e) => onInput(e.target.value)}
          className="w-16 rounded-lg border border-line bg-white px-2 py-1 text-[12px] text-ink outline-none focus:border-accent-blue/60 focus:ring-2 focus:ring-accent-blue/20 tnum"
        />
        <button onClick={onConfirm} className="rounded-lg bg-accent-green/90 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-accent-green">{mine > 0 ? 'Update' : 'Confirm'}</button>
        {mine > 0 && <button onClick={onRemove} className="grid h-6 w-6 place-items-center rounded-lg bg-accent-red/12 text-accent-red transition hover:bg-accent-red/20"><X size={13} /></button>}
      </div>
    )
  }
  if (total >= ordered && ordered > 0) return <StatusLabel tone="success">Fully Confirmed</StatusLabel>
  return null
}

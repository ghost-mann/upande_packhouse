import { useCallback, useMemo, useState } from 'react'
import { ChevronRight, Flower2, Layers, Package, Percent, ShoppingCart, TrendingDown, TrendingUp } from 'lucide-react'
import PageBar, { Main } from '../components/ui/PageBar'
import { DateField, LiveButton, SearchInput } from '../components/ui/controls'
import { TableWrap, THead, Th } from '../components/ui/Table'
import Segmented from '../components/Segmented'
import KpiCard from '../components/KpiCard'
import { EmptyState } from '../components/States'
import { useLiveData, todayISO } from '../hooks/useLiveData'
import { callMethod } from '../lib/api'
import { num } from '../lib/format'

interface StockItem { variety: string; farm: string; length: string; stems: number | string }
interface OrderItem { variety: string; length: string; stems: number | string; item_group?: string }
interface Resp { success: boolean; error?: string; stock?: StockItem[]; orders?: OrderItem[] }

interface FarmRow { farm: string; byLen: Record<string, number>; total: number }
interface VarietyRow {
  variety: string; ig: string; farms: FarmRow[]
  stockByLen: Record<string, number>; orderedByLen: Record<string, number>
  totalStock: number; totalOrdered: number; variance: number
}

const numF = (n: number | string | undefined) => parseFloat(String(n)) || 0

function build(stock: StockItem[], orders: OrderItem[]) {
  const stockMap: Record<string, Record<string, Record<string, number>>> = {}
  const orderMap: Record<string, Record<string, number>> = {}
  const itemGroups: Record<string, string> = {}
  const lengthSet = new Set<string>()
  const varieties = new Set<string>()

  for (const it of stock) {
    const v = (it.variety || 'Unknown').trim(), f = (it.farm || 'Unknown').trim(), l = (it.length || '--').toString().trim()
    lengthSet.add(l); varieties.add(v)
    stockMap[v] ??= {}; stockMap[v][f] ??= {}
    stockMap[v][f][l] = (stockMap[v][f][l] || 0) + numF(it.stems)
  }
  for (const it of orders) {
    const v = (it.variety || 'Unknown').trim(), l = (it.length || '--').toString().trim()
    lengthSet.add(l); varieties.add(v)
    orderMap[v] ??= {}
    orderMap[v][l] = (orderMap[v][l] || 0) + numF(it.stems)
    if (!(v in itemGroups)) itemGroups[v] = it.item_group || ''
  }

  const lengths = [...lengthSet].sort((a, b) => {
    const na = parseInt(a, 10), nb = parseInt(b, 10)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    if (!isNaN(na)) return -1
    if (!isNaN(nb)) return 1
    return a.localeCompare(b)
  })

  const rows: VarietyRow[] = [...varieties].sort().map((v) => {
    const farmMap = stockMap[v] || {}
    const stockByLen: Record<string, number> = {}
    const farms: FarmRow[] = Object.keys(farmMap).sort().map((f) => {
      const byLen: Record<string, number> = {}
      let total = 0
      for (const l of lengths) {
        const val = farmMap[f][l] || 0
        byLen[l] = val; total += val
        stockByLen[l] = (stockByLen[l] || 0) + val
      }
      return { farm: f, byLen, total }
    })
    const orderedByLen: Record<string, number> = {}
    let totalOrdered = 0, totalStock = 0
    for (const l of lengths) {
      orderedByLen[l] = (orderMap[v]?.[l]) || 0
      totalOrdered += orderedByLen[l]
      totalStock += stockByLen[l] || 0
    }
    return { variety: v, ig: itemGroups[v] || '', farms, stockByLen, orderedByLen, totalStock, totalOrdered, variance: totalStock - totalOrdered }
  })

  return { lengths, rows }
}

function varCls(v: number) {
  if (v === 0) return 'bg-gray-50 text-ink-mute'
  if (v > 0) return 'bg-accent-green/12 text-accent-green'
  if (v >= -500) return 'bg-accent-orange/12 text-accent-orange'
  return 'bg-accent-red/12 text-accent-red'
}
const fmtNum = (n: number) => (n === 0 || n == null ? <span className="text-ink-mute">--</span> : n.toLocaleString())
const fmtVar = (v: number) => (v == null ? '--' : (v > 0 ? '+' : '') + v.toLocaleString())

export default function StockVisibilityPage() {
  const [deliveryDate, setDeliveryDate] = useState(todayISO())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'spray' | 'standard'>('all')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const fetcher = useCallback(() => callMethod<Resp>('getStockVisibilityData', { delivery_date: deliveryDate || todayISO() }), [deliveryDate])
  const { data, loading, error, lastUpdated, refresh } = useLiveData(fetcher, { intervalMs: 60_000 })

  const stock = useMemo(() => (data?.success ? data.stock || [] : []), [data])
  const orders = useMemo(() => (data?.success ? data.orders || [] : []), [data])
  const { lengths, rows } = useMemo(() => build(stock, orders), [stock, orders])

  const visible = useMemo(() => {
    const term = search.toLowerCase().trim()
    return rows.filter((r) => {
      if (filter === 'spray' && r.ig !== 'Spray Roses') return false
      if (filter === 'standard' && r.ig !== 'Standard Roses') return false
      if (term && !r.variety.toLowerCase().includes(term)) return false
      return true
    })
  }, [rows, filter, search])

  const totalStock = visible.reduce((s, r) => s + r.totalStock, 0)
  const totalOrdered = visible.reduce((s, r) => s + r.totalOrdered, 0)
  const variance = totalStock - totalOrdered
  const coverage = totalOrdered > 0 ? Math.round((totalStock / totalOrdered) * 100) : 0
  const cols = 2 + lengths.length * 3 + 3

  const toggle = (v: string) =>
    setCollapsed((c) => { const n = new Set(c); n.has(v) ? n.delete(v) : n.add(v); return n })

  return (
    <>
      <PageBar title="Stock Visibility" subtitle={lastUpdated ? `Delivery ${deliveryDate}` : 'Syncing…'}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search variety…" width={180} />
        <DateField label="Delivery" value={deliveryDate} onChange={setDeliveryDate} />
        <Segmented
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: 'All' }, { value: 'spray', label: 'Sprays' }, { value: 'standard', label: 'Standard' }]}
        />
        <LiveButton loading={loading} onClick={refresh} />
      </PageBar>

      <Main>
        {error && <div className="glass rounded-2xl px-4 py-3 text-[12px] font-medium text-accent-red">API error: {error}</div>}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard icon={Flower2} label="Varieties" value={num(visible.length)} tint="text-accent-blue" glow="from-accent-blue/20 to-sky-300/30" />
          <KpiCard icon={Package} label="Total Stock (Stems)" value={num(totalStock)} tint="text-accent-green" glow="from-accent-green/20 to-emerald-300/30" />
          <KpiCard icon={ShoppingCart} label="Total Ordered (Stems)" value={num(totalOrdered)} tint="text-accent-purple" glow="from-accent-purple/20 to-indigo-300/30" />
          <KpiCard
            icon={variance >= 0 ? TrendingUp : TrendingDown}
            label="Overall Variance"
            value={<span className={variance >= 0 ? 'text-accent-green' : 'text-accent-red'}>{(variance >= 0 ? '+' : '') + variance.toLocaleString()}</span>}
            tint={variance >= 0 ? 'text-accent-green' : 'text-accent-red'}
            glow={variance >= 0 ? 'from-accent-green/20 to-emerald-300/30' : 'from-accent-red/20 to-rose-300/30'}
          />
          <KpiCard icon={Layers} label="Shelf Entries" value={num(stock.length)} tint="text-accent-orange" glow="from-accent-orange/20 to-amber-300/30" />
          <KpiCard icon={Percent} label="Coverage" value={`${coverage}%`} tint="text-accent-blue" glow="from-accent-teal/20 to-cyan-300/30" />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-3 px-1">
            <h2 className="text-[13px] font-bold text-ink">Variety Stock vs Orders — by Farm &amp; Length</h2>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-ink-soft tnum">{visible.length} varieties</span>
            <div className="ml-auto flex items-center gap-3 text-[11px] font-medium text-ink-soft">
              <Legend cls="bg-accent-green/40" label="Surplus" />
              <Legend cls="bg-accent-orange/40" label="Tight" />
              <Legend cls="bg-accent-red/40" label="Deficit" />
            </div>
          </div>

          <TableWrap minWidth={Math.max(900, cols * 90)}>
            <THead>
              <tr>
                <Th colSpan={2}>Variety / Farm</Th>
                {lengths.map((l) => (
                  <Th key={l} colSpan={3} className="text-center">{l}</Th>
                ))}
                <Th colSpan={3} className="text-center text-accent-blue">Total</Th>
              </tr>
              <tr>
                <Th>Variety</Th>
                <Th className="text-ink-mute">Farm</Th>
                {lengths.flatMap((l) => [
                  <SubTh key={`s-${l}`} className="text-accent-green">Stock</SubTh>,
                  <SubTh key={`o-${l}`} className="text-accent-blue">Ord</SubTh>,
                  <SubTh key={`v-${l}`} className="text-ink-mute">Var</SubTh>,
                ])}
                <SubTh className="text-accent-green">Stock</SubTh>
                <SubTh className="text-accent-blue">Ord</SubTh>
                <SubTh className="text-ink-mute">Var</SubTh>
              </tr>
            </THead>
            <tbody>
              {loading && !visible.length ? (
                <tr><td colSpan={cols} className="py-10 text-center text-[12px] text-ink-mute">Loading stock and order data…</td></tr>
              ) : !visible.length ? (
                <tr><td colSpan={cols}><EmptyState message="No varieties found" /></td></tr>
              ) : (
                visible.map((r) => {
                  const open = !collapsed.has(r.variety)
                  return (
                    <FragmentRows key={r.variety} r={r} lengths={lengths} open={open} onToggle={() => toggle(r.variety)} />
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

function FragmentRows({ r, lengths, open, onToggle }: { r: VarietyRow; lengths: string[]; open: boolean; onToggle: () => void }) {
  return (
    <>
      <tr onClick={onToggle} className="cursor-pointer border-t border-line font-semibold transition-colors hover:bg-gray-50">
        <td className="whitespace-nowrap px-3 py-2">
          <span className="inline-flex items-center gap-1">
            <ChevronRight size={13} className={['text-ink-mute transition', open ? 'rotate-90' : ''].join(' ')} />
            {r.variety}
          </span>
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-[11px] font-normal text-ink-mute">{r.farms.length} farm{r.farms.length !== 1 ? 's' : ''}</td>
        {lengths.map((l) => {
          const s = r.stockByLen[l] || 0, o = r.orderedByLen[l] || 0
          return (
            <Cells key={l} stock={s} ord={o} hasData={!!(s || o)} />
          )
        })}
        <td className="px-2 py-2 text-right text-accent-green tnum">{fmtNum(r.totalStock)}</td>
        <td className="px-2 py-2 text-right text-accent-blue tnum">{fmtNum(r.totalOrdered)}</td>
        <td className={['px-2 py-2 text-right font-bold tnum', varCls(r.variance)].join(' ')}>{fmtVar(r.variance)}</td>
      </tr>
      {open && r.farms.map((fr) => (
        <tr key={fr.farm} className="bg-gray-50 text-ink-soft transition-colors hover:bg-gray-50">
          <td className="px-3 py-1.5"></td>
          <td className="whitespace-nowrap px-3 py-1.5 text-[12px]">{fr.farm}</td>
          {lengths.flatMap((l) => [
            <td key={`s${l}`} className="px-2 py-1.5 text-right tnum">{fmtNum(fr.byLen[l] || 0)}</td>,
            <td key={`o${l}`} className="px-2 py-1.5 text-right text-ink-mute">--</td>,
            <td key={`v${l}`} className="px-2 py-1.5 text-right text-ink-mute">--</td>,
          ])}
          <td className="px-2 py-1.5 text-right tnum">{fmtNum(fr.total)}</td>
          <td className="px-2 py-1.5 text-right text-ink-mute">--</td>
          <td className="px-2 py-1.5 text-right text-ink-mute">--</td>
        </tr>
      ))}
    </>
  )
}

function Cells({ stock, ord, hasData }: { stock: number; ord: number; hasData: boolean }) {
  return (
    <>
      <td className="px-2 py-2 text-right text-accent-green tnum">{fmtNum(stock)}</td>
      <td className="px-2 py-2 text-right text-accent-blue tnum">{fmtNum(ord)}</td>
      <td className={['px-2 py-2 text-right tnum', hasData ? varCls(stock - ord) : ''].join(' ')}>
        {hasData ? fmtVar(stock - ord) : <span className="text-ink-mute">--</span>}
      </td>
    </>
  )
}

function SubTh({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={['border-b border-line px-2 py-1.5 text-right text-[10px] font-bold uppercase', className].join(' ')}>{children}</th>
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={['h-2.5 w-2.5 rounded', cls].join(' ')} />{label}</span>
}

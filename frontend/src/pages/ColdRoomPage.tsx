import { useMemo, useState } from 'react'
import { Boxes, Clock, Droplets, Flower2, Inbox, Layers, Package, Thermometer, Trash2 } from 'lucide-react'
import PageBar, { Main } from '../components/ui/PageBar'
import { GlassSelect, LiveButton, SearchInput } from '../components/ui/controls'
import { TableWrap, THead, Th, Td, Tr } from '../components/ui/Table'
import Segmented from '../components/Segmented'
import Panel from '../components/Panel'
import KpiCard from '../components/KpiCard'
import ColdPressureCard from '../components/ColdPressureCard'
import { EmptyState } from '../components/States'
import { BarsH, BarsV, Donut, SensorLine, type Datum } from '../components/charts/generic'
import { useColdRoom, type SensorSeries } from '../hooks/useColdRoom'
import { num } from '../lib/format'

const AGE_COLORS = ['#29cd42', '#7cda89', '#fc9c30', '#e63757']

function sensorStatus(s: SensorSeries | null, kind: 'temp' | 'hum') {
  const v = lastReading(s)
  if (v == null || !s) return null
  const { min, max } = s.thresholds
  if (v >= min && v <= max) return { txt: 'Normal', cls: 'text-accent-green' }
  if (kind === 'temp') return v > max ? { txt: 'Too High', cls: 'text-accent-red' } : { txt: 'Too Low', cls: 'text-accent-orange' }
  return { txt: 'Out of Range', cls: 'text-accent-orange' }
}
function lastReading(s: SensorSeries | null): number | null {
  if (!s || !s.values?.length) return null
  const v = s.values[s.values.length - 1]
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
function latest(s: SensorSeries | null, unit: string) {
  const v = lastReading(s)
  return v == null ? '--' : v.toFixed(1) + unit
}
const toData = (rec: Record<string, number> | undefined): Datum[] =>
  Object.entries(rec || {}).map(([name, value]) => ({ name, value }))

export default function ColdRoomPage() {
  const [farm, setFarm] = useState('')
  const [view, setView] = useState<'dashboard' | 'shelf'>('dashboard')
  const [shelfSearch, setShelfSearch] = useState('')
  const { data, temp, hum, loading, error, lastUpdated, refresh } = useColdRoom(farm)

  const ok = data?.success
  const agg = useMemo(() => (ok ? data!.aggregations || {} : {}), [data, ok])
  const caps = useMemo(() => (ok ? data!.capacity_data || [] : []), [data, ok])
  const stock = useMemo(() => (ok ? data!.stock_data || [] : []), [data, ok])
  const farmOptions = useMemo(
    () => (ok ? (data!.available_farms || []).map((f) => ({ value: f.name, label: f.name })) : []),
    [data, ok],
  )

  const varietyData = useMemo(
    () => toData(agg.variety_stems).sort((a, b) => b.value - a.value).slice(0, 15),
    [agg],
  )
  const lengthData = useMemo(
    () => toData(agg.length_stems).sort((a, b) => (parseFloat(a.name) || 0) - (parseFloat(b.name) || 0)),
    [agg],
  )
  const farmData = useMemo(() => toData(agg.farm_stems).sort((a, b) => b.value - a.value), [agg])
  const ageData = useMemo<Datum[]>(
    () => (agg.age_dist_labels || []).map((name, i) => ({ name, value: (agg.age_dist_values || [])[i] || 0, color: AGE_COLORS[Math.min(i, 3)] })),
    [agg],
  )

  const shelfRows = useMemo(() => {
    const term = shelfSearch.toLowerCase().trim()
    return stock.filter((r) => !term || String(r.item_code || '').toLowerCase().includes(term))
  }, [stock, shelfSearch])

  const ts = sensorStatus(temp, 'temp'), hs = sensorStatus(hum, 'hum')

  // Safe y-domain for the temperature chart — only when both bounds are finite.
  const tempDomain: [number, number] | undefined =
    temp && Number.isFinite(temp.min_value) && Number.isFinite(temp.max_value)
      ? [Math.min(temp.thresholds.min - 1, temp.min_value - 0.5), Math.max(temp.thresholds.max + 1, temp.max_value + 0.5)]
      : undefined

  return (
    <>
      <PageBar title="Cold Room" subtitle={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Syncing…'}>
        <Segmented size="sm" value={view} onChange={setView} options={[{ value: 'dashboard', label: 'Dashboard' }, { value: 'shelf', label: 'Shelf Contents' }]} />
        <GlassSelect label="Farm" value={farm} onChange={setFarm} options={farmOptions} placeholder="All Farms" />
        <LiveButton loading={loading} onClick={refresh} />
      </PageBar>

      <Main>
        {error && <div className="glass rounded-2xl px-4 py-3 text-[12px] font-medium text-accent-red">API error: {error}</div>}

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-10">
          <KpiCard icon={Layers} label="Shelves in Use" value={num(agg.total_shelves)} tint="text-accent-orange" glow="from-accent-orange/20 to-amber-300/30" />
          <KpiCard icon={Boxes} label="Total Buckets" value={num(agg.total_buckets)} tint="text-accent-blue" glow="from-accent-blue/20 to-sky-300/30" />
          <KpiCard icon={Flower2} label="Total Stems" value={num(agg.total_stems)} tint="text-accent-purple" glow="from-accent-purple/20 to-indigo-300/30" />
          <KpiCard icon={Package} label="Varieties" value={num(agg.total_varieties)} tint="text-accent-green" glow="from-accent-green/20 to-emerald-300/30" />
          <KpiCard icon={Clock} label="Avg Age" value={`${agg.avg_age_days || 0}d`} tint="text-accent-orange" glow="from-accent-orange/20 to-amber-300/30" sub={agg.oldest_age_days ? <span className="text-[10px] font-semibold text-ink-mute">Oldest: {agg.oldest_age_days}d</span> : undefined} />
          <KpiCard icon={Thermometer} label="Temperature" value={<span>{latest(temp, '°C')}</span>} tint="text-accent-blue" glow="from-accent-blue/20 to-sky-300/30" sub={ts ? <span className={['text-[10px] font-bold', ts.cls].join(' ')}>● {ts.txt}</span> : undefined} />
          <KpiCard icon={Droplets} label="Humidity" value={<span>{latest(hum, '%')}</span>} tint="text-accent-purple" glow="from-accent-purple/20 to-indigo-300/30" sub={hs ? <span className={['text-[10px] font-bold', hs.cls].join(' ')}>● {hs.txt}</span> : undefined} />
          <KpiCard icon={Inbox} label="Received (Not Shelved)" value={num(agg.total_incoming_stems)} tint="text-accent-green" glow="from-accent-green/20 to-emerald-300/30" sub={agg.total_incoming_buckets ? <span className="text-[10px] font-semibold text-ink-mute">{agg.total_incoming_buckets} buckets</span> : undefined} />
          <KpiCard icon={Layers} label="Allocated (Not Issued)" value={num(agg.total_allocated_stems)} tint="text-accent-purple" glow="from-accent-purple/20 to-indigo-300/30" sub={agg.total_allocated_buckets ? <span className="text-[10px] font-semibold text-ink-mute">{agg.total_allocated_buckets} buckets</span> : undefined} />
          <KpiCard icon={Trash2} label="Discards Today" value={num(agg.total_discard_stems)} tint="text-accent-red" glow="from-accent-red/20 to-rose-300/30" sub={agg.total_discard_entries ? <span className="text-[10px] font-semibold text-ink-mute">{agg.total_discard_entries} buckets</span> : undefined} />
        </div>

        {view === 'dashboard' ? (
          <>
            <Panel title="Cold Store Pressure">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {caps.length ? (
                  caps.map((c) => (
                    <ColdPressureCard
                      key={c.farm}
                      title={c.farm}
                      incoming={agg.incoming_stems?.[c.farm] || 0}
                      onShelf={agg.farm_stems?.[c.farm] || 0}
                      allocated={agg.total_allocated_stems || 0}
                      capacity={c.max_stems || 0}
                    />
                  ))
                ) : (
                  <ColdPressureCard
                    title="All Cold Stores"
                    incoming={Object.values(agg.incoming_stems || {}).reduce((s, v) => s + v, 0)}
                    onShelf={agg.total_stems || 0}
                    allocated={agg.total_allocated_stems || 0}
                    capacity={0}
                  />
                )}
              </div>
            </Panel>

            <div className="grid gap-5 xl:grid-cols-2">
              <Panel title={`${temp?.sensorName || 'Cold Room'} — Temperature (24h)`}>
                <SensorLine
                  labels={temp?.labels || []}
                  values={temp?.values || []}
                  color="#2490ef"
                  unit="°"
                  band={temp ? temp.thresholds : undefined}
                  domain={tempDomain}
                />
              </Panel>
              <Panel title={`${hum?.sensorName || 'Cold Room'} — Humidity (24h)`}>
                <SensorLine labels={hum?.labels || []} values={hum?.values || []} color="#7c5cfc" unit="%" band={hum ? hum.thresholds : undefined} />
              </Panel>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Panel title="Stems by Variety (Top 15)"><BarsH data={varietyData} color="#2490ef" /></Panel>
              <Panel title="Stock Age Distribution"><BarsV data={ageData} /></Panel>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <Panel title="Stems by Length"><BarsV data={lengthData} color="#7c5cfc" /></Panel>
              <Panel title="Stems by Farm"><Donut data={farmData} /></Panel>
            </div>
          </>
        ) : (
          <Panel title="Shelf Inventory" action={<SearchInput value={shelfSearch} onChange={setShelfSearch} placeholder="Search varieties…" width={200} />}>
            <TableWrap minWidth={760}>
              <THead>
                <tr>{['Variety', 'Length', 'Farm', 'Stems', 'Buckets', 'Shelf Location'].map((h, i) => <Th key={h} className={i === 3 || i === 4 ? 'text-right' : ''}>{h}</Th>)}</tr>
              </THead>
              <tbody>
                {loading && !shelfRows.length ? (
                  <tr><td colSpan={6} className="py-10 text-center text-[12px] text-ink-mute">Loading…</td></tr>
                ) : !shelfRows.length ? (
                  <tr><td colSpan={6}><EmptyState message="No stock data" /></td></tr>
                ) : (
                  shelfRows.map((r, i) => (
                    <Tr key={i}>
                      <Td className="font-semibold">{r.item_code || '--'}</Td>
                      <Td className="text-ink-soft">{r.stem_length || 'N/A'}</Td>
                      <Td className="text-ink-soft">{r.farm_name || '--'}</Td>
                      <Td className="text-right tnum">{num(r.available_stems)}</Td>
                      <Td className="text-right tnum">{r.bucket_count || 0}</Td>
                      <Td className="text-accent-blue">{r.shelf_names || '--'}</Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </TableWrap>
          </Panel>
        )}
      </Main>
    </>
  )
}

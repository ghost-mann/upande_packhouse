import { useMemo, useState } from 'react'
import { Boxes, CheckCircle2, ClipboardList, Flower2, Package, Truck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import KpiCard from '../components/KpiCard'
import FlowCard from '../components/FlowCard'
import Panel, { CountBadge } from '../components/Panel'
import OplCard from '../components/OplCard'
import BoxLabelCard from '../components/BoxLabelCard'
import VarietyModal from '../components/VarietyModal'
import { EmptyState, SkeletonGrid } from '../components/States'
import StageDonut from '../components/charts/StageDonut'
import TeamBars from '../components/charts/TeamBars'
import CustomerBars from '../components/charts/CustomerBars'
import { useDashboard, useDeliveryTotals } from '../hooks/useDashboard'
import { stageBreakdown, teamBreakdown, topCustomers } from '../lib/charts'
import { num } from '../lib/format'
import type { Opl } from '../lib/types'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function WorkflowPage() {
  const { filters, setFilters, data, loading, error, lastUpdated, refresh } = useDashboard()
  const [view, setView] = useState<'team' | 'all'>('team')
  const [deliveryDate, setDeliveryDate] = useState(todayISO())
  const [modalOpl, setModalOpl] = useState<Opl | null>(null)
  const { totals: delivery } = useDeliveryTotals(deliveryDate)

  const stages = useMemo(() => stageBreakdown(data.opls), [data.opls])
  const teams = useMemo(() => teamBreakdown(data.opls), [data.opls])
  const customers = useMemo(() => topCustomers(data.opls), [data.opls])

  const setTeam = (team: string) => setFilters((f) => ({ ...f, team }))
  const setRange = (range: typeof filters.range) => setFilters((f) => ({ ...f, range }))
  const setFrom = (from: string) => setFilters((f) => ({ ...f, from }))
  const setTo = (to: string) => setFilters((f) => ({ ...f, to }))

  return (
    <>
      <PageHeader
        team={filters.team}
        onTeam={setTeam}
        range={filters.range}
        onRange={setRange}
        from={filters.from}
        to={filters.to}
        onFrom={setFrom}
        onTo={setTo}
        view={view}
        onView={setView}
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      <main className="mx-auto mt-4 max-w-[1760px] space-y-5 px-3 sm:px-5">
        {error && (
          <div className="glass rounded-2xl px-4 py-3 text-[12px] font-medium text-accent-red">
            Couldn’t reach the dashboard API: {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard icon={ClipboardList} label="Total OPLs" value={num(data.totalOpls)} tint="text-accent-blue" glow="from-accent-blue/20 to-sky-300/30" delay={0} />
          <KpiCard icon={CheckCircle2} label="Ready to Issue" value={num(data.readyCount)} tint="text-accent-green" glow="from-accent-green/20 to-emerald-300/30" delay={40} />
          <KpiCard
            icon={Package}
            label="Boxes Packed / Expected"
            value={`${num(data.totalBoxesPacked)}/${num(data.totalBoxesExpected)}`}
            tint="text-accent-purple"
            glow="from-accent-purple/20 to-indigo-300/30"
            delay={80}
          />
          <KpiCard
            icon={Truck}
            label="Boxes to Deliver"
            value={num(delivery.boxes)}
            tint="text-accent-orange"
            glow="from-accent-orange/20 to-amber-300/30"
            delay={120}
            sub={
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="glass-soft rounded-lg px-2 py-0.5 text-[10px] text-ink outline-none [color-scheme:light]"
              />
            }
          />
          <KpiCard icon={Boxes} label="Orders Due" value={num(delivery.orders)} tint="text-accent-blue" glow="from-accent-teal/20 to-cyan-300/30" delay={160} />
          <KpiCard icon={Flower2} label="Stems to Deliver" value={num(delivery.stems)} tint="text-accent-green" glow="from-accent-green/20 to-teal-300/30" delay={200} />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <FlowCard a={data.aggregates} />
          <Panel title="Workflow Stages" badge={<CountBadge tone="gray">{data.opls.length}</CountBadge>}>
            <StageDonut data={stages} />
          </Panel>
          <Panel title="Stems by Team" badge={<CountBadge tone="gray">{teams.length}</CountBadge>}>
            <TeamBars data={teams} />
          </Panel>
        </div>

        <Panel title="Top Customers by Volume">
          <CustomerBars data={customers} />
        </Panel>

        <Panel title="Ready to Issue — Warehouse" badge={<CountBadge>{data.readyToIssue.length} OPLs</CountBadge>}>
          {loading && !data.readyToIssue.length ? (
            <SkeletonGrid count={3} />
          ) : data.readyToIssue.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4">
              {data.readyToIssue.map((o) => (
                <OplCard key={o.oplId} opl={o} onVarieties={setModalOpl} />
              ))}
            </div>
          ) : (
            <EmptyState message="Nothing waiting to be issued" />
          )}
        </Panel>

        <Panel title="Box Labels — Print Room" badge={<CountBadge>{data.boxLabels.length} Labels</CountBadge>}>
          {loading && !data.boxLabels.length ? (
            <SkeletonGrid count={4} />
          ) : data.boxLabels.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
              {data.boxLabels.map((b, i) => (
                <BoxLabelCard key={`${b.oplId}-${i}`} box={b} />
              ))}
            </div>
          ) : (
            <EmptyState message="No box labels yet" />
          )}
        </Panel>

        {view === 'all' && (
          <Panel title="All Active OPLs" badge={<CountBadge tone="gray">{data.opls.length} OPLs</CountBadge>}>
            {data.opls.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4">
                {data.opls.map((o) => (
                  <OplCard key={o.oplId} opl={o} onVarieties={setModalOpl} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </Panel>
        )}
      </main>

      <VarietyModal opl={modalOpl} onClose={() => setModalOpl(null)} />
    </>
  )
}

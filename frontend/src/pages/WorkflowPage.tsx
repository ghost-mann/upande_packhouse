import * as React from 'react'
import { useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, CheckCircle2, ChevronDown, ClipboardList,
  Flower2, MapPin, Minus, Package, Printer, RefreshCw, Truck, Users,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Check } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import RadialGauge from '../components/charts/RadialGauge'
import StageDonut from '../components/charts/StageDonut'
import TeamBars from '../components/charts/TeamBars'
import CustomerBars from '../components/charts/CustomerBars'
import { EmptyState } from '../components/States'
import { useDashboard, useDeliveryTotals } from '../hooks/useDashboard'
import { stageBreakdown, teamBreakdown, topCustomers } from '../lib/charts'
import { num } from '../lib/format'
import { openDoc } from '../lib/api'
import { cn } from '@/lib/utils'
import type { Opl, StageKey, DateRange } from '../lib/types'

const TEAMS = ['all', 'Team A', 'Team B', 'Team C', 'Team D', 'Eldama', 'Bravo']

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const STAGE_BADGE: Record<StageKey, { label: string; variant: 'success' | 'primarySoft' | 'info' | 'warning' | 'muted' }> = {
  ready: { label: 'Ready', variant: 'success' },
  issued: { label: 'Issued', variant: 'primarySoft' },
  packing: { label: 'Packing', variant: 'info' },
  packed: { label: 'Packed', variant: 'info' },
  labeled: { label: 'Labeled', variant: 'warning' },
  loaded: { label: 'Loaded', variant: 'warning' },
  dispatched: { label: 'Dispatched', variant: 'muted' },
  draft: { label: 'Draft', variant: 'muted' },
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
  const a = data.aggregates

  return (
    <main className="mx-auto max-w-[1760px] px-4 py-5 sm:px-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Packhouse Workflow</h1>
            <p className="text-xs text-muted-foreground">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Syncing…'}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="text-muted-foreground" />
                {filters.team === 'all' ? 'All Teams' : filters.team}
                <ChevronDown className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {TEAMS.map((t) => (
                <DropdownMenuItem key={t} onClick={() => setFilters((f) => ({ ...f, team: t }))}>
                  <span className="flex-1">{t === 'all' ? 'All Teams' : t}</span>
                  {filters.team === t && <Check className="ml-2 h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Tabs value={filters.range} onValueChange={(v) => setFilters((f) => ({ ...f, range: v as DateRange }))}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
              <TabsTrigger value="last7">Last 7 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={view} onValueChange={(v) => setView(v as 'team' | 'all')}>
            <TabsList>
              <TabsTrigger value="team">Team View</TabsTrigger>
              <TabsTrigger value="all">All View</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 animate-pulse-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            LIVE
            <RefreshCw className={cn('text-muted-foreground', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-5 border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">
          Couldn’t reach the dashboard API: {error}
        </Card>
      )}

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile icon={ClipboardList} tone="blue" label="Total OPLs" value={num(data.totalOpls)} />
        <StatTile icon={CheckCircle2} tone="emerald" label="Ready to Issue" value={num(data.readyCount)} />
        <StatTile icon={Package} tone="violet" label="Boxes Packed / Expected" value={`${num(data.totalBoxesPacked)}/${num(data.totalBoxesExpected)}`} />
        <StatTile
          icon={Truck} tone="amber" label="Boxes to Deliver" value={num(delivery.boxes)}
          sub={
            <input
              type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
              className="mt-1 rounded-md border bg-background px-2 py-0.5 text-[10px] text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          }
        />
        <StatTile icon={Boxes} tone="sky" label="Orders Due" value={num(delivery.orders)} />
        <StatTile icon={Flower2} tone="emerald" label="Stems to Deliver" value={num(delivery.stems)} />
      </div>

      {/* Flow + charts */}
      <div className="mb-5 grid gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600"><Activity className="h-4 w-4" /></span>
              <div>
                <h2 className="text-sm font-semibold">Issuing vs Packing</h2>
                <p className="text-xs text-muted-foreground">Stem-weighted flow balance</p>
              </div>
            </div>
            <GapBadge gap={a.gap} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <RadialGauge value={a.avgIssuing} label="Avg Issuing" detail={`${num(a.totalIssuedStems)} / ${num(a.totalPickStems)}`} from="#6fa8f5" to="#2f6fed" />
            <RadialGauge value={a.avgPacking} label="Avg Packing" detail={`${num(a.totalPackedStems)} / ${num(a.totalPlannedStems)}`} from="#a896fb" to="#7c5cfc" />
            <RadialGauge value={a.fulfillment} label="Fulfillment" detail="packed / ordered" from="#6ee7a8" to="#22a45d" />
          </div>
        </Card>

        <SectionCard title="Workflow Stages" badge={`${data.opls.length}`}>
          <StageDonut data={stages} />
        </SectionCard>
        <SectionCard title="Stems by Team" badge={`${teams.length}`}>
          <TeamBars data={teams} />
        </SectionCard>
      </div>

      <SectionCard title="Top Customers by Volume" className="mb-5">
        <CustomerBars data={customers} />
      </SectionCard>

      {/* Ready to issue */}
      <SectionCard title="Ready to Issue — Warehouse" badge={`${data.readyToIssue.length} OPLs`} badgeVariant="primarySoft" className="mb-5">
        {loading && !data.readyToIssue.length ? (
          <CardGrid><Skel n={3} /></CardGrid>
        ) : data.readyToIssue.length ? (
          <CardGrid>{data.readyToIssue.map((o) => <OplTile key={o.oplId} opl={o} onVarieties={setModalOpl} />)}</CardGrid>
        ) : (
          <EmptyState message="Nothing waiting to be issued" />
        )}
      </SectionCard>

      {/* Box labels */}
      <SectionCard title="Box Labels — Print Room" badge={`${data.boxLabels.length} Labels`} badgeVariant="primarySoft" className="mb-5">
        {loading && !data.boxLabels.length ? (
          <CardGrid><Skel n={4} /></CardGrid>
        ) : data.boxLabels.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
            {data.boxLabels.map((b, i) => (
              <Card key={`${b.oplId}-${i}`} onClick={() => openDoc('Order Pick List', b.oplId)} className="cursor-pointer p-4 transition hover:shadow-card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Printer className="h-4 w-4" /></span>
                    <span className="text-[15px] font-semibold">Box {b.boxNumber}</span>
                  </div>
                  <Badge variant="success">Printed</Badge>
                </div>
                <dl className="mt-3 space-y-0.5 text-xs">
                  <Row label="Customer" value={b.customer} />
                  <Row label="OPL" value={b.oplId} />
                  <Row label="Total Boxes" value={b.totalBoxes} />
                </dl>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState message="No box labels yet" />
        )}
      </SectionCard>

      {view === 'all' && (
        <SectionCard title="All Active OPLs" badge={`${data.opls.length} OPLs`}>
          {data.opls.length ? (
            <CardGrid>{data.opls.map((o) => <OplTile key={o.oplId} opl={o} onVarieties={setModalOpl} />)}</CardGrid>
          ) : (
            <EmptyState />
          )}
        </SectionCard>
      )}

      {/* Variety dialog */}
      <Dialog open={!!modalOpl} onOpenChange={(o) => !o && setModalOpl(null)}>
        <DialogContent className="max-w-sm">
          {modalOpl && <VarietyBody opl={modalOpl} />}
        </DialogContent>
      </Dialog>
    </main>
  )
}

// ── Pieces ──

const TONES: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
  sky: 'bg-sky-50 text-sky-600',
}

function StatTile({ icon: Icon, tone, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; tone: string; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Card className="flex items-start gap-3 p-4 transition hover:shadow-card-hover">
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', TONES[tone])}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium leading-tight text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-[22px] font-semibold leading-none tracking-tight tnum">{value}</div>
        {sub}
      </div>
    </Card>
  )
}

function SectionCard({ title, badge, badgeVariant = 'muted', children, className }: { title: string; badge?: string; badgeVariant?: 'muted' | 'primarySoft'; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  )
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-3">{children}</div>
}
function Skel({ n }: { n: number }) {
  return <>{Array.from({ length: n }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</>
}

function GapBadge({ gap }: { gap: number }) {
  if (gap > 0) return <Badge variant="warning" className="gap-1"><ArrowUpRight className="h-3 w-3" />Packing ahead {Math.abs(gap)}%</Badge>
  if (gap < 0) return <Badge variant="success" className="gap-1"><ArrowDownRight className="h-3 w-3" />Issuing ahead {Math.abs(gap)}%</Badge>
  return <Badge variant="muted" className="gap-1"><Minus className="h-3 w-3" />Aligned</Badge>
}

function OplTile({ opl, onVarieties }: { opl: Opl; onVarieties: (o: Opl) => void }) {
  const tone = STAGE_BADGE[opl.stageKey]
  const CAP = 4
  const shown = opl.varieties.slice(0, CAP)
  const extra = opl.varieties.length - CAP
  const mixed = opl.varieties.length > 1
  return (
    <Card onClick={() => openDoc('Order Pick List', opl.oplId)} className="cursor-pointer p-4 transition hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold">{opl.orderName}</span>
            {opl.isUrgent && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-primary">{opl.oplId}</span>
            <Badge variant="muted" className="px-1.5 py-0 text-[10px]">{opl.team}</Badge>
          </div>
        </div>
        <Badge variant={tone.variant}>{tone.label}</Badge>
      </div>

      {mixed ? (
        <div className="mt-2.5">
          <div className="text-[12px] font-semibold">Mixed · {opl.varieties.length} varieties</div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {shown.map((v) => (
              <span key={v.name} className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-violet-700">{v.name} · {num(v.stems)}</span>
            ))}
            {extra > 0 && (
              <button onClick={(e) => { e.stopPropagation(); onVarieties(opl) }} className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold text-muted-foreground transition hover:bg-muted/70">+{extra} more</button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2.5 text-[13px] font-semibold">{opl.varieties[0]?.name || '—'}</div>
      )}

      <div className="mt-0.5 text-[12px] text-muted-foreground">{opl.customer}</div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <Stat label="Bunches" value={num(opl.totalBunches)} />
        <Stat label="Stems" value={num(opl.totalStems)} />
        <Stat label="Boxes" value={opl.boxProgress} />
      </div>

      {opl.shelfLocations.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          {opl.shelfLocations.slice(0, 3).map((s) => (
            <span key={s} className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-blue-700">{s}</span>
          ))}
          {opl.shelfLocations.length > 3 && <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-blue-700">+{opl.shelfLocations.length - 3}</span>}
        </div>
      ) : (
        <div className="mt-2.5 text-[11px] text-muted-foreground">No shelf assigned</div>
      )}

      <div className="mt-3 space-y-2.5">
        <Bar label="Issuing" pct={opl.issuingPct} className="bg-blue-500" />
        <Bar label="Packing" pct={opl.packingPct} className="bg-violet-500" />
      </div>
    </Card>
  )
}

function Bar({ label, pct, className }: { label: string; pct: number; className: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="tnum">{pct}%</span>
      </div>
      <Progress value={Math.min(100, pct)} className="h-1.5" indicatorClassName={className} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-1.5 text-center">
      <div className="text-[9.5px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold tnum">{value}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate pl-3 font-medium">{value}</dd>
    </div>
  )
}

function VarietyBody({ opl }: { opl: Opl }) {
  const total = opl.varieties.reduce((s, v) => s + v.stems, 0)
  return (
    <>
      <DialogHeader>
        <DialogTitle>{opl.oplId}</DialogTitle>
        <DialogDescription>{opl.varieties.length} varieties · {num(total)} stems</DialogDescription>
      </DialogHeader>
      <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
        {opl.varieties.map((v) => {
          const share = total ? (v.stems / total) * 100 : 0
          return (
            <div key={v.name} className="border-b py-2.5 last:border-0">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">{v.name}</span>
                <span className="font-semibold tnum">{num(v.stems)}</span>
              </div>
              <Progress value={share} className="mt-1.5 h-1" indicatorClassName="bg-violet-500" />
            </div>
          )
        })}
      </div>
    </>
  )
}

import { RefreshCw } from 'lucide-react'
import Segmented from './Segmented'
import TeamDropdown from './TeamDropdown'
import type { DateRange } from '../lib/types'

interface Props {
  team: string
  onTeam: (t: string) => void
  range: DateRange
  onRange: (r: DateRange) => void
  from: string
  to: string
  onFrom: (v: string) => void
  onTo: (v: string) => void
  view: 'team' | 'all'
  onView: (v: 'team' | 'all') => void
  loading: boolean
  lastUpdated: Date | null
  onRefresh: () => void
}

const RANGE_OPTS: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'custom', label: 'Custom' },
]

const dateInput =
  'glass-soft rounded-xl px-2.5 py-1.5 text-[12px] text-ink outline-none transition focus:ring-2 focus:ring-accent-blue/40 [color-scheme:dark]'

export default function PageHeader(p: Props) {
  return (
    <header className="sticky top-[68px] z-30 mx-auto mt-3 max-w-[1760px] px-3 sm:px-5">
      <div className="glass glass-sheen relative flex flex-wrap items-center justify-between gap-3 rounded-2.5xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-[19px] font-bold leading-none tracking-tight text-ink">Packhouse Workflow</h1>
            <p className="mt-1 text-[11px] font-medium text-ink-mute">
              {p.lastUpdated
                ? `Updated ${p.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Syncing…'}
            </p>
          </div>
          <TeamDropdown value={p.team} onChange={p.onTeam} />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Segmented options={RANGE_OPTS} value={p.range} onChange={p.onRange} size="sm" />
          {p.range === 'custom' && (
            <div className="flex items-center gap-1.5 animate-fade-up">
              <input type="date" value={p.from} onChange={(e) => p.onFrom(e.target.value)} className={dateInput} />
              <span className="text-ink-mute">–</span>
              <input type="date" value={p.to} onChange={(e) => p.onTo(e.target.value)} className={dateInput} />
            </div>
          )}
          <Segmented
            options={[
              { value: 'team', label: 'Team View' },
              { value: 'all', label: 'All View' },
            ]}
            value={p.view}
            onChange={p.onView}
            size="sm"
          />
          <button
            onClick={p.onRefresh}
            className="glass-soft flex items-center gap-2 rounded-2xl px-3 py-1.5 text-[12px] font-semibold text-ink transition hover:bg-gray-100"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent-green animate-pulse-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
            </span>
            LIVE
            <RefreshCw size={13} className={['text-ink-mute', p.loading ? 'animate-spin' : ''].join(' ')} />
          </button>
        </div>
      </div>
    </header>
  )
}

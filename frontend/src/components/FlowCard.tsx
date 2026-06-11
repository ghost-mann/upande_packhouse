import { Activity, ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import RadialGauge from './charts/RadialGauge'
import { num } from '../lib/format'
import type { KpiAggregates } from '../lib/types'

export default function FlowCard({ a }: { a: KpiAggregates }) {
  const gap = a.gap
  const gapTone =
    gap > 0
      ? { cls: 'bg-accent-orange/15 text-accent-orange', Icon: ArrowUpRight, txt: `Packing ahead ${Math.abs(gap)}%` }
      : gap < 0
        ? { cls: 'bg-accent-green/15 text-accent-green', Icon: ArrowDownRight, txt: `Issuing ahead ${Math.abs(gap)}%` }
        : { cls: 'bg-gray-100 text-ink-soft', Icon: Minus, txt: 'Aligned' }

  return (
    <div className="glass glass-sheen relative flex flex-col rounded-2.5xl p-5 animate-fade-up">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-accent-purple/25 to-accent-blue/25 text-accent-purple">
            <Activity size={16} strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-[13px] font-bold text-ink">Issuing vs Packing</h2>
            <p className="text-[11px] text-ink-mute">Stem-weighted flow balance</p>
          </div>
        </div>
        <span className={['flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold', gapTone.cls].join(' ')}>
          <gapTone.Icon size={12} />
          {gapTone.txt}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <RadialGauge
          value={a.avgIssuing}
          label="Avg Issuing"
          detail={`${num(a.totalIssuedStems)} / ${num(a.totalPickStems)}`}
          from="#6fa8f5"
          to="#2f6fed"
        />
        <RadialGauge
          value={a.avgPacking}
          label="Avg Packing"
          detail={`${num(a.totalPackedStems)} / ${num(a.totalPlannedStems)}`}
          from="#a896fb"
          to="#7c5cfc"
        />
        <RadialGauge
          value={a.fulfillment}
          label="Fulfillment"
          detail="packed / ordered"
          from="#6ee7a8"
          to="#22a45d"
        />
      </div>
    </div>
  )
}

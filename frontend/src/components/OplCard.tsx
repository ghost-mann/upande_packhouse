import { AlertTriangle, MapPin } from 'lucide-react'
import { num } from '../lib/format'
import { openDoc } from '../lib/api'
import type { Opl, StageKey } from '../lib/types'

const STAGE_TONE: Record<StageKey, { cls: string; txt: string }> = {
  ready: { cls: 'bg-accent-green/15 text-accent-green', txt: 'Ready' },
  issued: { cls: 'bg-accent-blue/15 text-accent-blue', txt: 'Issued' },
  packing: { cls: 'bg-accent-purple/15 text-accent-purple', txt: 'Packing' },
  packed: { cls: 'bg-accent-teal/15 text-accent-teal', txt: 'Packed' },
  labeled: { cls: 'bg-accent-orange/15 text-accent-orange', txt: 'Labeled' },
  loaded: { cls: 'bg-amber-500/15 text-amber-600', txt: 'Loaded' },
  dispatched: { cls: 'bg-white/60 text-ink-soft', txt: 'Dispatched' },
  draft: { cls: 'bg-white/60 text-ink-mute', txt: 'Draft' },
}

const STRIPE: Record<StageKey, string> = {
  ready: 'from-accent-green to-emerald-400',
  issued: 'from-accent-blue to-sky-400',
  packing: 'from-accent-purple to-indigo-400',
  packed: 'from-accent-teal to-cyan-400',
  labeled: 'from-accent-orange to-amber-400',
  loaded: 'from-amber-500 to-yellow-400',
  dispatched: 'from-slate-400 to-slate-300',
  draft: 'from-slate-300 to-slate-200',
}

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
        <span className="text-ink-soft">{label}</span>
        <span className="text-ink tnum">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className={['h-full rounded-full bg-gradient-to-r transition-[width] duration-700', color].join(' ')}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

export default function OplCard({ opl, onVarieties }: { opl: Opl; onVarieties: (o: Opl) => void }) {
  const tone = STAGE_TONE[opl.stageKey]
  const CAP = 4
  const shown = opl.varieties.slice(0, CAP)
  const extra = opl.varieties.length - CAP
  const mixed = opl.varieties.length > 1

  return (
    <div
      onClick={() => openDoc(opl.oplId)}
      className="glass-soft glass-sheen group relative flex cursor-pointer gap-3 overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-glass"
    >
      <span className={['w-1 shrink-0 rounded-full bg-gradient-to-b', STRIPE[opl.stageKey]].join(' ')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-bold text-ink">{opl.orderName}</span>
              {opl.isUrgent && <AlertTriangle size={13} className="shrink-0 text-accent-red" />}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-accent-blue">{opl.oplId}</span>
              <span className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
                {opl.team}
              </span>
            </div>
          </div>
          <span className={['shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', tone.cls].join(' ')}>
            {tone.txt}
          </span>
        </div>

        {mixed ? (
          <div className="mt-2.5">
            <div className="text-[12px] font-semibold text-ink">Mixed · {opl.varieties.length} varieties</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {shown.map((v) => (
                <span
                  key={v.name}
                  className="rounded-md bg-accent-purple/12 px-1.5 py-0.5 text-[10.5px] font-semibold text-accent-purple"
                >
                  {v.name} · {num(v.stems)}
                </span>
              ))}
              {extra > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onVarieties(opl)
                  }}
                  className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-soft transition hover:bg-ink/10"
                >
                  +{extra} more
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2.5 text-[13px] font-semibold text-ink">{opl.varieties[0]?.name || '—'}</div>
        )}

        <div className="mt-0.5 text-[12px] text-ink-soft">{opl.customer}</div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <Stat label="Bunches" value={num(opl.totalBunches)} />
          <Stat label="Stems" value={num(opl.totalStems)} />
          <Stat label="Boxes" value={opl.boxProgress} />
        </div>

        {opl.shelfLocations.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1">
            <MapPin size={11} className="text-ink-mute" />
            {opl.shelfLocations.slice(0, 3).map((s) => (
              <span key={s} className="rounded-md bg-accent-blue/12 px-1.5 py-0.5 text-[10.5px] font-semibold text-accent-blue">
                {s}
              </span>
            ))}
            {opl.shelfLocations.length > 3 && (
              <span className="rounded-md bg-accent-blue/12 px-1.5 py-0.5 text-[10.5px] font-semibold text-accent-blue">
                +{opl.shelfLocations.length - 3}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-2.5 text-[11px] text-ink-mute">No shelf assigned</div>
        )}

        <div className="mt-3 space-y-2.5">
          <Bar label="Issuing" pct={opl.issuingPct} color="from-sky-400 to-accent-blue" />
          <Bar label="Packing" pct={opl.packingPct} color="from-indigo-400 to-accent-purple" />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink/[0.04] px-2 py-1.5 text-center">
      <div className="text-[9.5px] font-semibold uppercase tracking-wide text-ink-mute">{label}</div>
      <div className="mt-0.5 text-[13px] font-bold text-ink tnum">{value}</div>
    </div>
  )
}

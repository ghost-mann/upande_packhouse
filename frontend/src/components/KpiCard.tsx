import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  icon: LucideIcon
  label: string
  value: ReactNode
  tint: string // tailwind text color class for icon, e.g. 'text-accent-blue'
  glow: string // gradient classes for the icon chip background
  sub?: ReactNode
  delay?: number
}

export default function KpiCard({ icon: Icon, label, value, tint, glow, sub, delay = 0 }: Props) {
  return (
    <div
      className="glass glass-sheen relative flex items-start gap-3 rounded-2.5xl p-4 animate-fade-up transition-transform duration-300 hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={['grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br', glow].join(' ')}>
        <Icon size={18} strokeWidth={2.1} className={tint} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold leading-tight text-ink-soft">{label}</div>
        <div className="mt-1 text-[22px] font-bold leading-none tracking-tight text-ink tnum">{value}</div>
        {sub && <div className="mt-1.5">{sub}</div>}
      </div>
    </div>
  )
}

import { RefreshCw, Search } from 'lucide-react'
import type { ReactNode } from 'react'

// ── LIVE refresh pill ──
export function LiveButton({ loading, onClick }: { loading?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass-soft flex items-center gap-2 rounded-2xl px-3 py-1.5 text-[12px] font-semibold text-ink transition hover:bg-gray-100"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-accent-green animate-pulse-dot" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
      </span>
      LIVE
      <RefreshCw size={13} className={['text-ink-mute', loading ? 'animate-spin' : ''].join(' ')} />
    </button>
  )
}

// ── Glass search box ──
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  width = 220,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  width?: number
}) {
  return (
    <div className="glass-soft flex items-center gap-2 rounded-2xl px-3 py-1.5" style={{ width }}>
      <Search size={14} className="shrink-0 text-ink-mute" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-mute"
      />
    </div>
  )
}

// ── Date field with a leading label ──
export function DateField({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label?: string
}) {
  return (
    <label className="glass-soft flex items-center gap-2 rounded-2xl px-3 py-1.5">
      {label && <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{label}</span>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[13px] text-ink outline-none [color-scheme:dark]"
      />
    </label>
  )
}

// ── Native select, glass-styled ──
export function GlassSelect({
  value,
  onChange,
  options,
  label,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label?: string
  placeholder?: string
}) {
  const active = !!value
  return (
    <label
      className={[
        'glass-soft flex items-center gap-2 rounded-2xl px-3 py-1.5 transition',
        active ? 'ring-1 ring-accent-green/40' : '',
      ].join(' ')}
    >
      {label && <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[180px] bg-transparent text-[13px] font-medium text-ink outline-none"
      >
        {placeholder != null && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// ── Full-screen frosted spinner ──
export function SpinnerOverlay({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-gray-50 backdrop-blur-sm">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-accent-blue/30 border-t-accent-blue" />
    </div>
  )
}

// ── Pill / chip ──
export function Chip({ children, tone = 'gray' }: { children: ReactNode; tone?: ChipTone }) {
  return <span className={['rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold', CHIP[tone]].join(' ')}>{children}</span>
}

export type ChipTone = 'gray' | 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal'
const CHIP: Record<ChipTone, string> = {
  gray: 'bg-gray-100 text-ink-soft',
  blue: 'bg-accent-blue/12 text-accent-blue',
  green: 'bg-accent-green/15 text-accent-green',
  orange: 'bg-accent-orange/15 text-accent-orange',
  purple: 'bg-accent-purple/12 text-accent-purple',
  red: 'bg-accent-red/12 text-accent-red',
  teal: 'bg-accent-teal/15 text-accent-teal',
}

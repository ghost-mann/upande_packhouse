import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Users } from 'lucide-react'

const TEAMS = ['all', 'Team A', 'Team B', 'Team C', 'Team D', 'Eldama', 'Bravo']

interface Props {
  value: string
  onChange: (team: string) => void
}

export default function TeamDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = value === 'all' ? 'All Teams' : value

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass-soft flex items-center gap-2 rounded-2xl px-3.5 py-1.5 text-[13px] font-medium text-ink transition hover:bg-gray-100"
      >
        <Users size={14} className="text-ink-mute" />
        {label}
        <ChevronDown size={14} className={['text-ink-mute transition', open ? 'rotate-180' : ''].join(' ')} />
      </button>
      {open && (
        <div className="glass-strong glass-sheen absolute left-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl p-1.5 animate-fade-up">
          {TEAMS.map((t) => {
            const active = t === value
            return (
              <button
                key={t}
                onClick={() => {
                  onChange(t)
                  setOpen(false)
                }}
                className={[
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] transition',
                  active ? 'bg-accent-blue/15 font-semibold text-accent-blue' : 'text-ink-soft hover:bg-gray-100',
                ].join(' ')}
              >
                {t === 'all' ? 'All Teams' : t}
                {active && <Check size={14} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

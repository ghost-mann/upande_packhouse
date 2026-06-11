import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  options: string[]
  label?: string
  placeholder?: string
  width?: number
}

// Filterable single-select with a glass dropdown (replaces the original custom-select).
export default function Typeahead({ value, onChange, options, label, placeholder = 'Any', width = 170 }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return (q ? options.filter((o) => o.toLowerCase().includes(q)) : options).slice(0, 50)
  }, [options, query])

  return (
    <div ref={ref} className="relative" style={{ width }}>
      {label && <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-mute">{label}</span>}
      <button
        onClick={() => { setOpen((o) => !o); setQuery('') }}
        className={['glass-soft flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-left text-[12.5px] transition', value ? 'ring-1 ring-accent-blue/40 text-ink' : 'text-ink-mute'].join(' ')}
      >
        <span className="flex-1 truncate">{value || placeholder}</span>
        {value ? (
          <X size={13} className="text-ink-mute hover:text-ink" onClick={(e) => { e.stopPropagation(); onChange('') }} />
        ) : (
          <ChevronDown size={13} className="text-ink-mute" />
        )}
      </button>
      {open && (
        <div className="glass-strong glass-sheen absolute z-50 mt-1 w-full overflow-hidden rounded-xl p-1.5 animate-fade-up">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to filter…"
            className="mb-1 w-full rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-[12.5px] outline-none placeholder:text-ink-mute"
          />
          <div className="max-h-56 overflow-y-auto no-scrollbar">
            {filtered.length ? (
              filtered.map((o) => (
                <button
                  key={o}
                  onClick={() => { onChange(o); setOpen(false) }}
                  className={['block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition', o === value ? 'bg-accent-blue/15 font-semibold text-accent-blue' : 'text-ink-soft hover:bg-white/[0.08]'].join(' ')}
                >
                  {o}
                </button>
              ))
            ) : (
              <div className="px-2.5 py-2 text-[12px] text-ink-mute">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

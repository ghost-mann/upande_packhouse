interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
}

export default function Segmented<T extends string>({ options, value, onChange, size = 'md' }: Props<T>) {
  const pad = size === 'sm' ? 'px-3 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]'
  return (
    <div className="glass-segment">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={[
              'relative rounded-xl font-medium transition-all duration-200',
              pad,
              active ? 'bg-gradient-to-br from-accent-blue to-accent-purple text-white shadow-glow' : 'text-ink-soft hover:text-ink',
            ].join(' ')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

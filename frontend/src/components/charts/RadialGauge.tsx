interface Props {
  value: number // 0..100
  label: string
  detail?: string
  from: string
  to: string
  size?: number
}

// Crisp SVG arc gauge with a gradient stroke — sharper than a charting lib for
// a single value, and it inherits the glass card's lighting.
export default function RadialGauge({ value, label, detail, from, to, size = 120 }: Props) {
  const v = Math.max(0, Math.min(100, value))
  const stroke = 9
  const r = (size - stroke) / 2
  const cx = size / 2
  const circ = 2 * Math.PI * r
  const gap = circ * 0.28 // leave a 100° gap at the bottom for the open "speedometer" feel
  const arc = circ - gap
  const offset = arc * (1 - v / 100)
  const id = `g-${label.replace(/\s/g, '')}`

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[126deg]">
          <defs>
            <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          <circle
            cx={cx}
            cy={cy(size)}
            r={r}
            fill="none"
            stroke="rgba(15,23,42,0.07)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circ}`}
          />
          <circle
            cx={cx}
            cy={cy(size)}
            r={r}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circ}`}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-bold leading-none text-ink tnum">{Math.round(v)}%</span>
        </div>
      </div>
      <div className="-mt-2 text-center">
        <div className="text-[12px] font-semibold text-ink">{label}</div>
        {detail && <div className="text-[10px] font-medium text-ink-mute tnum">{detail}</div>}
      </div>
    </div>
  )
}

function cy(size: number) {
  return size / 2
}

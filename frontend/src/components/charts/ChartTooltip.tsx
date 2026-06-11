import type { TooltipProps } from 'recharts'

// Frosted tooltip shared by all charts.
export default function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-[12px] shadow-glass-lg">
      {label != null && <div className="mb-1 font-semibold text-ink">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-ink-soft">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || (p.payload as { color?: string })?.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-semibold text-ink tnum">{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

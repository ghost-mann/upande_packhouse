import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import ChartTooltip from './ChartTooltip'
import type { StageDatum } from '../../lib/charts'

export default function StageDonut({ data }: { data: StageDatum[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (!total) return <Empty />

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[156px] w-[156px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip />} cursor={false} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={52}
              outerRadius={74}
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] font-bold leading-none text-ink tnum">{total}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-ink-mute">OPLs</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-[12px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-ink-soft">{d.label}</span>
            <span className="ml-auto font-semibold text-ink tnum">{d.count}</span>
            <span className="w-9 text-right text-[11px] text-ink-mute tnum">
              {Math.round((d.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Empty() {
  return <div className="grid h-[156px] place-items-center text-[12px] text-ink-mute">No stage data</div>
}

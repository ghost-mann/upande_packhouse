import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartTooltip from './ChartTooltip'
import { compact } from '../../lib/format'
import type { TeamDatum } from '../../lib/charts'

const COLORS = ['#2490ef', '#7c5cfc', '#16c8c8', '#29cd42', '#fc9c30', '#e63757', '#94a3b8']

export default function TeamBars({ data }: { data: TeamDatum[] }) {
  if (!data.length) return <div className="grid h-[180px] place-items-center text-[12px] text-ink-mute">No team data</div>
  const height = Math.max(140, data.length * 38)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }} barSize={18}>
        <defs>
          {COLORS.map((c, i) => (
            <linearGradient key={i} id={`teamg-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={c} stopOpacity={0.55} />
              <stop offset="100%" stopColor={c} stopOpacity={1} />
            </linearGradient>
          ))}
        </defs>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="team"
          width={78}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
        <Bar dataKey="stems" radius={[6, 6, 6, 6]} name="stems">
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#teamg-${i % COLORS.length})`} />
          ))}
          <LabelList
            dataKey="stems"
            position="right"
            formatter={(v: number) => compact(v)}
            style={{ fontSize: 11, fontWeight: 700, fill: '#0b1220' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

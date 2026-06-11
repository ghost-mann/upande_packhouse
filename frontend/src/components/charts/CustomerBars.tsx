import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from './ChartTooltip'
import { compact } from '../../lib/format'
import type { CustomerDatum } from '../../lib/charts'

function shorten(name: string) {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name
}

export default function CustomerBars({ data }: { data: CustomerDatum[] }) {
  if (!data.length)
    return <div className="grid h-[200px] place-items-center text-[12px] text-ink-mute">No customer data</div>

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: -8 }} barSize={26}>
        <defs>
          <linearGradient id="custg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cfc" />
            <stop offset="100%" stopColor="#2490ef" stopOpacity={0.75} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="customer"
          tickFormatter={shorten}
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={{ fontSize: 10.5, fill: '#475569', fontWeight: 600 }}
        />
        <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={42} tick={{ fontSize: 10.5, fill: '#94a3b8' }} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
        <Bar dataKey="stems" name="stems" fill="url(#custg)" radius={[8, 8, 2, 2]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

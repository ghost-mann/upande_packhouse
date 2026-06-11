import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceArea,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import ChartTooltip from './ChartTooltip'
import { compact } from '../../lib/format'

export interface Datum { name: string; value: number; color?: string }

const PALETTE = ['#2f6fed', '#22a45d', '#f59e0b', '#7c5cfc', '#ef4444', '#06b6d4', '#15803d', '#b45309']

function shorten(s: string, n = 14) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

// Horizontal bars (e.g. stems by variety).
export function BarsH({ data, color = '#2f6fed', height }: { data: Datum[]; color?: string; height?: number }) {
  if (!data.length) return <Empty h={height || 200} />
  const h = height || Math.max(160, data.length * 26)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 8 }} barSize={14}>
        <defs>
          <linearGradient id="barsh" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
        </defs>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={104} tickLine={false} axisLine={false} tickFormatter={(v) => shorten(v, 16)} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
        <Bar dataKey="value" name="stems" radius={[5, 5, 5, 5]} fill="url(#barsh)" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Vertical bars (e.g. age distribution, stems by length). Per-bar colors optional.
export function BarsV({ data, color = '#7c5cfc', height = 230 }: { data: Datum[]; color?: string; height?: number }) {
  if (!data.length) return <Empty h={height} />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: -8 }} barSize={26}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickFormatter={(v) => shorten(v, 10)} interval={0} tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: '#475569', fontWeight: 600 }} />
        <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={42} tick={{ fontSize: 10.5, fill: '#9ca3af' }} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
        <Bar dataKey="value" name="stems" radius={[8, 8, 2, 2]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Doughnut with legend (e.g. stems by farm).
export function Donut({ data, height = 230 }: { data: Datum[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <Empty h={height} />
  return (
    <div className="flex items-center gap-4" style={{ minHeight: height }}>
      <div className="relative h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip />} cursor={false} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={3} cornerRadius={6} stroke="none">
              {data.map((d, i) => (
                <Cell key={i} fill={d.color || PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-bold leading-none text-ink tnum">{compact(total)}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-ink-mute">stems</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5">
        {data.slice(0, 7).map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-[12px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />
            <span className="truncate text-ink-soft">{d.name}</span>
            <span className="ml-auto font-semibold text-ink tnum">{compact(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Time-series line with a shaded "normal range" band between thresholds.
export function SensorLine({
  labels, values, color, band, domain, unit, height = 220,
}: {
  labels: string[]; values: number[]; color: string
  band?: { min: number; max: number }; domain?: [number, number]; unit: string; height?: number
}) {
  if (!labels.length) return <Empty h={height} message="No sensor data" />
  const data = labels.map((name, i) => ({ name, value: values[i] }))
  const id = `sl-${color.replace('#', '')}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: -10 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        {band && <ReferenceArea y1={band.min} y2={band.max} fill={color} fillOpacity={0.06} stroke="none" />}
        <XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={28} tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis domain={domain || ['auto', 'auto']} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v}${unit}`} tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(15,23,42,0.15)' }} />
        <Area type="monotone" dataKey="value" name="reading" stroke={color} strokeWidth={2} fill={`url(#${id})`} dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function Empty({ h, message = 'No data' }: { h: number; message?: string }) {
  return <div className="grid place-items-center text-[12px] text-ink-mute" style={{ height: h }}>{message}</div>
}

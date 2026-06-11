import { Printer } from 'lucide-react'
import { openDoc } from '../lib/api'
import type { BoxLabel } from '../lib/types'

export default function BoxLabelCard({ box }: { box: BoxLabel }) {
  return (
    <div
      onClick={() => openDoc('Order Pick List', box.oplId)}
      className="glass-soft glass-sheen relative cursor-pointer rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-glass"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-accent-green/20 to-emerald-300/30 text-accent-green">
            <Printer size={15} strokeWidth={2.1} />
          </span>
          <span className="text-[15px] font-bold text-ink">Box {box.boxNumber}</span>
        </div>
        <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-[10px] font-bold text-accent-green">
          Printed
        </span>
      </div>
      <dl className="mt-3 space-y-0.5 text-[12px]">
        <Row label="Customer" value={box.customer} />
        <Row label="OPL" value={box.oplId} />
        <Row label="Total Boxes" value={box.totalBoxes} />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-1.5 last:border-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="truncate pl-3 font-semibold text-ink">{value}</dd>
    </div>
  )
}

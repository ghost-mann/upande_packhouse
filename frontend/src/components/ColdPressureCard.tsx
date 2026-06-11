import { num } from '../lib/format'

interface Props {
  title: string
  incoming: number
  onShelf: number
  allocated: number
  capacity: number
}

// Segmented capacity bar: received (not shelved) → on-shelf → allocated → empty,
// with a red capacity marker. Mirrors the original buildPressureCard logic.
export default function ColdPressureCard({ title, incoming, onShelf, allocated, capacity }: Props) {
  const unallocatedShelf = Math.max(0, onShelf - allocated)
  const allocShow = Math.min(allocated, onShelf)
  const allSegments = incoming + unallocatedShelf + allocShow
  const maxVal = capacity > 0 ? Math.max(capacity, allSegments) : allSegments || 1
  const pct = (v: number) => (v / maxVal) * 100
  const pctIn = pct(incoming), pctUn = pct(unallocatedShelf), pctAl = pct(allocShow)
  const pctEmpty = Math.max(0, 100 - pctIn - pctUn - pctAl)
  const util = capacity > 0 ? Math.round((allSegments / capacity) * 100) : 0
  const utilTone = util > 90 ? 'bg-accent-red/15 text-accent-red' : util > 70 ? 'bg-accent-orange/15 text-accent-orange' : 'bg-accent-green/15 text-accent-green'
  const capLine = capacity > 0 ? Math.min((capacity / maxVal) * 100, 100) : null

  return (
    <div className="glass-soft glass-sheen relative rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-ink">{title}</span>
        {capacity > 0 && <span className={['rounded-full px-2 py-0.5 text-[10.5px] font-bold', utilTone].join(' ')}>{util}% utilized</span>}
      </div>
      <div className="mb-1.5 flex justify-between text-[10px] font-semibold text-ink-mute">
        <span>0</span>
        <span>{capacity > 0 ? `Capacity: ${num(capacity)}` : `Total: ${num(allSegments)}`}</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <div className="flex h-full">
          <Seg w={pctIn} cls="bg-accent-orange" title={`Received (not shelved): ${num(incoming)}`} />
          <Seg w={pctUn} cls="bg-accent-blue" title={`On shelf: ${num(unallocatedShelf)}`} />
          <Seg w={pctAl} cls="bg-accent-green" title={`Allocated (not issued): ${num(allocShow)}`} />
          <Seg w={pctEmpty} cls="bg-transparent" />
        </div>
        {capLine != null && <span className="absolute top-0 h-full w-0.5 bg-accent-red" style={{ left: `${capLine}%` }} />}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-3 text-[10.5px] font-medium text-ink-soft">
        <Legend cls="bg-accent-orange" label={`Received ${num(incoming)}`} />
        <Legend cls="bg-accent-blue" label={`On shelf ${num(unallocatedShelf)}`} />
        <Legend cls="bg-accent-green" label={`Allocated ${num(allocShow)}`} />
      </div>
    </div>
  )
}

function Seg({ w, cls, title }: { w: number; cls: string; title?: string }) {
  return <div className={['h-full transition-all', cls].join(' ')} style={{ width: `${w}%` }} title={title} />
}
function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={['h-2 w-2 rounded-full', cls].join(' ')} />{label}</span>
}

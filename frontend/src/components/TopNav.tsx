import { Boxes } from 'lucide-react'

const LINKS = [
  { label: 'Home', href: '/app/packhouse-%26-sales' },
  { label: 'Workflow', href: '/packhouse-dashboard', active: true },
  { label: 'Allocation Planning', href: '/sales-allocation-planning' },
  { label: 'Bucket Journey', href: '/bucket-tracker' },
  { label: 'Cold Room', href: '/cold-room' },
  { label: 'Stock Visibility', href: '/stock-visibility' },
  { label: 'Order Summary', href: '/order-summary' },
]

export default function TopNav() {
  return (
    <nav className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="glass glass-sheen relative mx-auto flex max-w-[1760px] items-center gap-1 overflow-x-auto rounded-2.5xl px-3 py-2 no-scrollbar">
        <div className="mr-1 flex shrink-0 items-center gap-2 pr-3">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple text-white shadow-glow">
            <Boxes size={15} strokeWidth={2.2} />
          </span>
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute sm:block">
            Packhouse
          </span>
          <span className="ml-1 hidden h-5 w-px bg-white/60 sm:block" />
        </div>
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className={[
              'shrink-0 rounded-xl px-3 py-1.5 text-[13px] font-medium transition-all duration-200',
              l.active
                ? 'bg-ink text-white shadow-glass-sm'
                : 'text-ink-soft hover:bg-white/55 hover:text-ink',
            ].join(' ')}
          >
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

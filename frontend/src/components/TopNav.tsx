import { NavLink } from 'react-router-dom'
import { Boxes } from 'lucide-react'

// Internal SPA routes (client-side nav) + the external desk Home link.
const HOME = { label: 'Home', href: '/app/packhouse-%26-sales' }
const TABS = [
  { label: 'Workflow', to: '/packhouse-dashboard' },
  { label: 'Allocation Planning', to: '/sales-allocation-planning' },
  { label: 'Bucket Journey', to: '/bucket-tracker' },
  { label: 'Cold Room', to: '/cold-room' },
  { label: 'Stock Visibility', to: '/stock-visibility' },
  { label: 'Order Summary', to: '/order-summary' },
]

const base =
  'shrink-0 rounded-xl px-3 py-1.5 text-[13px] font-medium transition-all duration-200'

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
        <a href={HOME.href} className={[base, 'text-ink-soft hover:bg-white/55 hover:text-ink'].join(' ')}>
          {HOME.label}
        </a>
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              [base, isActive ? 'bg-ink text-white shadow-glass-sm' : 'text-ink-soft hover:bg-white/55 hover:text-ink'].join(
                ' ',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

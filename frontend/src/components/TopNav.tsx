import { NavLink } from 'react-router-dom'
import { Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'

const HOME = { label: 'Home', href: '/app/packhouse-%26-sales' }
const TABS = [
  { label: 'Workflow', to: '/packhouse-dashboard' },
  { label: 'Allocation Planning', to: '/sales-allocation-planning' },
  { label: 'Bucket Journey', to: '/bucket-tracker' },
  { label: 'Cold Room', to: '/cold-room' },
  { label: 'Stock Visibility', to: '/stock-visibility' },
  { label: 'Order Summary', to: '/order-summary' },
]

const base = 'shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors'

export default function TopNav() {
  return (
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1760px] items-center gap-1 overflow-x-auto px-4 py-2 no-scrollbar sm:px-6">
        <div className="mr-2 flex shrink-0 items-center gap-2 pr-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Boxes size={15} strokeWidth={2.2} />
          </span>
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
            Packhouse
          </span>
        </div>
        <a href={HOME.href} className={cn(base, 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          {HOME.label}
        </a>
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(base, isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

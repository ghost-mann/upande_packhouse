import type { ReactNode } from 'react'

interface Props {
  title: string
  badge?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}

export default function Panel({ title, badge, action, children, className = '' }: Props) {
  return (
    <section className={['glass glass-sheen relative rounded-2.5xl animate-fade-up', className].join(' ')}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[13px] font-bold tracking-tight text-ink">{title}</h2>
          {badge}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export function CountBadge({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'gray' }) {
  const cls =
    tone === 'blue' ? 'bg-accent-blue/15 text-accent-blue' : 'bg-gray-100 text-ink-soft'
  return (
    <span className={['rounded-full px-2.5 py-0.5 text-[11px] font-bold tnum', cls].join(' ')}>{children}</span>
  )
}

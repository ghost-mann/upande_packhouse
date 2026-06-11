import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: ReactNode
  children?: ReactNode // right-side controls
}

// Sticky frosted header shared by every page (matches the Workflow header).
export default function PageBar({ title, subtitle, children }: Props) {
  return (
    <header className="sticky top-[68px] z-30 mx-auto mt-3 max-w-[1760px] px-3 sm:px-5">
      <div className="glass glass-sheen relative flex flex-wrap items-center justify-between gap-3 rounded-2.5xl px-4 py-3">
        <div>
          <h1 className="text-[19px] font-bold leading-none tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-[11px] font-medium text-ink-mute">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
      </div>
    </header>
  )
}

export function Main({ children }: { children: ReactNode }) {
  return <main className="mx-auto mt-4 max-w-[1760px] space-y-5 px-3 sm:px-5">{children}</main>
}

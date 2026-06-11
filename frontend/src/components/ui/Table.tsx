import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react'

// Glass scroll container with a frosted sticky header. `minWidth` keeps wide
// tables from collapsing; the wrapper scrolls both axes.
export function TableWrap({ children, minWidth, maxH = 'calc(100vh - 280px)' }: { children: ReactNode; minWidth?: number; maxH?: string }) {
  return (
    <div className="glass glass-sheen relative overflow-hidden rounded-2.5xl">
      <div className="overflow-auto no-scrollbar" style={{ maxHeight: maxH }}>
        <table className="w-full border-collapse text-[12.5px]" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-[#fafafa] [&_th]:border-b [&_th]:border-line">
      {children}
    </thead>
  )
}

export function Th({ children, className = '', ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      {...rest}
      className={[
        'whitespace-nowrap px-3 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide text-ink-soft',
        className,
      ].join(' ')}
    >
      {children}
    </th>
  )
}

export function Td({ children, className = '', ...rest }: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td {...rest} className={['whitespace-nowrap px-3 py-2 text-ink', className].join(' ')}>
      {children}
    </td>
  )
}

export function Tr({
  children,
  onClick,
  className = '',
  topBorder,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  topBorder?: boolean
}) {
  return (
    <tr
      onClick={onClick}
      className={[
        'transition-colors',
        onClick ? 'cursor-pointer' : '',
        'hover:bg-gray-50',
        topBorder ? 'border-t border-line' : '',
        className,
      ].join(' ')}
    >
      {children}
    </tr>
  )
}

export function FullRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3">
        {children}
      </td>
    </tr>
  )
}

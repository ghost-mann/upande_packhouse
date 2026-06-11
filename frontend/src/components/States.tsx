import { Inbox } from 'lucide-react'

export function EmptyState({ message = 'No records found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-ink-mute">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.07]">
        <Inbox size={22} strokeWidth={1.8} />
      </span>
      <p className="text-[13px] font-medium">{message}</p>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-soft relative h-48 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  )
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

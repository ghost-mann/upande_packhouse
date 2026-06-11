import { useEffect } from 'react'
import { X } from 'lucide-react'
import { num } from '../lib/format'
import type { Opl } from '../lib/types'

export default function VarietyModal({ opl, onClose }: { opl: Opl | null; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!opl) return null
  const total = opl.varieties.reduce((s, v) => s + v.stems, 0)

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm animate-fade-up"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong glass-sheen relative flex max-h-[72vh] w-full max-w-sm flex-col overflow-hidden rounded-2.5xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div>
            <h3 className="text-[13px] font-bold text-ink">{opl.oplId}</h3>
            <p className="text-[11px] text-ink-mute">{opl.varieties.length} varieties · {num(total)} stems</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-ink-mute transition hover:bg-white/[0.08] hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-2 no-scrollbar">
          {opl.varieties.map((v) => {
            const share = total ? (v.stems / total) * 100 : 0
            return (
              <div key={v.name} className="border-b border-white/10 py-2.5 last:border-0">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-soft">{v.name}</span>
                  <span className="font-bold text-ink tnum">{num(v.stems)}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-blue" style={{ width: `${share}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

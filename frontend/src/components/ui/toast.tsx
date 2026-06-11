import { useCallback, useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error'
interface ToastState {
  id: number
  message: string
  type: ToastType
}

// Minimal toast: returns a renderable node + a show() trigger. Self-contained
// per page so there's no global provider to wire up.
export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const seq = useRef(0)

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++seq.current
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }, [])

  const node = (
    <div className="fixed right-5 top-5 z-[200] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass-strong glass-sheen flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-ink shadow-glass-lg animate-fade-up"
        >
          {t.type === 'success' ? (
            <CheckCircle2 size={16} className="text-accent-green" />
          ) : (
            <XCircle size={16} className="text-accent-red" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  )

  return { show, node }
}

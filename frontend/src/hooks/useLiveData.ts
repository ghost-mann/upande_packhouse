import { useCallback, useEffect, useRef, useState } from 'react'

interface Options {
  intervalMs?: number // polling cadence; 0 disables
  enabled?: boolean // skip fetching while false (e.g. missing required filter)
}

// Fetch-on-deps + interval polling with stale-response guarding. The fetcher is
// re-created by callers via useCallback so deps drive refetches.
export function useLiveData<T>(fetcher: () => Promise<T>, { intervalMs = 60_000, enabled = true }: Options = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const reqId = useRef(0)

  const load = useCallback(async () => {
    if (!enabled) return
    const id = ++reqId.current
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher()
      if (id !== reqId.current) return
      setData(res)
      setLastUpdated(new Date())
    } catch (e) {
      if (id !== reqId.current) return
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [fetcher, enabled])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!intervalMs || !enabled) return
    const t = setInterval(load, intervalMs)
    return () => clearInterval(t)
  }, [load, intervalMs, enabled])

  return { data, loading, error, lastUpdated, refresh: load }
}

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDashboard, fetchSalesOrder, fetchSalesOrdersForDate } from '../lib/api'
import { emptyDashboard, transformDashboard } from '../lib/transform'
import type { Dashboard, DateRange, DeliveryTotals } from '../lib/types'

const PERIOD: Record<DateRange, string> = {
  today: 'today',
  yesterday: 'yesterday',
  last7: 'last_7_days',
  custom: 'custom',
}

interface Filters {
  team: string
  range: DateRange
  from: string
  to: string
}

export function useDashboard() {
  const [filters, setFilters] = useState<Filters>({ team: 'all', range: 'today', from: '', to: '' })
  const [data, setData] = useState<Dashboard>(emptyDashboard())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const reqId = useRef(0)

  const load = useCallback(async (f: Filters) => {
    const id = ++reqId.current
    setLoading(true)
    setError(null)
    try {
      const period = PERIOD[f.range]
      const args =
        f.range === 'custom' && f.from && f.to
          ? { team_filter: f.team, period, from_date: f.from, to_date: f.to }
          : { team_filter: f.team, period }
      const raw = await fetchDashboard(args)
      if (id !== reqId.current) return
      setData(transformDashboard(raw))
      setLastUpdated(new Date())
    } catch (e) {
      if (id !== reqId.current) return
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      setData(emptyDashboard())
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [])

  // Initial + filter-driven loads.
  useEffect(() => {
    if (filters.range === 'custom' && (!filters.from || !filters.to)) return
    load(filters)
  }, [filters, load])

  // Live polling every 30s.
  useEffect(() => {
    const t = setInterval(() => {
      if (filters.range === 'custom' && (!filters.from || !filters.to)) return
      load(filters)
    }, 30_000)
    return () => clearInterval(t)
  }, [filters, load])

  const refresh = useCallback(() => load(filters), [filters, load])

  return { filters, setFilters, data, loading, error, lastUpdated, refresh }
}

// Boxes-to-deliver: fans out across the day's sales orders, same as the old page.
export function useDeliveryTotals(deliveryDate: string) {
  const [totals, setTotals] = useState<DeliveryTotals>({ orders: 0, boxes: 0, stems: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!deliveryDate) return
    setLoading(true)
    ;(async () => {
      try {
        const orders = await fetchSalesOrdersForDate(deliveryDate)
        if (!orders.length) {
          if (!cancelled) setTotals({ orders: 0, boxes: 0, stems: 0 })
          return
        }
        const docs = await Promise.all(orders.map((o) => fetchSalesOrder(o.name).catch(() => null)))
        let boxes = 0
        let stems = 0
        for (const doc of docs) {
          for (const it of doc?.items || []) {
            stems += it.stock_qty || 0
            boxes += it.custom_number_of_boxes || 0
          }
        }
        if (!cancelled) setTotals({ orders: orders.length, boxes, stems })
      } catch {
        if (!cancelled) setTotals({ orders: 0, boxes: 0, stems: 0 })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [deliveryDate])

  return { totals, loading }
}

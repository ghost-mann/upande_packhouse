// Thin Frappe API client. Mirrors what the original page did via frappe.call,
// but typed and dependency-free so the SPA can run standalone in dev.

const csrfToken = (): string => window.csrf_token || ''

interface CallOptions {
  method: string
  args?: Record<string, unknown>
  type?: 'GET' | 'POST'
}

export class FrappeError extends Error {}

async function call<T = unknown>({ method, args = {}, type = 'POST' }: CallOptions): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Frappe-CSRF-Token': csrfToken(),
    Accept: 'application/json',
  }

  let url = `/api/method/${method}`
  const init: RequestInit = { method: type, headers, credentials: 'same-origin' }

  if (type === 'GET') {
    const qs = new URLSearchParams()
    Object.entries(args).forEach(([k, v]) => qs.set(k, typeof v === 'string' ? v : JSON.stringify(v)))
    url += `?${qs.toString()}`
  } else {
    init.body = JSON.stringify(args)
  }

  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new FrappeError(`${method} → ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 200)}` : ''}`)
  }
  const json = await res.json()
  return json.message as T
}

export interface DashboardArgs {
  team_filter: string
  period: string
  from_date?: string
  to_date?: string
  [key: string]: unknown
}

import type { RawDashboardResponse } from './types'

export function fetchDashboard(args: DashboardArgs): Promise<RawDashboardResponse> {
  // The original page calls the bare `getDashboardData` server-script method.
  return call<RawDashboardResponse>({ method: 'getDashboardData', args })
}

interface SalesOrderName {
  name: string
}

export function fetchSalesOrdersForDate(deliveryDate: string): Promise<SalesOrderName[]> {
  return call<SalesOrderName[]>({
    method: 'frappe.client.get_list',
    type: 'GET',
    args: {
      doctype: 'Sales Order',
      filters: [
        ['delivery_date', '=', deliveryDate],
        ['docstatus', '=', 1],
        ['status', 'not in', ['Cancelled', 'Closed', 'Completed']],
      ],
      fields: ['name'],
      limit_page_length: 200,
    },
  })
}

interface SalesOrderDoc {
  items?: Array<{ stock_qty?: number; custom_number_of_boxes?: number }>
}

export function fetchSalesOrder(name: string): Promise<SalesOrderDoc> {
  return call<SalesOrderDoc>({
    method: 'frappe.client.get',
    type: 'GET',
    args: { doctype: 'Sales Order', name },
  })
}

export function openDoc(oplId: string) {
  window.open(`/app/order-pick-list/${encodeURIComponent(oplId)}`, '_blank')
}

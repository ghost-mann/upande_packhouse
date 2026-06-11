// Thin Frappe API client. Mirrors what the original pages did via frappe.call,
// but typed and dependency-free so the SPA can run standalone in dev.

const csrfToken = (): string => window.csrf_token || ''

interface CallOptions {
  method: string
  args?: Record<string, unknown>
  type?: 'GET' | 'POST'
}

export class FrappeError extends Error {}

export async function call<T = unknown>({ method, args = {}, type = 'POST' }: CallOptions): Promise<T> {
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

// Generic helper for the bare server-script methods the pages call.
export function callMethod<T = unknown>(method: string, args: Record<string, unknown> = {}): Promise<T> {
  return call<T>({ method, args })
}

// ── frappe.client.* helpers (used by Bucket Tracker + boxes-to-deliver) ──

type Filter = [string, string, unknown] | [string, string, string, unknown]

export function getList<T = Record<string, unknown>>(opts: {
  doctype: string
  filters?: Filter[] | Record<string, unknown>
  fields?: string[]
  orderBy?: string
  limit?: number
  limitStart?: number
}): Promise<T[]> {
  const args: Record<string, unknown> = {
    doctype: opts.doctype,
    fields: opts.fields || ['name'],
    limit_page_length: opts.limit ?? 0,
  }
  if (opts.filters) args.filters = opts.filters
  if (opts.orderBy) args.order_by = opts.orderBy
  if (opts.limitStart != null) args.limit_start = opts.limitStart
  return call<T[]>({ method: 'frappe.client.get_list', type: 'GET', args })
}

// Fully paginate a get_list (the original flP helper, 500/page).
export async function getListAll<T = Record<string, unknown>>(opts: {
  doctype: string
  filters?: Filter[]
  fields?: string[]
  orderBy?: string
}): Promise<T[]> {
  const PAGE = 500
  const out: T[] = []
  let start = 0
  for (;;) {
    const page = await getList<T>({ ...opts, limit: PAGE, limitStart: start }).catch(() => [] as T[])
    out.push(...page)
    if (page.length < PAGE) break
    start += PAGE
  }
  return out
}

export function getDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  return call<T>({ method: 'frappe.client.get', type: 'GET', args: { doctype, name } })
}

export function setValue(doctype: string, name: string, fieldname: string, value: unknown): Promise<unknown> {
  return call({ method: 'frappe.client.set_value', args: { doctype, name, fieldname, value } })
}

// ── Navigation ──

export function openDoc(doctype: string, name: string) {
  if (!name) return
  const slug = doctype.toLowerCase().replace(/ /g, '-')
  window.open(`/app/${slug}/${encodeURIComponent(name)}`, '_blank')
}

// ── Workflow dashboard (page 1) ──

export interface DashboardArgs {
  team_filter: string
  period: string
  from_date?: string
  to_date?: string
  [key: string]: unknown
}

import type { RawDashboardResponse } from './types'

export function fetchDashboard(args: DashboardArgs): Promise<RawDashboardResponse> {
  return call<RawDashboardResponse>({ method: 'getDashboardData', args })
}

interface SalesOrderName {
  name: string
}

export function fetchSalesOrdersForDate(deliveryDate: string): Promise<SalesOrderName[]> {
  return getList<SalesOrderName>({
    doctype: 'Sales Order',
    filters: [
      ['delivery_date', '=', deliveryDate],
      ['docstatus', '=', 1],
      ['status', 'not in', ['Cancelled', 'Closed', 'Completed']],
    ],
    fields: ['name'],
    limit: 200,
  })
}

interface SalesOrderDoc {
  items?: Array<{ stock_qty?: number; custom_number_of_boxes?: number }>
}

export function fetchSalesOrder(name: string): Promise<SalesOrderDoc> {
  return getDoc<SalesOrderDoc>('Sales Order', name)
}

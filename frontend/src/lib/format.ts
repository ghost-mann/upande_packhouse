export const nf = new Intl.NumberFormat('en-US')

export function num(n: number | undefined | null): string {
  return nf.format(Math.round(n || 0))
}

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return String(Math.round(n))
}

export function pct(n: number): string {
  return `${Math.round(n)}%`
}

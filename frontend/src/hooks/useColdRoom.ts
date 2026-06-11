import { useCallback, useEffect, useState } from 'react'
import { callMethod } from '../lib/api'
import { useLiveData } from './useLiveData'

export interface CapacityEntry {
  farm: string
  sensor_name?: string
  temp_min?: number
  temp_max?: number
  humidity_min?: number
  humidity_max?: number
  max_stems?: number
}
export interface StockRow {
  item_code?: string
  stem_length?: string | number
  farm_name?: string
  available_stems?: number
  bucket_count?: number
  shelf_names?: string
}
export interface Aggregations {
  total_buckets?: number
  total_stems?: number
  total_varieties?: number
  avg_age_days?: number
  oldest_age_days?: number
  total_allocated_stems?: number
  total_allocated_buckets?: number
  total_shelves?: number
  total_incoming_stems?: number
  total_incoming_buckets?: number
  total_discard_stems?: number
  total_discard_entries?: number
  farm_stems?: Record<string, number>
  variety_stems?: Record<string, number>
  length_stems?: Record<string, number>
  incoming_stems?: Record<string, number>
  age_dist_labels?: string[]
  age_dist_values?: number[]
}
export interface ColdroomData {
  success: boolean
  error?: string
  available_farms?: { name: string }[]
  capacity_data?: CapacityEntry[]
  stock_data?: StockRow[]
  aggregations?: Aggregations
}
export interface SensorSeries {
  labels: string[]
  values: number[]
  min_value: number
  max_value: number
  thresholds: { min: number; max: number }
  sensorName: string
}

export function useColdRoom(farm: string) {
  const fetcher = useCallback(() => callMethod<ColdroomData>('fetchColdroomData', { farm: farm || '' }), [farm])
  const { data, loading, error, lastUpdated, refresh } = useLiveData(fetcher, { intervalMs: 120_000 })

  const [temp, setTemp] = useState<SensorSeries | null>(null)
  const [hum, setHum] = useState<SensorSeries | null>(null)

  useEffect(() => {
    if (!data?.success) return
    const caps = data.capacity_data || []
    const sensor = (farm ? caps.find((c) => c.farm === farm) : caps[0]) || caps[0]
    const sensorName = sensor?.sensor_name || 'Kapkolia Cold Room 2'
    const th = {
      tMin: sensor?.temp_min ?? 2, tMax: sensor?.temp_max ?? 4,
      hMin: sensor?.humidity_min ?? 80, hMax: sensor?.humidity_max ?? 95,
    }
    let cancelled = false
    const base = { sensor_name: sensorName, date_from: '', timespan: 'last_24h', time_interval: 'hourly' }
    callMethod<Omit<SensorSeries, 'thresholds' | 'sensorName'>>('upande_sensors.api.sensor_charts.get_sensor_chart_data', { ...base, sensor_type: 'Temperature' })
      .then((r) => !cancelled && setTemp({ ...r, thresholds: { min: th.tMin, max: th.tMax }, sensorName }))
      .catch(() => {})
    callMethod<Omit<SensorSeries, 'thresholds' | 'sensorName'>>('upande_sensors.api.sensor_charts.get_sensor_chart_data', { ...base, sensor_type: 'Humidity' })
      .then((r) => !cancelled && setHum({ ...r, thresholds: { min: th.hMin, max: th.hMax }, sensorName }))
      .catch(() => {})
    return () => { cancelled = true }
  }, [data, farm])

  return { data, temp, hum, loading, error, lastUpdated, refresh }
}

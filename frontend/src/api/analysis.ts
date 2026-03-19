import { useQuery } from '@tanstack/react-query'
import { request } from './client'
import type { TrendPoint, KeymapStat, AnalysisSummary } from '@/types/api'

export function useTrend(period = 'day', days = 30) {
  return useQuery({
    queryKey: ['analysis', 'trend', period, days],
    queryFn: () => request<TrendPoint[]>(`/analysis/trend?period=${encodeURIComponent(period)}&days=${days}`),
  })
}

export function useKeymap() {
  return useQuery({
    queryKey: ['analysis', 'keymap'],
    queryFn: () => request<KeymapStat[]>('/analysis/keymap'),
  })
}

export function useSummary() {
  return useQuery({
    queryKey: ['analysis', 'summary'],
    queryFn: () => request<AnalysisSummary>('/analysis/summary'),
  })
}

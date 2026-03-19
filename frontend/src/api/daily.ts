import { useQuery } from '@tanstack/react-query'
import { request } from './client'
import type { DailyRecord } from '@/types/api'

export function useDaily() {
  return useQuery({
    queryKey: ['daily'],
    queryFn: () => request<DailyRecord>('/daily'),
  })
}

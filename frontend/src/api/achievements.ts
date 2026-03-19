import { useQuery } from '@tanstack/react-query'
import { request } from './client'
import type { Achievement } from '@/types/api'

export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: () => request<Achievement[]>('/achievements'),
  })
}

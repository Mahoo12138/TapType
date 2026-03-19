import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import type { UserGoal } from '@/types/api'

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => request<UserGoal[]>('/goals'),
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { goal_type: string; target_value: number; period?: string }) =>
      request<UserGoal>('/goals', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; target_value?: number; is_active?: number }) =>
      request<UserGoal>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => request<null>(`/goals/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

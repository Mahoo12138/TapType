import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import type { SessionWithContent, PaginatedList, SessionListItem, SessionDetail, CompleteResult } from '@/types/api'

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { mode: string; source_type: string; source_id: string; item_count?: number }) =>
      request<SessionWithContent>('/practice/sessions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useSessions(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['sessions', page, pageSize],
    queryFn: () => request<PaginatedList<SessionListItem>>(`/practice/sessions?page=${page}&page_size=${pageSize}`),
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => request<SessionDetail>(`/practice/sessions/${id}`),
    enabled: !!id,
  })
}

export function useCompletePractice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, ...data }: {
      sessionId: string
      wpm: number
      raw_wpm: number
      accuracy: number
      error_count: number
      char_count: number
      consistency: number
      duration_ms: number
      keystroke_stats: { key_char: string; hit_count: number; error_count: number; avg_interval_ms: number }[]
      error_items: { content_type: string; content_id: string; error_count: number; avg_time_ms: number }[]
    }) =>
      request<CompleteResult>(`/practice/sessions/${sessionId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['session', variables.sessionId] })
      qc.invalidateQueries({ queryKey: ['daily'] })
      qc.invalidateQueries({ queryKey: ['achievements'] })
      qc.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

export function useDiscardSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => request<null>(`/practice/sessions/${sessionId}`, { method: 'DELETE' }),
    onSuccess: (_, sessionId) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.removeQueries({ queryKey: ['session', sessionId] })
    },
  })
}

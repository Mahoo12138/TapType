import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import type { PaginatedErrors, ReviewQueue, ReviewSessionData } from '@/types/api'

export function useErrors(page = 1, pageSize = 20, contentType?: string) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (contentType) params.set('content_type', contentType)
  return useQuery({
    queryKey: ['errors', page, pageSize, contentType],
    queryFn: () => request<PaginatedErrors>(`/errors?${params}`),
  })
}

export function useReviewQueue(limit = 50) {
  return useQuery({
    queryKey: ['errors', 'review-queue', limit],
    queryFn: () => request<ReviewQueue>(`/errors/review-queue?limit=${limit}`),
  })
}

export function useCreateReviewSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemCount: number = 20) =>
      request<ReviewSessionData>('/errors/review-session', {
        method: 'POST',
        body: JSON.stringify({ item_count: itemCount }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['errors'] })
    },
  })
}

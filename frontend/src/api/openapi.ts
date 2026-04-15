import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import type { ApiToken, CreateApiTokenResponse } from '@/types/api'

const TOKENS_KEY = ['openapi', 'tokens']

export function useApiTokens() {
  return useQuery({
    queryKey: TOKENS_KEY,
    queryFn: () =>
      request<{ list: ApiToken[] }>('/openapi/tokens').then((d) => d.list),
  })
}

interface CreateTokenParams {
  name: string
  scopes?: string
  expires_in?: number | null
}

export function useCreateApiToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: CreateTokenParams) =>
      request<CreateApiTokenResponse>('/openapi/tokens', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TOKENS_KEY })
    },
  })
}

export function useDeleteApiToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      request<null>(`/openapi/tokens/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TOKENS_KEY })
    },
  })
}

interface UpdateTokenParams {
  id: string
  name?: string
  scopes?: string
  is_active?: number
}

export function useUpdateApiToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateTokenParams) =>
      request<{ token: ApiToken }>(`/openapi/tokens/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TOKENS_KEY })
    },
  })
}

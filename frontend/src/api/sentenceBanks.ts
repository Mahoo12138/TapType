import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import type { SentenceBank, Sentence, PaginatedList } from '@/types/api'

// Sentence Bank CRUD
export function useSentenceBanks() {
  return useQuery({ queryKey: ['sentenceBanks'], queryFn: () => request<SentenceBank[]>('/sentence-banks') })
}

export function useSentenceBank(id: string) {
  return useQuery({ queryKey: ['sentenceBank', id], queryFn: () => request<SentenceBank>(`/sentence-banks/${id}`), enabled: !!id })
}

export function useCreateSentenceBank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; category?: string; is_public?: number }) =>
      request<SentenceBank>('/sentence-banks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sentenceBanks'] }),
  })
}

export function useUpdateSentenceBank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; category?: string; is_public?: number }) =>
      request<SentenceBank>(`/sentence-banks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sentenceBanks'] }),
  })
}

export function useDeleteSentenceBank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => request<null>(`/sentence-banks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sentenceBanks'] }),
  })
}

// Sentence CRUD
export function useSentences(bankId: string, page = 1, pageSize = 20, search = '', difficulty = 0) {
  return useQuery({
    queryKey: ['sentences', bankId, page, pageSize, search, difficulty],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (search) params.set('search', search)
      if (difficulty > 0) params.set('difficulty', String(difficulty))
      return request<PaginatedList<Sentence>>(`/sentence-banks/${bankId}/sentences?${params}`)
    },
    enabled: !!bankId,
  })
}

export function useCreateSentence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      bankId,
      ...data
    }: {
      bankId: string
      content: string
      translation?: string
      translation_source?: string
      source?: string
      difficulty?: number
      tags?: string
    }) =>
      request<Sentence>(`/sentence-banks/${bankId}/sentences`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['sentences', v.bankId] })
      qc.invalidateQueries({ queryKey: ['sentenceBanks'] })
    },
  })
}

export function useUpdateSentence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sentenceId,
      ...data
    }: {
      sentenceId: string
      content?: string
      translation?: string
      translation_source?: string
      source?: string
      difficulty?: number
      tags?: string
    }) =>
      request<Sentence>(`/sentences/${sentenceId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sentences'] }),
  })
}

export function useDeleteSentence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sentenceId: string) => request<null>(`/sentences/${sentenceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sentences'] })
      qc.invalidateQueries({ queryKey: ['sentenceBanks'] })
    },
  })
}

// Import (file upload)
export function useImportSentences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ bankId, file, format }: { bankId: string; file: File; format: 'json' | 'csv' }) => {
      const formData = new FormData()
      formData.append('file', file)
      return request<{ imported: number }>(`/sentence-banks/${bankId}/sentences/import?format=${format}`, {
        method: 'POST',
        body: formData,
        headers: {},
      })
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['sentences', v.bankId] })
      qc.invalidateQueries({ queryKey: ['sentenceBanks'] })
    },
  })
}

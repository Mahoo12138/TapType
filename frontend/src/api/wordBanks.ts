import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import type { WordBank, Word, PaginatedList } from '@/types/api'

// Word Bank CRUD
export function useWordBanks() {
  return useQuery({ queryKey: ['wordBanks'], queryFn: () => request<WordBank[]>('/word-banks') })
}

export function useWordBank(id: string) {
  return useQuery({ queryKey: ['wordBank', id], queryFn: () => request<WordBank>(`/word-banks/${id}`), enabled: !!id })
}

export function useCreateWordBank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; is_public?: number }) =>
      request<WordBank>('/word-banks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wordBanks'] }),
  })
}

export function useUpdateWordBank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; is_public?: number }) =>
      request<WordBank>(`/word-banks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wordBanks'] }),
  })
}

export function useDeleteWordBank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => request<null>(`/word-banks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wordBanks'] }),
  })
}

// Word CRUD
export function useWords(bankId: string, page = 1, pageSize = 20, search = '', difficulty = 0) {
  return useQuery({
    queryKey: ['words', bankId, page, pageSize, search, difficulty],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (search) params.set('search', search)
      if (difficulty > 0) params.set('difficulty', String(difficulty))
      return request<PaginatedList<Word>>(`/word-banks/${bankId}/words?${params}`)
    },
    enabled: !!bankId,
  })
}

export function useCreateWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bankId, ...data }: { bankId: string; content: string; pronunciation?: string; definition?: string; example_sentence?: string; difficulty?: number; tags?: string }) =>
      request<Word>(`/word-banks/${bankId}/words`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['words', v.bankId] })
      qc.invalidateQueries({ queryKey: ['wordBanks'] })
    },
  })
}

export function useUpdateWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ wordId, ...data }: { wordId: string; content?: string; pronunciation?: string; definition?: string; example_sentence?: string; difficulty?: number; tags?: string }) =>
      request<Word>(`/words/${wordId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['words'] }),
  })
}

export function useDeleteWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (wordId: string) => request<null>(`/words/${wordId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['words'] })
      qc.invalidateQueries({ queryKey: ['wordBanks'] })
    },
  })
}

// Import (file upload)
export function useImportWords() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ bankId, file, format }: { bankId: string; file: File; format: 'json' | 'csv' }) => {
      const formData = new FormData()
      formData.append('file', file)
      return request<{ imported: number }>(`/word-banks/${bankId}/words/import?format=${format}`, {
        method: 'POST',
        body: formData,
        headers: {}, // let browser set content-type for FormData
      })
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['words', v.bankId] })
      qc.invalidateQueries({ queryKey: ['wordBanks'] })
    },
  })
}

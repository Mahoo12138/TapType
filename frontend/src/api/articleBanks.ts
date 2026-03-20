import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from './client'
import type {
  ArticleBank,
  Article,
  ArticleDetail,
  ArticleSentence,
  ParagraphDetail,
  UserArticleProgress,
  PaginatedList,
  ProgressItem,
} from '@/types/api'

// ─── Article Bank CRUD ───────────────────────────────────

export function useArticleBanks() {
  return useQuery({
    queryKey: ['articleBanks'],
    queryFn: () => request<ArticleBank[]>('/article-banks'),
  })
}

export function useArticleBank(id: string) {
  return useQuery({
    queryKey: ['articleBank', id],
    queryFn: () => request<ArticleBank>(`/article-banks/${id}`),
    enabled: !!id,
  })
}

export function useCreateArticleBank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; language?: string; is_public?: number }) =>
      request<ArticleBank>('/article-banks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articleBanks'] }),
  })
}

export function useUpdateArticleBank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; language?: string; is_public?: number }) =>
      request<ArticleBank>(`/article-banks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articleBanks'] }),
  })
}

export function useDeleteArticleBank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => request<null>(`/article-banks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articleBanks'] }),
  })
}

// ─── Article CRUD ────────────────────────────────────────

export function useArticles(bankId: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['articles', bankId, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      return request<PaginatedList<Article>>(`/article-banks/${bankId}/articles?${params}`)
    },
    enabled: !!bankId,
  })
}

export function useCreateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      bankId,
      ...data
    }: {
      bankId: string
      title: string
      author?: string
      source_url?: string
      content: string
      difficulty?: number
      tags?: string
      sentences_translation?: Record<string, string>
    }) =>
      request<Article>(`/article-banks/${bankId}/articles`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['articles', v.bankId] })
      qc.invalidateQueries({ queryKey: ['articleBanks'] })
    },
  })
}

export function useArticleDetail(articleId: string) {
  return useQuery({
    queryKey: ['articleDetail', articleId],
    queryFn: () => request<ArticleDetail>(`/articles/${articleId}`),
    enabled: !!articleId,
  })
}

export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      articleId,
      ...data
    }: {
      articleId: string
      title?: string
      author?: string
      source_url?: string
      difficulty?: number
      tags?: string
    }) =>
      request<Article>(`/articles/${articleId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['articleDetail', v.articleId] })
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
  })
}

export function useDeleteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (articleId: string) => request<null>(`/articles/${articleId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] })
      qc.invalidateQueries({ queryKey: ['articleBanks'] })
    },
  })
}

export function useExportArticleBank() {
  return useMutation({
    mutationFn: (bankId: string) =>
      fetch(`/api/v1/article-banks/${bankId}/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`,
        },
      }).then((r) => r.blob()),
  })
}

// ─── Progress & Practice ─────────────────────────────────

export function useArticleSentences(articleId: string) {
  return useQuery({
    queryKey: ['articleSentences', articleId],
    queryFn: () => request<ArticleSentence[]>(`/articles/${articleId}/sentences`),
    enabled: !!articleId,
  })
}

export function useUpdateArticleSentence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sentenceId,
      ...data
    }: {
      sentenceId: string
      translation?: string
      translation_source?: string
    }) => request<ArticleSentence>(`/article-sentences/${sentenceId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articleSentences'] })
      qc.invalidateQueries({ queryKey: ['nextParagraph'] })
    },
  })
}

export function useNextParagraph(articleId: string) {
  return useQuery({
    queryKey: ['nextParagraph', articleId],
    queryFn: () => request<ParagraphDetail>(`/articles/${articleId}/next-paragraph`),
    enabled: !!articleId,
  })
}

export function useCompleteParagraph() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ articleId, index }: { articleId: string; index: number }) =>
      request<UserArticleProgress>(`/articles/${articleId}/paragraphs/${index}/complete`, { method: 'POST' }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['nextParagraph', v.articleId] })
      qc.invalidateQueries({ queryKey: ['articleDetail', v.articleId] })
      qc.invalidateQueries({ queryKey: ['articleProgress'] })
    },
  })
}

export function useArticleProgress() {
  return useQuery({
    queryKey: ['articleProgress'],
    queryFn: () => request<ProgressItem[]>('/articles/progress'),
  })
}

export function useResetProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (articleId: string) =>
      request<null>(`/articles/${articleId}/progress`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articleProgress'] })
      qc.invalidateQueries({ queryKey: ['nextParagraph'] })
    },
  })
}

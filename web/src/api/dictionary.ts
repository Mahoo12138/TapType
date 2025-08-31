import { fetcher } from './client';

// 类型定义
export interface WordResDto {
  id?: string;
  word: string;
  definition: string[];
  examples?: string[];
  pronunciation: string;
  audioUrl?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DictionaryResDto {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  categoryId: string;
  isActive: boolean;
  isPublic: boolean;
  metadata: Record<string, any>;
  tags?: string[];
  words: WordResDto[];
  createdAt: string;
  updatedAt: string;
}

export interface OffsetPagination {
  limit: number;
  currentPage: number;
  nextPage?: number;
  previousPage?: number;
  totalRecords: number;
  totalPages: number;
}

export interface OffsetPaginatedDto<T> {
  data: T[];
  pagination: OffsetPagination;
}

export interface DictionaryQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
}

export interface CreateDictionaryDto {
  name: string;
  description?: string;
  isPublic?: boolean;
  wordCount?: number;
  categoryId?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  words?: Partial<WordResDto>[];
  tags?: string[];
}

export interface UpdateDictionaryDto extends Partial<CreateDictionaryDto> {}

// API 封装
export const fetchDictionaries = (params: DictionaryQueryParams) =>
  fetcher(`/api/v1/dictionary?${new URLSearchParams(params as any)}`);

export const createDictionary = (data: CreateDictionaryDto) =>
  fetcher('/api/v1/dictionary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const updateDictionary = (id: string, data: UpdateDictionaryDto) =>
  fetcher(`/api/v1/dictionary/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const deleteDictionary = (id: string) =>
  fetcher(`/api/v1/dictionary/${id}`, {
    method: 'DELETE',
  });

// 分页获取某词典下的单词
export const fetchWordsByDictionary = (dictionaryId: string, params: { page?: number; limit?: number }) =>
  fetcher(`/api/v1/word/dictionary/${dictionaryId}?${new URLSearchParams(params as any)}`); 
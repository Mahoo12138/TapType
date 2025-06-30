import { fetcher } from './client'
import type { TypingState } from '@/pages/Typing/store/type'
import type { WordWithIndex } from '@/typings'

export interface CreateChapterRecordDto {
  dict: string
  time: number
  correctCount: number
  wrongCount: number
  wordCount: number
  correctWordIndexes: number[]
  wordNumber: number
  wordRecords: CreateWordRecordDto[]
}

export interface CreateWordRecordDto {
  wordId: string
  wordName: string
  timing: number[]
  wrongCount: number
  mistakes: Record<number, string[]>
}

export interface ChapterRecordResDto {
  id: string
  dict: string
  time: number
  correctCount: number
  wrongCount: number
  wordCount: number
  correctWordIndexes: number[]
  wordNumber: number
  createdAt: string
  updatedAt: string
}

export interface WordRecordResDto {
  id: string
  chapterRecordId: string | null
  dictId: string
  wordId: string
  wordName: string
  timing: number[]
  wrongCount: number
  mistakes: Record<number, string[]>
  createdAt: string
  updatedAt: string
}

// 保存章节记录（包含单词记录）
export const saveChapterRecord = async (data: CreateChapterRecordDto): Promise<ChapterRecordResDto> => {
  return fetcher('/api/v1/record/chapter-with-words', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

// 查询章节记录列表
export const fetchChapterRecords = async (params: {
  page?: number
  limit?: number
  dict?: string
} = {}): Promise<{
  data: ChapterRecordResDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  if (params.dict) searchParams.append('dict', params.dict)

  return fetcher(`/api/v1/record/chapter?${searchParams.toString()}`)
}

// 查询单词记录列表
export const fetchWordRecords = async (params: {
  page?: number
  limit?: number
  dictId?: string
  chapterRecordId?: string
  wordName?: string
} = {}): Promise<{
  data: WordRecordResDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> => {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())
  if (params.dictId) searchParams.append('dictId', params.dictId)
  if (params.chapterRecordId) searchParams.append('chapterRecordId', params.chapterRecordId)
  if (params.wordName) searchParams.append('wordName', params.wordName)

  return fetcher(`/api/v1/record/word?${searchParams.toString()}`)
}

// 根据ID查询章节记录
export const fetchChapterRecordById = async (id: string): Promise<ChapterRecordResDto> => {
  return fetcher(`/api/v1/record/chapter/${id}`)
}

// 根据ID查询单词记录
export const fetchWordRecordById = async (id: string): Promise<WordRecordResDto> => {
  return fetcher(`/api/v1/record/word/${id}`)
}

// 将打字状态转换为API所需的数据格式
export const transformTypingStateToChapterRecord = (
  state: TypingState,
  dictId: string,
  words: WordWithIndex[]
): CreateChapterRecordDto => {
  const { chapterData, timerData } = state
  
  // 计算正确单词的索引
  const correctWordIndexes = chapterData.userInputLogs
    .filter(log => log.correctCount > 0 && log.wrongCount === 0)
    .map(log => log.index)

  // 转换单词记录
  const wordRecords: CreateWordRecordDto[] = chapterData.userInputLogs
    .filter(log => log.correctCount > 0 || log.wrongCount > 0) // 只保存有输入记录的单词
    .map(log => {
      const word = words[log.index]
      return {
        wordId: '', // 暂时使用空字符串，后续可以通过wordName查找对应的wordId
        wordName: word.name,
        timing: [], // 这里需要从打字状态中获取时间数据
        wrongCount: log.wrongCount,
        mistakes: log.LetterMistakes,
      }
    })

  return {
    dict: dictId,
    time: timerData.time,
    correctCount: chapterData.correctCount,
    wrongCount: chapterData.wrongCount,
    wordCount: chapterData.wordCount,
    correctWordIndexes,
    wordNumber: words.length,
    wordRecords,
  }
} 
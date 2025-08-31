import { useMutation } from '@tanstack/react-query'
import { saveChapterRecord, transformTypingStateToChapterRecord } from '@/api/record'
import type { TypingState } from '../store/type'
import type { WordWithIndex } from '@/typings'
import { useTypingConfigStore } from '@/store/typing'
import { useContext } from 'react'
import { TypingContext, TypingStateActionType } from '../store'

export const useSaveChapterRecord = () => {
  const { currentDictInfo } = useTypingConfigStore()
  const typingContext = useContext(TypingContext)

  const mutation = useMutation({
    mutationFn: async (data: {
      state: TypingState
      words: WordWithIndex[]
    }) => {
      if (!currentDictInfo) {
        throw new Error('No dictionary selected')
      }

      const chapterRecordData = transformTypingStateToChapterRecord(
        data.state,
        currentDictInfo.id,
        data.words
      )

      return saveChapterRecord(chapterRecordData)
    },
    onMutate: () => {
      // 开始保存时设置状态
      if (typingContext?.dispatch) {
        typingContext.dispatch({ 
          type: TypingStateActionType.SET_IS_SAVING_RECORD, 
          payload: true 
        })
      }
    },
    onSuccess: (data) => {
      console.log('Chapter record saved successfully:', data)
      // 保存成功后重置状态
      if (typingContext?.dispatch) {
        typingContext.dispatch({ 
          type: TypingStateActionType.SET_IS_SAVING_RECORD, 
          payload: false 
        })
      }
    },
    onError: (error) => {
      console.error('Failed to save chapter record:', error)
      // 保存失败后重置状态
      if (typingContext?.dispatch) {
        typingContext.dispatch({ 
          type: TypingStateActionType.SET_IS_SAVING_RECORD, 
          payload: false 
        })
      }
    },
  })

  return {
    saveChapterRecord: mutation.mutate,
    isSaving: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  }
} 
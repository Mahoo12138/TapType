import Layout from '../../components/layouts/Layout'
import { TypingContext, TypingStateActionType, initialState, typingReducer } from './store'
import Header from '@/components/Header'
import WordPanel from './components/WordPanel'
import { fetchDictionaries } from '@/api/dictionary'
import { fetchWordsByDictionary } from '@/api/word'
import type { DictionaryResDto, WordResDto } from '@/api/dictionary'
import type { WordWithIndex } from '@/typings'

import type React from 'react'
import { useEffect, useState, useRef } from 'react'
import { useImmerReducer } from 'use-immer'
import { Box, Stack, CircularProgress, Container } from '@mui/joy'
import { useQuery } from '@tanstack/react-query'
import { isLegal } from '@/utils'
import Speed from './components/Speed'
import { useConfetti } from './hooks/useConfetti'
import ResultScreen from './components/ResultScreen'
import { useTypingConfigStore } from '@/store/typing'
import { useSaveChapterRecord } from './hooks/useSaveChapterRecord'

const Typing: React.FC = () => {
  const [state, dispatch] = useImmerReducer(typingReducer, structuredClone(initialState))
  const {
    currentDictInfo,
    setCurrentDictInfo
  } = useTypingConfigStore();
  
  const { saveChapterRecord, isSaving } = useSaveChapterRecord()
  const hasSavedChapterRef = useRef(false); // New ref to track if save was triggered for current completion

  // 1. 获取所有词典
  const {
    data: dictData,
    isLoading: isDictLoading,
    isError: isDictError,
  } = useQuery({
    queryKey: ['dictionaries'],
    queryFn: () => fetchDictionaries({ page: 1, limit: 100 })
  })

  // 2. 选择第一个词典
  useEffect(() => {
    if (dictData && dictData.data && dictData.data.length > 0) {
      setCurrentDictInfo(dictData.data[0])
    }
  }, [dictData])

  // 3. 获取当前词典下的单词
  const {
    data: wordsData,
    isLoading: isWordsLoading,
    isError: isWordsError,
  } = useQuery({
    queryKey: currentDictInfo ? ['words', currentDictInfo.id] : [],
    queryFn: () => currentDictInfo ? fetchWordsByDictionary(currentDictInfo.id, { page: 1, limit: 999 }) : Promise.resolve({ data: [] }),
    enabled: !!currentDictInfo
  })

  const isLoading = isDictLoading || (currentDictInfo && isWordsLoading)

  // 4. 单词加载后初始化打字状态
  useEffect(() => {
    if (wordsData && wordsData.data && currentDictInfo) {
      const words: WordWithIndex[] = (wordsData.data as WordResDto[]).map((w, idx) => {
        const [usphone, ukphone] = w.pronunciation.split(',') || ['', '']

        return {
          id: w.id,
          name: w.word,
          trans: w.definition,
          usphone,
          ukphone,
          index: idx,
        }
      })
      dispatch({
        type: TypingStateActionType.SETUP_CHAPTER,
        payload: { words, shouldShuffle: false },
      })
    }
  }, [wordsData, currentDictInfo, dispatch])

  useEffect(() => {
    if (!state.isTyping) {
      const onKeyDown = (e: KeyboardEvent) => {
        console.log('onKeyDown');
        if (!isLoading && e.key !== 'Enter' && (isLegal(e.key) || e.key === ' ') && !e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          dispatch({ type: TypingStateActionType.SET_IS_TYPING, payload: true })
        }
      }
      window.addEventListener('keydown', onKeyDown)

      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [state.isTyping, isLoading, dispatch])

  useEffect(() => {
    console.log('useEffect triggered. State:', {
      isFinished: state.isFinished,
      isSavingRecord: state.isSavingRecord,
      isSaving: isSaving,
      wordsDataExists: !!wordsData?.data,
      hasSavedChapterRef: hasSavedChapterRef.current,
    });

    // 当用户完成章节后且完成 word Record 数据保存，记录 chapter Record 数据,
    // Add hasSavedChapterRef.current to prevent infinite calls after a single chapter completion.
    if (state.isFinished && !state.isSavingRecord && !isSaving && wordsData?.data && !hasSavedChapterRef.current) {
      console.log('saveChapterRecord logic executing once for finished chapter.');
      hasSavedChapterRef.current = true; // Set flag to true to prevent re-execution for this completion

      const words: WordWithIndex[] = (wordsData.data as WordResDto[]).map((w, idx) => {
        const [usphone, ukphone] = w.pronunciation.split(',') || ['', '']

        return {
          id: w.id,
          name: w.word,
          trans: w.definition,
          usphone,
          ukphone,
          index: idx,
        }
      })

      saveChapterRecord({ state, words })
    } else if (!state.isFinished && hasSavedChapterRef.current) {
      // Reset the flag if a new chapter starts or user exits the finished state
      console.log('Resetting hasSavedChapterRef as chapter is not finished.');
      hasSavedChapterRef.current = false;
    }
  }, [state.isFinished, state.isSavingRecord, isSaving, wordsData, saveChapterRecord])

  useEffect(() => {
    // 启动计时器
    let intervalId: number
    if (state.isTyping) {
      intervalId = window.setInterval(() => {
        dispatch({ type: TypingStateActionType.TICK_TIMER })
      }, 1000)
    }
    return () => clearInterval(intervalId)
  }, [state.isTyping, dispatch])

  useEffect(() => {
    // 当用户切换到其他窗口时，暂停打字状态
    const onBlur = () => {
      dispatch({ type: TypingStateActionType.SET_IS_TYPING, payload: false })
    }
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('blur', onBlur)
    }
  }, [dispatch])

  // 练习完成后展示 confetti 特效
  useConfetti(state.isFinished)


  return (
    <TypingContext.Provider value={{ state: state, dispatch }}>
      <Layout>
        <Header>
        </Header>
        <Container sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Box sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Box sx={{
              flex: 1,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isLoading ? (
                <Stack alignItems="center" justifyContent="center">
                  <CircularProgress size="md" />
                </Stack>
              ) : (
                !state.isFinished && <>
                  <WordPanel />
                  <Speed />
                </>
              )}
            </Box>
          </Box>
        </Container>
      </Layout>
      {state.isFinished && <ResultScreen />}
    </TypingContext.Provider>
  )
}

export default Typing

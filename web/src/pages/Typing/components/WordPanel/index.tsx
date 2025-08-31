import { TypingContext, TypingStateActionType } from '../../store'
import type { TypingState } from '../../store/type'
import PrevAndNextWord from '../PrevAndNextWord'
import Progress from '../Progress'
import Phonetic from './components/Phonetic'
import Translation from './components/Translation'
import WordComponent from './components/Word'
import { usePrefetchPronunciationSound } from '@/hooks/usePronunciation'
import { useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import type { Word } from '@/typings'
import { Box, Stack, Typography } from '@mui/joy'
import { useTypingConfigStore, ReviewModeInfo } from '@/store/typing'
import type { WordUpdateAction } from './components/InputHandler'
import InputHandler from './components/InputHandler'

export default function WordPanel() {
  const { state, dispatch } = useContext(TypingContext)!
  const phoneticConfig = useTypingConfigStore((s) => s.phoneticConfig)
  const isShowPrevAndNextWord = useTypingConfigStore((s) => s.isShowPrevAndNextWord)
  const loopWordTimes = useTypingConfigStore((s) => s.loopWordTimes)
  const reviewModeInfo = useTypingConfigStore((s) => s.reviewModeInfo)
  const setReviewModeInfo = useTypingConfigStore((s) => s.setReviewModeInfo)
  
  const isReviewMode = reviewModeInfo.isReviewMode

  const [wordComponentKey, setWordComponentKey] = useState(0)
  const [currentWordExerciseCount, setCurrentWordExerciseCount] = useState(0)
  const currentWord = state.chapterData.words[state.chapterData.index]
  const nextWord = state.chapterData.words[state.chapterData.index + 1] as Word | undefined

  // 用于存储每个单词的按键时间戳
  const letterTimeArrayRef = useRef<number[]>([])

  const prevIndex = useMemo(() => {
    const newIndex = state.chapterData.index - 1
    return newIndex < 0 ? 0 : newIndex
  }, [state.chapterData.index])
  const nextIndex = useMemo(() => {
    const newIndex = state.chapterData.index + 1
    return newIndex > state.chapterData.words.length - 1 ? state.chapterData.words.length - 1 : newIndex
  }, [state.chapterData.index, state.chapterData.words.length])

  usePrefetchPronunciationSound(nextWord?.name)

  const reloadCurrentWordComponent = useCallback(() => {
    setWordComponentKey((old: number) => old + 1)
  }, [])

  const updateReviewRecord = useCallback(
    (state: TypingState) => {
      setReviewModeInfo((old: ReviewModeInfo) => ({
        ...old,
        reviewRecord: old.reviewRecord ? { ...old.reviewRecord, index: state.chapterData.index } : undefined,
      }))
    },
    [setReviewModeInfo],
  )

  // 处理单词输入和按键时间记录
  const updateInput = useCallback((updateObj: WordUpdateAction) => {
    if (updateObj.type === 'add') {
      letterTimeArrayRef.current.push(Date.now())
      dispatch({ type: TypingStateActionType.REPORT_CORRECT_WORD, payload: { letterTimeArray: letterTimeArrayRef.current } })
    } else if (updateObj.type === 'delete') {
      if (letterTimeArrayRef.current.length > 0) {
        letterTimeArrayRef.current.pop()
      }
      dispatch({ type: TypingStateActionType.REPORT_WRONG_WORD, payload: { letterMistake: {}, letterTimeArray: letterTimeArrayRef.current } })
    }
    // Add composition handling if needed
  }, [dispatch])

  const onFinish = useCallback(() => {
    // 重置 letterTimeArrayRef
    letterTimeArrayRef.current = []

    if (state.chapterData.index < state.chapterData.words.length - 1 || currentWordExerciseCount < loopWordTimes - 1) {
      // 用户完成当前单词
      if (currentWordExerciseCount < loopWordTimes - 1) {
        setCurrentWordExerciseCount((old: number) => old + 1)
        dispatch({ type: TypingStateActionType.LOOP_CURRENT_WORD })
        reloadCurrentWordComponent()
      } else {
        setCurrentWordExerciseCount(0)
        if (isReviewMode) {
          dispatch({
            type: TypingStateActionType.NEXT_WORD,
            payload: {
              updateReviewRecord,
              letterTimeArray: letterTimeArrayRef.current, // Pass letterTimeArray here
            },
          })
        } else {
          dispatch({ type: TypingStateActionType.NEXT_WORD, payload: { letterTimeArray: letterTimeArrayRef.current } }) // Pass letterTimeArray here
        }
      }
    } else {
      // 最后一个单词或最后一轮循环
      setCurrentWordExerciseCount(0)
      // 章节完成，触发 FINISH_CHAPTER
      dispatch({ type: TypingStateActionType.FINISH_CHAPTER, payload: { letterTimeArray: letterTimeArrayRef.current } })
    }
  }, [
    state.chapterData.index,
    state.chapterData.words.length,
    currentWordExerciseCount,
    loopWordTimes,
    dispatch,
    reloadCurrentWordComponent,
    isReviewMode,
    updateReviewRecord,
    setReviewModeInfo,
  ])

  const onSkipWord = useCallback(
    (type: 'prev' | 'next') => {
      // 重置 letterTimeArrayRef
      letterTimeArrayRef.current = []
      if (type === 'prev') {
        dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex: prevIndex })
      }

      if (type === 'next') {
        dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex: nextIndex })
      }
    },
    [dispatch, prevIndex, nextIndex],
  )

  useHotkeys(
    'Ctrl + Shift + ArrowLeft',
    (e) => {
      e.preventDefault()
      onSkipWord('prev')
    },
    { preventDefault: true },
  )

  useHotkeys(
    'Ctrl + Shift + ArrowRight',
    (e) => {
      e.preventDefault()
      onSkipWord('next')
    },
    { preventDefault: true },
  )
  const [isShowTranslation, setIsHoveringTranslation] = useState(false)

  const handleShowTranslation = useCallback((checked: boolean) => {
    setIsHoveringTranslation(checked)
  }, [])

  useHotkeys(
    'tab',
    () => {
      handleShowTranslation(true)
    },
    { enableOnFormTags: true, preventDefault: true },
    [],
  )

  useHotkeys(
    'tab',
    () => {
      handleShowTranslation(false)
    },
    { enableOnFormTags: true, keyup: true, preventDefault: true },
    [],
  )

  const shouldShowTranslation = useMemo(() => {
    return isShowTranslation || state.isTransVisible
  }, [isShowTranslation, state.isTransVisible])

  return (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      sx={{ height: '100%', width: '100%', flex: 1 }}
    >
      {/* 顶部导航/切换 */}
      <Box
        sx={{
          width: '100%',
          height: 96,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 6,
          pt: 2.5,
          flexShrink: 0,
          flexGrow: 0,
        }}
      >
        {isShowPrevAndNextWord && state.isTyping && (
          <>
            <PrevAndNextWord type="prev" />
            <PrevAndNextWord type="next" />
          </>
        )}
      </Box>

      {/* 单词输入区 */}
      <Box
        sx={{
          flexGrow: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {currentWord && (
          <Box sx={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            {!state.isTyping && (
              <Box
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  bgcolor: '#fff',
                  opacity: 0.8,
                  borderRadius: 1,
                }}
              >
                <Typography level="h3">按下任意键开始练习</Typography>
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: '800px',
                gap: 1,
              }}
            >
              <Phonetic word={currentWord} />
              <WordComponent word={currentWord} onFinish={onFinish} />
              {shouldShowTranslation && (
                <Translation
                  trans={currentWord.trans.join('；')}
                  showTrans={shouldShowTranslation}
                  onMouseEnter={() => handleShowTranslation(true)}
                  onMouseLeave={() => handleShowTranslation(false)}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>
      <InputHandler updateInput={updateInput} />
    </Stack>
  )
}

import { usePrefetchPronunciationSound } from '@/hooks/usePronunciation'
import { useTypingConfigStore } from '@/store/typing'
import type { Word } from '@/typings'
import { useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { TypingContext, TypingStateActionType } from '../../store'
import type { TypingState } from '../../store/type'
import PrevAndNextWord from '../PrevAndNextWord'
import Progress from '../Progress'
import Phonetic from './components/Phonetic'
import type { WordUpdateAction } from './components/InputHandler'
import Translation from './components/Translation'
import WordComponent from './components/Word'

export default function WordPanel() {
  const { state, dispatch } = useContext(TypingContext)!
  const isShowPrevAndNextWord = useTypingConfigStore((s) => s.isShowPrevAndNextWord)
  const loopWordTimes = useTypingConfigStore((s) => s.loopWordConfig.times)
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
      setReviewModeInfo({
        reviewRecord: reviewModeInfo.reviewRecord ? { ...reviewModeInfo.reviewRecord, index: state.chapterData.index } : undefined,
      })
    },
    [setReviewModeInfo, reviewModeInfo.reviewRecord],
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
              letterTimeArray: letterTimeArrayRef.current,
            },
          })
        } else {
          dispatch({ type: TypingStateActionType.NEXT_WORD, payload: { letterTimeArray: letterTimeArrayRef.current } })
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
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
      {/* 顶部导航/切换 */}
      <div className="flex h-24 w-full flex-shrink-0 flex-grow-0 items-center justify-between px-6 pt-2.5">
        {isShowPrevAndNextWord && state.isTyping && (
          <>
            <PrevAndNextWord type="prev" />
            <PrevAndNextWord type="next" />
          </>
        )}
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <div className="flex w-full flex-1 flex-col items-center justify-center pt-5">
          <Translation
            trans={currentWord.trans.join('；')}
            showTrans={shouldShowTranslation}
            onMouseEnter={() => handleShowTranslation(true)}
            onMouseLeave={() => handleShowTranslation(false)}
          />
          <Phonetic word={currentWord} />
          <WordComponent key={wordComponentKey} word={currentWord} onFinish={onFinish} />
        </div>
      </div>

      <div className="flex w-full flex-shrink-0 flex-grow-0 flex-col items-center justify-center px-12 pb-12">
        <Progress className="w-full" />
      </div>
    </div>
  )
}

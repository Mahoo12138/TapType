import type { WordUpdateAction } from '../InputHandler'
import InputHandler from '../InputHandler'
import Letter from './Letter'
import Notation from './Notation'
import { TipAlert } from './TipAlert'
import { initialWordState } from './type'
import type { WordPronunciationIconRef } from '@/components/WordPronunciationIcon'
import { WordPronunciationIcon } from '@/components/WordPronunciationIcon'
import { EXPLICIT_SPACE } from '@/constants'
import useKeySounds from '@/hooks/useKeySounds'
import { TypingContext, TypingStateActionType } from '../../../../store'
import { useTypingConfigStore } from '@/store/typing'
import { useDictStore, getCurrentDictInfo } from '@/store/dict'
import type { Word } from '@/typings'
import { CTRL } from '@/utils'
import { useCallback, useContext, useEffect, useRef, useState, useReducer } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { wordReducer } from './reducer'
import { cn } from '@/lib/utils'

const vowelLetters = ['A', 'E', 'I', 'O', 'U']

export default function WordComponent({ word, onFinish }: { word: Word; onFinish: () => void }) {
  const { state, dispatch } = useContext(TypingContext)!
  const [wordState, wordDispatch] = useReducer(wordReducer, structuredClone(initialWordState))

  // 迁移 jotai 状态到 zustand
  const wordDictationConfig = useTypingConfigStore(s => s.wordDictationConfig)
  const isTextSelectable = useTypingConfigStore(s => s.isTextSelectable)
  const isIgnoreCase = useTypingConfigStore(s => s.isIgnoreCase)
  const isShowAnswerOnHover = useTypingConfigStore(s => s.isShowAnswerOnHover)
  const pronunciationIsOpen = useTypingConfigStore(s => s.pronunciationConfig.isOpen)
  const currentDictInfo = useDictStore(getCurrentDictInfo)
  const currentLanguage = currentDictInfo?.language || 'en'
  const currentLanguageCategory = (currentDictInfo as any)?.languageCategory || 'en'
  const currentChapter = useDictStore(s => s.currentChapter)

  const [playKeySound, playBeepSound, playHintSound] = useKeySounds()
  const [isHoveringWord, setIsHoveringWord] = useState(false)
  const [showTipAlert, setShowTipAlert] = useState(false)
  const wordPronunciationIconRef = useRef<WordPronunciationIconRef>(null)

  useEffect(() => {
    // run only when word changes
    let headword = ''
    try {
      headword = word.name.replace(new RegExp(' ', 'g'), EXPLICIT_SPACE)
      headword = headword.replace(new RegExp('…', 'g'), '..')
    } catch (e) {
      console.error('word.name is not a string', word)
      headword = ''
    }

    wordDispatch({
      type: 'INIT',
      payload: {
        displayWord: headword,
        randomLetterVisible: headword.split('').map(() => Math.random() > 0.4)
      }
    })
  }, [word])

  const updateInput = useCallback(
    (updateAction: WordUpdateAction) => {
      switch (updateAction.type) {
        case 'add':
          if (wordState.hasWrong) return

          if (updateAction.value === ' ') {
            updateAction.event.preventDefault()
            wordDispatch({
              type: 'INPUT_UPDATE',
              payload: wordState.inputWord + EXPLICIT_SPACE
            })
          } else {
            wordDispatch({
              type: 'INPUT_UPDATE',
              payload: wordState.inputWord + updateAction.value
            })
          }
          break

        default:
          console.warn('unknown update type', updateAction)
      }
    },
    [wordState.hasWrong, wordState.inputWord],
  )

  const handleHoverWord = useCallback((checked: boolean) => {
    setIsHoveringWord(checked)
  }, [])

  useHotkeys(
    'tab',
    () => {
      handleHoverWord(true)
    },
    { enableOnFormTags: true, preventDefault: true },
    [],
  )

  useHotkeys(
    'tab',
    () => {
      handleHoverWord(false)
    },
    { enableOnFormTags: true, keyup: true, preventDefault: true },
    [],
  )
  useHotkeys(
    'ctrl+j',
    () => {
      if (state.isTyping) {
        wordPronunciationIconRef.current?.play()
      }
    },
    [state.isTyping],
    { enableOnFormTags: true, preventDefault: true },
  )

  useEffect(() => {
    if (wordState.inputWord.length === 0 && state.isTyping) {
      wordPronunciationIconRef.current?.play && wordPronunciationIconRef.current?.play()
    }
  }, [state.isTyping, wordState.inputWord.length, wordPronunciationIconRef.current?.play])

  const getLetterVisible = useCallback(
    (index: number) => {
      if (wordState.letterStates[index] === 'correct' || (isShowAnswerOnHover && isHoveringWord)) return true

      if (wordDictationConfig.isOpen) {
        if (wordDictationConfig.type === 'hideAll') return false

        const letter = wordState.displayWord[index]
        if (wordDictationConfig.type === 'hideVowel') {
          return vowelLetters.includes(letter.toUpperCase()) ? false : true
        }
        if (wordDictationConfig.type === 'hideConsonant') {
          return vowelLetters.includes(letter.toUpperCase()) ? true : false
        }
        if (wordDictationConfig.type === 'randomHide') {
          return wordState.randomLetterVisible[index]
        }
      }
      return true
    },
    [
      isHoveringWord,
      isShowAnswerOnHover,
      wordDictationConfig.isOpen,
      wordDictationConfig.type,
      wordState.displayWord,
      wordState.letterStates,
      wordState.randomLetterVisible,
    ],
  )

  useEffect(() => {
    const inputLength = wordState.inputWord.length
    if (wordState.hasWrong || inputLength === 0 || wordState.displayWord.length === 0) {
      return
    }

    const inputChar = wordState.inputWord[inputLength - 1]
    const correctChar = wordState.displayWord[inputLength - 1]
    let isEqual = false
    if (inputChar != undefined && correctChar != undefined) {
      isEqual = isIgnoreCase ? inputChar.toLowerCase() === correctChar.toLowerCase() : inputChar === correctChar
    }

    if (isEqual) {
      if (inputLength >= wordState.displayWord.length) {
        wordDispatch({
          type: 'INPUT_CORRECT',
          payload: { inputLength, isFinished: true }
        })
        playHintSound()
      } else {
        wordDispatch({
          type: 'INPUT_CORRECT',
          payload: { inputLength, isFinished: false }
        })
        playKeySound()
      }
    } else {
      playBeepSound()
      wordDispatch({
        type: 'INPUT_WRONG',
        payload: { inputLength, inputChar }
      })

      if (currentChapter === 0 && state.chapterData.index === 0 && wordState.wrongCount >= 3) {
        setShowTipAlert(true)
      }
    }
  }, [wordState.inputWord])

  useEffect(() => {
    if (wordState.hasWrong) {
      const timer = setTimeout(() => {
        wordDispatch({ type: 'RESET_WRONG_STATE' })
      }, 300)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [wordState.hasWrong])

  useEffect(() => {
    if (wordState.isFinished) {
      dispatch({ type: TypingStateActionType.SET_IS_SAVING_RECORD, payload: true })
      onFinish()
    }
  }, [wordState.isFinished])

  useEffect(() => {
    if (wordState.wrongCount >= 4) {
      dispatch({ type: TypingStateActionType.SET_IS_SKIP, payload: true })
    }
  }, [wordState.wrongCount, dispatch])

  return (
    <>
      <InputHandler updateInput={updateInput} />
      <div
        lang={currentLanguageCategory !== 'code' ? currentLanguageCategory : 'en'}
        className="flex flex-col items-center justify-center pb-1 pt-4"
      >
        {['romaji', 'hapin'].includes(currentLanguage) && word.notation && <Notation notation={word.notation} />}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
                <div
                    className={cn(
                        "relative w-fit bg-transparent p-0 leading-normal shadow-none dark:bg-transparent",
                        wordDictationConfig.isOpen ? "cursor-help" : ""
                    )}
                    onMouseEnter={() => handleHoverWord(true)}
                    onMouseLeave={() => handleHoverWord(false)}
                >
                    <div
                        className={cn(
                            "flex items-center justify-center",
                            isTextSelectable ? "select-all" : "select-none",
                            wordState.hasWrong ? "animate-shake" : ""
                        )}
                    >
                        {wordState.displayWord.split('').map((t, index) => {
                            return <Letter key={`${index}-${t}`} letter={t} visible={getLetterVisible(index)} state={wordState.letterStates[index]} />
                        })}
                    </div>
                    {pronunciationIsOpen && (
                        <div className="absolute -right-12 top-1/2 h-9 w-9 -translate-y-1/2">
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                         <WordPronunciationIcon word={word} lang={currentLanguage} ref={wordPronunciationIconRef} className="h-full w-full" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>快捷键{CTRL} + J</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </div>
            </TooltipTrigger>
            {wordDictationConfig.isOpen && (
                 <TooltipContent>
                    <p>按 Tab 快捷键显示完整单词</p>
                 </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
      <TipAlert className="fixed bottom-10 right-3" show={showTipAlert} setShow={setShowTipAlert} />
    </>
  )
}

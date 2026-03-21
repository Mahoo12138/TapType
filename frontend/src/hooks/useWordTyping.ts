import { useState, useCallback, useRef, useEffect } from 'react'

export type LetterStatus = 'normal' | 'correct' | 'wrong'

export interface WordTypingState {
  displayWord: string
  inputWord: string
  letterStates: LetterStatus[]
  hasWrong: boolean
  isFinished: boolean
  correctCount: number
  wrongCount: number
}

export interface WordTypingStats {
  time: number // seconds
  wpm: number
  accuracy: number
  totalCorrect: number
  totalWrong: number
  wordCount: number
}

const initialWordState: WordTypingState = {
  displayWord: '',
  inputWord: '',
  letterStates: [],
  hasWrong: false,
  isFinished: false,
  correctCount: 0,
  wrongCount: 0,
}

export interface UseWordTypingOptions {
  words: string[]
  onWordComplete?: (index: number, wrongCount: number) => void
  onChapterFinish?: () => void
}

/**
 * Word-by-word typing hook inspired by qwerty-learner.
 * Processes one word at a time, tracks per-letter correctness,
 * auto-resets on error after a brief shake delay.
 */
export function useWordTyping({ words, onWordComplete, onChapterFinish }: UseWordTypingOptions) {
  const [wordIndex, setWordIndex] = useState(0)
  const [wordState, setWordState] = useState<WordTypingState>(initialWordState)
  const [isTyping, setIsTyping] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  // Global stats
  const [timerTime, setTimerTime] = useState(0)
  const totalCorrectRef = useRef(0)
  const totalWrongRef = useRef(0)
  const wordCountRef = useRef(0)

  // Keystroke tracking for backend
  const keystrokesRef = useRef<{ char: string; timestamp: number; isCorrect: boolean }[]>([])
  const keyStatsRef = useRef<Map<string, { hits: number; errors: number; intervals: number[] }>>(new Map())
  const lastKeystrokeTimeRef = useRef(0)

  // Per-word error counts for error_items
  const wordErrorsRef = useRef<Map<number, number>>(new Map())

  // Initialize word state
  useEffect(() => {
    if (words.length === 0) return
    const word = words[0] ?? ''
    setWordIndex(0)
    setIsTyping(false)
    setIsFinished(false)
    setTimerTime(0)
    totalCorrectRef.current = 0
    totalWrongRef.current = 0
    wordCountRef.current = 0
    keystrokesRef.current = []
    keyStatsRef.current = new Map()
    lastKeystrokeTimeRef.current = 0
    wordErrorsRef.current = new Map()
    setWordState({
      displayWord: word,
      inputWord: '',
      letterStates: new Array(word.length).fill('normal'),
      hasWrong: false,
      isFinished: false,
      correctCount: 0,
      wrongCount: 0,
    })
  }, [words])

  // Timer
  useEffect(() => {
    if (!isTyping) return
    const id = window.setInterval(() => setTimerTime((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [isTyping])

  // Process input changes
  useEffect(() => {
    const inputLen = wordState.inputWord.length
    if (
      wordState.hasWrong ||
      inputLen === 0 ||
      wordState.displayWord.length === 0
    )
      return

    const inputChar = wordState.inputWord[inputLen - 1]
    const expected = wordState.displayWord[inputLen - 1]
    const isCorrect = inputChar === expected

    if (isCorrect) {
      totalCorrectRef.current += 1

      if (inputLen >= wordState.displayWord.length) {
        // Finished current word
        setWordState((prev) => ({
          ...prev,
          letterStates: prev.letterStates.map((s, i) => (i === inputLen - 1 ? 'correct' : s)),
          isFinished: true,
        }))
      } else {
        setWordState((prev) => ({
          ...prev,
          letterStates: prev.letterStates.map((s, i) => (i === inputLen - 1 ? 'correct' : s)),
        }))
      }
    } else {
      totalWrongRef.current += 1
      setWordState((prev) => ({
        ...prev,
        letterStates: prev.letterStates.map((s, i) => (i === inputLen - 1 ? 'wrong' : s)),
        hasWrong: true,
        wrongCount: prev.wrongCount + 1,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordState.inputWord])

  // Reset on wrong input (shake effect)
  useEffect(() => {
    if (!wordState.hasWrong) return
    const timer = setTimeout(() => {
      setWordState((prev) => ({
        ...prev,
        inputWord: '',
        letterStates: new Array(prev.displayWord.length).fill('normal'),
        hasWrong: false,
      }))
    }, 300)
    return () => clearTimeout(timer)
  }, [wordState.hasWrong])

  // Move to next word on finish
  useEffect(() => {
    if (!wordState.isFinished) return
    wordCountRef.current += 1
    const currentIdx = wordIndex

    // Track per-word errors
    if (wordState.wrongCount > 0) {
      wordErrorsRef.current.set(currentIdx, wordState.wrongCount)
    }
    onWordComplete?.(currentIdx, wordState.wrongCount)

    if (wordIndex < words.length - 1) {
      // Move to next word
      const nextIdx = wordIndex + 1
      const nextWord = words[nextIdx]
      setWordIndex(nextIdx)
      setWordState({
        displayWord: nextWord,
        inputWord: '',
        letterStates: new Array(nextWord.length).fill('normal'),
        hasWrong: false,
        isFinished: false,
        correctCount: 0,
        wrongCount: 0,
      })
    } else {
      // Chapter complete
      setIsTyping(false)
      setIsFinished(true)
      onChapterFinish?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordState.isFinished])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isFinished) return
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) return
      if (e.key === 'Backspace' || e.key === 'Enter') {
        e.preventDefault()
        return
      }
      if (e.key.length !== 1) return
      if (e.ctrlKey || e.altKey || e.metaKey) return
      e.preventDefault()

      if (!isTyping) {
        setIsTyping(true)
      }

      if (wordState.hasWrong) return

      const now = Date.now()
      const expected = wordState.displayWord[wordState.inputWord.length] ?? ''
      const isCorrect = e.key === expected

      // Record keystroke for backend
      keystrokesRef.current.push({ char: e.key, timestamp: now, isCorrect })

      const keyChar = e.key.toLowerCase()
      const existing = keyStatsRef.current.get(keyChar) || { hits: 0, errors: 0, intervals: [] }
      existing.hits++
      if (!isCorrect) existing.errors++
      if (lastKeystrokeTimeRef.current > 0) {
        existing.intervals.push(now - lastKeystrokeTimeRef.current)
      }
      keyStatsRef.current.set(keyChar, existing)
      lastKeystrokeTimeRef.current = now

      // Update input: the useEffect will handle correctness
      setWordState((prev) => ({
        ...prev,
        inputWord: prev.inputWord + (e.key === ' ' ? ' ' : e.key),
      }))
    },
    [isFinished, isTyping, wordState.hasWrong, wordState.displayWord, wordState.inputWord.length],
  )

  const getStats = useCallback((): WordTypingStats => {
    const totalInput = totalCorrectRef.current + totalWrongRef.current
    const inputSum = totalInput === 0 ? 1 : totalInput
    const accuracy = Math.round((totalCorrectRef.current / inputSum) * 100)
    const wpm = timerTime > 0 ? Math.round((wordCountRef.current / timerTime) * 60) : 0

    return {
      time: timerTime,
      wpm,
      accuracy,
      totalCorrect: totalCorrectRef.current,
      totalWrong: totalWrongRef.current,
      wordCount: wordCountRef.current,
    }
  }, [timerTime])

  const getKeystrokeStats = useCallback(() => {
    const result: { key_char: string; hit_count: number; error_count: number; avg_interval_ms: number }[] = []
    keyStatsRef.current.forEach((v, key) => {
      const avgInterval =
        v.intervals.length > 0
          ? Math.round(v.intervals.reduce((a, b) => a + b, 0) / v.intervals.length)
          : 0
      result.push({ key_char: key, hit_count: v.hits, error_count: v.errors, avg_interval_ms: avgInterval })
    })
    return result
  }, [])

  const getErrorItems = useCallback(
    (contentType: string, contentItems: { id: string; content: string }[]) => {
      const errors: { content_type: string; content_id: string; error_count: number; avg_time_ms: number }[] = []
      wordErrorsRef.current.forEach((errCount, idx) => {
        const item = contentItems[idx]
        if (item && errCount > 0) {
          errors.push({
            content_type: contentType === 'word_bank' ? 'word' : 'sentence',
            content_id: item.id,
            error_count: errCount,
            avg_time_ms: 0,
          })
        }
      })
      return errors
    },
    [],
  )

  const skipWord = useCallback(() => {
    if (isFinished || wordIndex >= words.length - 1) return
    const nextIdx = wordIndex + 1
    const nextWord = words[nextIdx]
    setWordIndex(nextIdx)
    setWordState({
      displayWord: nextWord,
      inputWord: '',
      letterStates: new Array(nextWord.length).fill('normal'),
      hasWrong: false,
      isFinished: false,
      correctCount: 0,
      wrongCount: 0,
    })
  }, [isFinished, wordIndex, words])

  const reset = useCallback(() => {
    if (words.length === 0) return
    const word = words[0] ?? ''
    setWordIndex(0)
    setIsTyping(false)
    setIsFinished(false)
    setTimerTime(0)
    totalCorrectRef.current = 0
    totalWrongRef.current = 0
    wordCountRef.current = 0
    keystrokesRef.current = []
    keyStatsRef.current = new Map()
    lastKeystrokeTimeRef.current = 0
    wordErrorsRef.current = new Map()
    setWordState({
      displayWord: word,
      inputWord: '',
      letterStates: new Array(word.length).fill('normal'),
      hasWrong: false,
      isFinished: false,
      correctCount: 0,
      wrongCount: 0,
    })
  }, [words])

  return {
    wordIndex,
    wordState,
    isTyping,
    isFinished,
    timerTime,
    handleKeyDown,
    getStats,
    getKeystrokeStats,
    getErrorItems,
    skipWord,
    reset,
  }
}

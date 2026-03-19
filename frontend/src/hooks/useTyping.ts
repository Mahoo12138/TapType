import { useState, useCallback, useRef, useEffect } from 'react'

export type CharStatus = 'pending' | 'correct' | 'incorrect' | 'current'

export interface CharState {
  char: string
  status: CharStatus
  timestamp?: number
}

export interface KeystrokeRecord {
  char: string
  timestamp: number
  isCorrect: boolean
}

export interface TypingStats {
  totalChars: number
  correctChars: number
  errorCount: number
  elapsed: number // ms
  wpm: number
  rawWpm: number
  accuracy: number
}

export function useTyping(targetText: string) {
  const [charStates, setCharStates] = useState<CharState[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComposing, setIsComposing] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const keystrokesRef = useRef<KeystrokeRecord[]>([])
  const keyStatsRef = useRef<Map<string, { hits: number; errors: number; intervals: number[] }>>(new Map())
  const lastKeystrokeTimeRef = useRef<number>(0)

  // Initialize char states when target text changes
  useEffect(() => {
    if (!targetText) return
    const states: CharState[] = targetText.split('').map((char) => ({
      char,
      status: 'pending' as CharStatus,
    }))
    if (states.length > 0) {
      states[0].status = 'current'
    }
    setCharStates(states)
    setCurrentIndex(0)
    setIsFinished(false)
    setStartTime(null)
    keystrokesRef.current = []
    keyStatsRef.current = new Map()
    lastKeystrokeTimeRef.current = 0
  }, [targetText])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isComposing || isFinished || !targetText) return
      // Ignore modifier-only keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) return

      // Handle backspace
      if (e.key === 'Backspace') {
        e.preventDefault()
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1
          setCharStates((prev) => {
            const next = [...prev]
            next[currentIndex] = { ...next[currentIndex], status: 'pending' }
            next[newIndex] = { ...next[newIndex], status: 'current' }
            return next
          })
          setCurrentIndex(newIndex)
        }
        return
      }

      // Skip non-printable keys
      if (e.key.length !== 1) return
      e.preventDefault()

      const now = Date.now()
      if (!startTime) setStartTime(now)

      const expectedChar = targetText[currentIndex]
      const isCorrect = e.key === expectedChar

      // Record keystroke
      keystrokesRef.current.push({ char: e.key, timestamp: now, isCorrect })

      // Update key stats
      const keyChar = e.key.toLowerCase()
      const existing = keyStatsRef.current.get(keyChar) || { hits: 0, errors: 0, intervals: [] }
      existing.hits++
      if (!isCorrect) existing.errors++
      if (lastKeystrokeTimeRef.current > 0) {
        existing.intervals.push(now - lastKeystrokeTimeRef.current)
      }
      keyStatsRef.current.set(keyChar, existing)
      lastKeystrokeTimeRef.current = now

      const newIndex = currentIndex + 1
      setCharStates((prev) => {
        const next = [...prev]
        next[currentIndex] = {
          ...next[currentIndex],
          status: isCorrect ? 'correct' : 'incorrect',
          timestamp: now,
        }
        if (newIndex < next.length) {
          next[newIndex] = { ...next[newIndex], status: 'current' }
        }
        return next
      })
      setCurrentIndex(newIndex)

      // Check if finished
      if (newIndex >= targetText.length) {
        setIsFinished(true)
      }
    },
    [isComposing, isFinished, targetText, currentIndex, startTime],
  )

  const onCompositionStart = useCallback(() => setIsComposing(true), [])
  const onCompositionEnd = useCallback(() => setIsComposing(false), [])

  const getStats = useCallback((): TypingStats => {
    const keystrokes = keystrokesRef.current
    const totalChars = keystrokes.length
    const correctChars = keystrokes.filter((k) => k.isCorrect).length
    const errorCount = totalChars - correctChars
    const elapsed = totalChars > 0 && startTime ? Date.now() - startTime : 0
    const minutes = elapsed / 60000

    const rawWpm = minutes > 0 ? totalChars / 5 / minutes : 0
    const wpm = minutes > 0 ? Math.max(0, rawWpm - errorCount / minutes) : 0
    const accuracy = totalChars > 0 ? correctChars / totalChars : 1

    return {
      totalChars,
      correctChars,
      errorCount,
      elapsed,
      wpm: Math.round(wpm * 10) / 10,
      rawWpm: Math.round(rawWpm * 10) / 10,
      accuracy: Math.round(accuracy * 1000) / 1000,
    }
  }, [startTime])

  const getKeystrokeStats = useCallback(() => {
    const result: { key_char: string; hit_count: number; error_count: number; avg_interval_ms: number }[] = []
    keyStatsRef.current.forEach((v, key) => {
      const avgInterval = v.intervals.length > 0 ? Math.round(v.intervals.reduce((a, b) => a + b, 0) / v.intervals.length) : 0
      result.push({ key_char: key, hit_count: v.hits, error_count: v.errors, avg_interval_ms: avgInterval })
    })
    return result
  }, [])

  const getErrorItems = useCallback(
    (contentType: string, contentItems: { id: string; content: string }[]) => {
      // Find which content items had errors
      const errors: { content_type: string; content_id: string; error_count: number; avg_time_ms: number }[] = []
      // For word mode: each word is a segment. For sentence mode: the whole sentence is one item.
      if (contentType === 'word_bank' && contentItems.length > 0) {
        let offset = 0
        for (const item of contentItems) {
          const len = item.content.length
          const relevantKeystrokes = keystrokesRef.current.filter(
            (_, idx) => idx >= offset && idx < offset + len,
          )
          const errCount = relevantKeystrokes.filter((k) => !k.isCorrect).length
          if (errCount > 0) {
            const avgTime =
              relevantKeystrokes.length > 0
                ? Math.round(
                    relevantKeystrokes.reduce((sum, k, i) => {
                      if (i === 0) return 0
                      return sum + (k.timestamp - relevantKeystrokes[i - 1].timestamp)
                    }, 0) / Math.max(1, relevantKeystrokes.length - 1),
                  )
                : 0
            errors.push({
              content_type: 'word',
              content_id: item.id,
              error_count: errCount,
              avg_time_ms: avgTime,
            })
          }
          offset += len + 1 // +1 for space separator
        }
      }
      return errors
    },
    [],
  )

  const reset = useCallback(() => {
    if (!targetText) return
    const states: CharState[] = targetText.split('').map((char) => ({
      char,
      status: 'pending' as CharStatus,
    }))
    if (states.length > 0) states[0].status = 'current'
    setCharStates(states)
    setCurrentIndex(0)
    setIsFinished(false)
    setStartTime(null)
    keystrokesRef.current = []
    keyStatsRef.current = new Map()
    lastKeystrokeTimeRef.current = 0
  }, [targetText])

  return {
    charStates,
    currentIndex,
    isFinished,
    startTime,
    handleKeyDown,
    onCompositionStart,
    onCompositionEnd,
    getStats,
    getKeystrokeStats,
    getErrorItems,
    reset,
  }
}

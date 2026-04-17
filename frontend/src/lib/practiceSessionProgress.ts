export interface PracticeSessionProgress {
  version: 1
  wordIndex: number
  timerTime: number
  totalCorrect: number
  totalWrong: number
  wordCount: number
  keyStats: Array<{
    keyChar: string
    hits: number
    errors: number
    intervalSum: number
    intervalCount: number
  }>
  wordErrors: Array<{
    index: number
    errorCount: number
  }>
}

const STORAGE_KEY_PREFIX = 'practice-session-progress:'

function getStorageKey(sessionId: string) {
  return `${STORAGE_KEY_PREFIX}${sessionId}`
}

export function loadPracticeSessionProgress(sessionId: string | null | undefined): PracticeSessionProgress | null {
  if (!sessionId || typeof window === 'undefined') return null

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(sessionId))
    if (!rawValue) return null

    const parsed = JSON.parse(rawValue) as Partial<PracticeSessionProgress>
    if (parsed.version !== 1) return null
    if (
      typeof parsed.wordIndex !== 'number' ||
      typeof parsed.timerTime !== 'number' ||
      typeof parsed.totalCorrect !== 'number' ||
      typeof parsed.totalWrong !== 'number' ||
      typeof parsed.wordCount !== 'number' ||
      !Array.isArray(parsed.keyStats) ||
      !Array.isArray(parsed.wordErrors)
    ) {
      return null
    }

    return {
      version: 1,
      wordIndex: parsed.wordIndex,
      timerTime: parsed.timerTime,
      totalCorrect: parsed.totalCorrect,
      totalWrong: parsed.totalWrong,
      wordCount: parsed.wordCount,
      keyStats: parsed.keyStats,
      wordErrors: parsed.wordErrors,
    }
  } catch {
    return null
  }
}

export function savePracticeSessionProgress(sessionId: string | null | undefined, progress: PracticeSessionProgress) {
  if (!sessionId || typeof window === 'undefined') return
  window.localStorage.setItem(getStorageKey(sessionId), JSON.stringify(progress))
}

export function clearPracticeSessionProgress(sessionId: string | null | undefined) {
  if (!sessionId || typeof window === 'undefined') return
  window.localStorage.removeItem(getStorageKey(sessionId))
}
/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Play,
  RotateCcw,
  SkipForward,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'
import { useWordBanks } from '@/api/wordBanks'
import { useSentenceBanks } from '@/api/sentenceBanks'
import { useCompletePractice, useCreateSession, useSessions } from '@/api/practice'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useWordTyping } from '@/hooks/useWordTyping'
import { AchievementToast } from '@/components/AchievementToast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Achievement, SessionWithContent } from '@/types/api'

export const Route = createFileRoute('/practice')({
  component: Practice,
})

function Practice() {
  const [mode, setMode] = useState('normal')
  const [sourceType, setSourceType] = useState<'word_bank' | 'sentence_bank'>('word_bank')
  const [sourceId, setSourceId] = useState('')
  const [itemCount, setItemCount] = useState(20)

  const [activeSession, setActiveSession] = useState<SessionWithContent | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [createError, setCreateError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const dismissAchievements = useCallback(() => setNewAchievements([]), [])

  const { data: wordBanks = [] } = useWordBanks()
  const { data: sentenceBanks = [] } = useSentenceBanks()
  const { data: recentSessions } = useSessions(1, 6)

  const createSession = useCreateSession()
  const completePractice = useCompletePractice()

  const textItems = useMemo(() => {
    if (!activeSession) return []
    if (activeSession.words) return activeSession.words.map((w) => ({ id: w.id, content: w.content }))
    if (activeSession.sentences) return activeSession.sentences.map((s) => ({ id: s.id, content: s.content }))
    return []
  }, [activeSession])

  const words = useMemo(() => textItems.map((item) => item.content), [textItems])

  const {
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
  } = useWordTyping({ words })

  const { stats: wsStats, connected, error: wsError, send, close } = useWebSocket(
    activeSession?.session.id ?? null,
  )

  useEffect(() => {
    if (!activeSession || submitted) return

    const listener = (e: KeyboardEvent) => {
      const beforeLen = wordState.inputWord.length
      const expected = wordState.displayWord[beforeLen] || ''

      handleKeyDown(e)

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        send({
          type: 'keystroke',
          char: e.key,
          timestamp: Date.now(),
          is_correct: e.key === expected,
        })
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [activeSession, handleKeyDown, send, submitted, wordState.displayWord, wordState.inputWord.length])

  const localStats = getStats()
  const displayStats = {
    wpm: wsStats?.wpm ?? localStats.wpm,
    rawWpm: wsStats?.raw_wpm ?? localStats.wpm,
    accuracy: wsStats?.accuracy ?? localStats.accuracy,
    elapsedMs: wsStats?.elapsed_ms ?? timerTime * 1000,
  }

  const progress = words.length > 0 ? ((wordIndex + (isFinished ? 1 : 0)) / words.length) * 100 : 0
  const prevWord = words[wordIndex - 1] ?? ''
  const nextWord = words[wordIndex + 1] ?? ''

  const startPractice = () => {
    if (!sourceId) return
    setSubmitted(false)
    setCreateError('')
    setSubmitError('')
    createSession.mutate(
      {
        mode,
        source_type: sourceType,
        source_id: sourceId,
        item_count: itemCount,
      },
      {
        onSuccess: (session) => setActiveSession(session),
        onError: (err) => {
          setCreateError(err instanceof Error ? err.message : '创建练习失败，请重试')
        },
      },
    )
  }

  const submitPractice = () => {
    if (!activeSession) return
    const stats = getStats()

    completePractice.mutate(
      {
        sessionId: activeSession.session.id,
        wpm: stats.wpm,
        raw_wpm: stats.wpm,
        accuracy: stats.accuracy / 100,
        error_count: stats.totalWrong,
        char_count: textItems.reduce((sum, item) => sum + item.content.length, 0),
        consistency: 0.9,
        duration_ms: Math.max(1, stats.time * 1000),
        keystroke_stats: getKeystrokeStats(),
        error_items: getErrorItems(sourceType, textItems),
      },
      {
        onSuccess: (data) => {
          setSubmitted(true)
          close()
          if (data.new_achievements?.length) {
            setNewAchievements(data.new_achievements)
          }
        },
        onError: (err) => {
          setSubmitError(err instanceof Error ? err.message : '提交失败，请重试')
        },
      },
    )
  }

  const resetPractice = () => {
    close()
    setActiveSession(null)
    setSubmitted(false)
    setCreateError('')
    setSubmitError('')
    setNewAchievements([])
    reset()
  }

  const selectedWordBank = sourceType === 'word_bank'
    ? (wordBanks.find((b) => b.id === sourceId) ?? null)
    : null

  const currentWordInfo = sourceType === 'word_bank' && activeSession?.words
    ? (activeSession.words[wordIndex] ?? null)
    : null

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <AchievementToast achievements={newAchievements} onDismiss={dismissAchievements} />

      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">打字练习</h1>
        <p className="text-sm text-muted-foreground">按 qwerty-learner 的逐词节奏训练，专注当前词，速度和准确率会更稳定。</p>
      </div>

      {!activeSession && (
        <Card className="mb-6 border-border/70 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle>练习配置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">模式</span>
                <Select value={mode} onValueChange={(v) => setMode(v)}>
                  <SelectTrigger className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">普通打字</SelectItem>
                    <SelectItem value="dictation">默写模式（隐藏字母）</SelectItem>
                    <SelectItem value="recitation">背词模式</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">内容类型</span>
                <Select
                  value={sourceType}
                  onValueChange={(v) => {
                    const next = v as 'word_bank' | 'sentence_bank'
                    setSourceType(next)
                    setSourceId('')
                  }}
                >
                  <SelectTrigger className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="word_bank">词库</SelectItem>
                    <SelectItem value="sentence_bank">句库</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">选择内容库</span>
                <Select value={sourceId || '__none'} onValueChange={(v) => setSourceId(v === '__none' ? '' : v)}>
                  <SelectTrigger className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">请选择</SelectItem>
                    {sourceType === 'word_bank'
                      ? wordBanks.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name} ({b.word_count})
                          </SelectItem>
                        ))
                      : sentenceBanks.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name} ({b.sentence_count})
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">条目数量</span>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={itemCount}
                  onChange={(e) => setItemCount(Number(e.target.value) || 1)}
                />
              </label>
            </div>

            <Button onClick={startPractice} disabled={!sourceId || createSession.isPending} className="mt-4">
              <Play className="mr-1 h-4 w-4" />
              {createSession.isPending ? '创建中...' : '开始练习'}
            </Button>

            {createError && (
              <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-400">
                {createError}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {activeSession && (
        <section className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                进度 {Math.min(wordIndex + 1, words.length)} / {words.length}
              </div>
              <Badge variant={connected ? 'success' : 'destructive'}>
                {connected ? (
                  <>
                    <Wifi className="mr-1 h-3 w-3" /> 实时连接
                  </>
                ) : (
                  <>
                    <WifiOff className="mr-1 h-3 w-3" /> 已离线
                  </>
                )}
              </Badge>
            </div>
            <Progress value={progress} />
          </div>

          {!isFinished && (
            <Card className="relative overflow-hidden border-border/70 bg-card/80">
              <CardContent className="p-6 md:p-10">
                {!isTyping && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/55 backdrop-blur-sm">
                    <p className="rounded-full border border-border/70 bg-card/90 px-5 py-2 text-sm text-muted-foreground">
                      按任意键 {timerTime > 0 ? '继续' : '开始'}
                    </p>
                  </div>
                )}

                <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="max-w-40 truncate">{prevWord || '...'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="max-w-40 truncate">{nextWord || '...'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>

                <WordPanel
                  word={wordState.displayWord}
                  letterStates={wordState.letterStates}
                  hasWrong={wordState.hasWrong}
                  dictationMode={mode === 'dictation'}
                />

                {currentWordInfo && sourceType === 'word_bank' && (
                  <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <InfoBlock label="音标" value={currentWordInfo.pronunciation || '暂无'} />
                    <InfoBlock label="释义" value={currentWordInfo.definition || '暂无'} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <StatsDock
            wpm={displayStats.wpm}
            accuracy={displayStats.accuracy}
            elapsed={displayStats.elapsedMs}
            typed={localStats.totalCorrect + localStats.totalWrong}
            finishedWords={localStats.wordCount}
            errorCount={localStats.totalWrong}
            wsError={wsError}
          />

          <div className="flex flex-wrap gap-2">
            {!submitted ? (
              <>
                <Button onClick={skipWord} variant="outline" disabled={isFinished || words.length <= 1}>
                  <SkipForward className="mr-1 h-4 w-4" />
                  跳过当前词
                </Button>
                <Button
                  onClick={submitPractice}
                  disabled={!isFinished || completePractice.isPending}
                  variant="secondary"
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  {completePractice.isPending ? '提交中...' : '提交结果'}
                </Button>
              </>
            ) : (
              <Button onClick={resetPractice}>
                <RotateCcw className="mr-1 h-4 w-4" />
                再来一轮
              </Button>
            )}

            {!submitted && (
              <Button onClick={resetPractice} variant="ghost">
                退出练习
              </Button>
            )}
          </div>

          {submitError && (
            <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-400">
              {submitError}
            </p>
          )}

          {isFinished && (
            <ResultCard
              title={selectedWordBank?.name ?? '本轮练习'}
              wpm={displayStats.wpm}
              accuracy={displayStats.accuracy}
              duration={displayStats.elapsedMs}
              errors={localStats.totalWrong}
              onSubmit={submitPractice}
              submitting={completePractice.isPending}
              submitted={submitted}
            />
          )}
        </section>
      )}

      <Card className="mt-6 border-border/70 bg-card/70">
        <CardHeader className="pb-2">
          <CardTitle>最近练习</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentSessions?.list.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm"
              >
                <span className="text-foreground">
                  {session.mode} · {session.source_type}
                </span>
                <span className="text-muted-foreground">
                  {session.result ? `${session.result.wpm.toFixed(1)} WPM` : '未完成'}
                </span>
              </div>
            ))}
            {(recentSessions?.list.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">暂无历史记录</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function WordPanel({
  word,
  letterStates,
  hasWrong,
  dictationMode,
}: {
  word: string
  letterStates: Array<'normal' | 'correct' | 'wrong'>
  hasWrong: boolean
  dictationMode: boolean
}) {
  const revealByState = (idx: number) => letterStates[idx] === 'correct' || letterStates[idx] === 'wrong'

  return (
    <div className="flex min-h-36 items-center justify-center">
      <div className={`flex flex-wrap items-center justify-center gap-0.5 text-center text-4xl font-semibold tracking-wide md:text-5xl ${hasWrong ? 'animate-pulse' : ''}`}>
        {word.split('').map((ch, idx) => {
          const state = letterStates[idx]
          const visible = !dictationMode || revealByState(idx)
          return (
            <span
              key={`${ch}-${idx}`}
              className={`rounded-md px-1.5 py-1 transition-colors ${
                state === 'correct'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : state === 'wrong'
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
                    : 'text-foreground/85'
              }`}
            >
              {visible ? ch : '_'}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function StatsDock({
  wpm,
  accuracy,
  elapsed,
  typed,
  finishedWords,
  errorCount,
  wsError,
}: {
  wpm: number
  accuracy: number
  elapsed: number
  typed: number
  finishedWords: number
  errorCount: number
  wsError: string | null
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-card/70 p-4 md:grid-cols-6">
      <StatTile icon={Clock3} label="时间" value={formatDuration(elapsed)} />
      <StatTile icon={Zap} label="WPM" value={String(wpm)} />
      <StatTile icon={Flag} label="正确率" value={`${accuracy}%`} />
      <StatTile icon={CheckCircle2} label="完成词数" value={String(finishedWords)} />
      <StatTile icon={CheckCircle2} label="输入数" value={String(typed)} />
      <StatTile icon={Wifi} label="错误数" value={String(errorCount)} />
      {wsError && <p className="col-span-2 text-xs text-destructive md:col-span-6">{wsError}</p>}
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
      <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  )
}

function ResultCard({
  title,
  wpm,
  accuracy,
  duration,
  errors,
  onSubmit,
  submitting,
  submitted,
}: {
  title: string
  wpm: number
  accuracy: number
  duration: number
  errors: number
  onSubmit: () => void
  submitting: boolean
  submitted: boolean
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h3 className="mb-1 text-lg font-semibold text-foreground">本轮完成</h3>
      <p className="mb-4 text-sm text-muted-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryItem label="WPM" value={String(wpm)} />
        <SummaryItem label="准确率" value={`${accuracy}%`} />
        <SummaryItem label="用时" value={formatDuration(duration)} />
        <SummaryItem label="错误数" value={String(errors)} />
      </div>
      {!submitted && (
        <Button onClick={onSubmit} disabled={submitting} className="mt-4">
          <CheckCircle2 className="mr-1 h-4 w-4" />
          {submitting ? '提交中...' : '提交成绩'}
        </Button>
      )}
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="line-clamp-2 text-sm text-foreground">{value}</p>
    </div>
  )
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  const rem = sec % 60
  const mm = String(min).padStart(2, '0')
  const ss = String(rem).padStart(2, '0')
  return `${mm}:${ss}`
}

import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  CheckCircle2,
  Clock3,
  Keyboard,
  Play,
  RotateCcw,
  Signal,
  Target,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useWordBanks } from '@/api/wordBanks'
import { useSentenceBanks } from '@/api/sentenceBanks'
import { useCompletePractice, useCreateSession, useSessions } from '@/api/practice'
import { useTyping } from '@/hooks/useTyping'
import { useWebSocket } from '@/hooks/useWebSocket'
import { AchievementToast } from '@/components/AchievementToast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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
  const [submitError, setSubmitError] = useState('')
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const dismissAchievements = useCallback(() => setNewAchievements([]), [])

  const { data: wordBanks = [] } = useWordBanks()
  const { data: sentenceBanks = [] } = useSentenceBanks()
  const { data: recentSessions } = useSessions(1, 5)

  const createSession = useCreateSession()
  const completePractice = useCompletePractice()

  const textItems = useMemo(() => {
    if (!activeSession) return []
    if (activeSession.words) return activeSession.words.map((w) => ({ id: w.id, content: w.content }))
    if (activeSession.sentences) return activeSession.sentences.map((s) => ({ id: s.id, content: s.content }))
    return []
  }, [activeSession])

  const targetText = useMemo(() => {
    if (!activeSession) return ''
    if (activeSession.words) return activeSession.words.map((w) => w.content).join(' ')
    if (activeSession.sentences) return activeSession.sentences.map((s) => s.content).join(' ')
    return ''
  }, [activeSession])

  const {
    charStates,
    isFinished,
    handleKeyDown,
    onCompositionStart,
    onCompositionEnd,
    getStats,
    getKeystrokeStats,
    getErrorItems,
    reset,
  } = useTyping(targetText)

  const { stats: wsStats, connected, error: wsError, send, close } = useWebSocket(
    activeSession?.session.id ?? null,
  )

  useEffect(() => {
    if (!activeSession || submitted) return

    const listener = (e: KeyboardEvent) => {
      const before = getStats().totalChars
      handleKeyDown(e)
      if (e.key.length === 1) {
        const expected = targetText[before] || ''
        send({
          type: 'keystroke',
          char: e.key,
          timestamp: Date.now(),
          is_correct: e.key === expected,
        })
      }
    }

    const compStart = () => onCompositionStart()
    const compEnd = () => onCompositionEnd()

    window.addEventListener('keydown', listener)
    window.addEventListener('compositionstart', compStart)
    window.addEventListener('compositionend', compEnd)

    return () => {
      window.removeEventListener('keydown', listener)
      window.removeEventListener('compositionstart', compStart)
      window.removeEventListener('compositionend', compEnd)
    }
  }, [
    activeSession,
    getStats,
    handleKeyDown,
    onCompositionEnd,
    onCompositionStart,
    send,
    submitted,
    targetText,
  ])

  const localStats = getStats()
  const displayStats = {
    wpm: wsStats?.wpm ?? localStats.wpm,
    rawWpm: wsStats?.raw_wpm ?? localStats.rawWpm,
    accuracy: wsStats?.accuracy ?? Number((localStats.accuracy * 100).toFixed(2)),
    elapsed: wsStats?.elapsed_ms ?? localStats.elapsed,
  }

  const startPractice = () => {
    if (!sourceId) return
    setSubmitted(false)
    setSubmitError('')
    createSession.mutate(
      {
        mode,
        source_type: sourceType,
        source_id: sourceId,
        item_count: itemCount,
      },
      { onSuccess: (session) => setActiveSession(session) },
    )
  }

  const submitPractice = () => {
    if (!activeSession) return
    const stats = getStats()
    completePractice.mutate(
      {
        sessionId: activeSession.session.id,
        wpm: stats.wpm,
        raw_wpm: stats.rawWpm,
        accuracy: stats.accuracy,
        error_count: stats.errorCount,
        char_count: targetText.length,
        consistency: 0.9,
        duration_ms: Math.max(1, stats.elapsed),
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
    setSubmitError('')
    setNewAchievements([])
    reset()
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <AchievementToast achievements={newAchievements} onDismiss={dismissAchievements} />
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          打字练习
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          选择内容源，开始专注训练并实时查看速度与准确率。
        </p>
      </div>

      {!activeSession && (
        <Card className="mb-6">
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
                  <SelectItem value="recitation">背词模式</SelectItem>
                  <SelectItem value="dictation">默写模式</SelectItem>
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
                onChange={(e) => setItemCount(Number(e.target.value))}
              />
            </label>
          </div>

          <Button
            onClick={startPractice}
            disabled={!sourceId || createSession.isPending}
            className="mt-4"
          >
            <Play className="h-4 w-4" />
            {createSession.isPending ? '创建中...' : '开始练习'}
          </Button>
          </CardContent>
        </Card>
      )}

      {activeSession && (
        <section className="space-y-4">
          <StatsBar
            connected={connected}
            wsError={wsError}
            wpm={displayStats.wpm}
            rawWpm={displayStats.rawWpm}
            accuracy={displayStats.accuracy}
            elapsed={displayStats.elapsed}
          />

          <Card>
            <CardContent className="p-6">
            <CharDisplay charStates={charStates} />
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {!submitted ? (
              <Button
                onClick={submitPractice}
                disabled={!isFinished || completePractice.isPending}
                variant="secondary"
              >
                <CheckCircle2 className="h-4 w-4" />
                {completePractice.isPending ? '提交中...' : '提交结果'}
              </Button>
            ) : (
              <Button
                onClick={resetPractice}
              >
                <RotateCcw className="h-4 w-4" />
                再来一轮
              </Button>
            )}
            {!submitted && (
              <Button
                onClick={resetPractice}
                variant="outline"
              >
                退出练习
              </Button>
            )}
          </div>

          {submitError && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {submitError}
            </p>
          )}

          {submitted && (
            <SummaryCard
              wpm={displayStats.wpm}
              accuracy={displayStats.accuracy}
              duration={displayStats.elapsed}
              errors={localStats.errorCount}
            />
          )}
        </section>
      )}

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle>最近练习</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="space-y-2">
          {recentSessions?.list.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
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

function StatsBar({
  connected,
  wsError,
  wpm,
  rawWpm,
  accuracy,
  elapsed,
}: {
  connected: boolean
  wsError: string | null
  wpm: number
  rawWpm: number
  accuracy: number
  elapsed: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-5">
      <StatTile label="连接" value={connected ? '在线' : '离线'} icon={connected ? Wifi : WifiOff} badgeVariant={connected ? 'success' : 'destructive'} />
      <StatTile label="净 WPM" value={wpm.toFixed(1)} icon={Signal} />
      <StatTile label="原始 WPM" value={rawWpm.toFixed(1)} icon={Keyboard} />
      <StatTile label="准确率" value={`${accuracy.toFixed(2)}%`} icon={Target} />
      <StatTile label="用时" value={formatDuration(elapsed)} icon={Clock3} />
      {wsError && (
        <p className="col-span-2 text-xs text-destructive md:col-span-5">{wsError}</p>
      )}
    </div>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
  badgeVariant,
}: {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
  badgeVariant?: 'success' | 'destructive'
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      {label === '连接' ? <Badge variant={badgeVariant}>{value}</Badge> : <p className="text-base font-semibold text-foreground">{value}</p>}
    </div>
  )
}

function CharDisplay({ charStates }: { charStates: { char: string; status: string }[] }) {
  return (
    <div className="select-none font-mono text-lg leading-9 tracking-wide">
      {charStates.map((item, idx) => (
        <span
          key={`${item.char}-${idx}`}
          className={`rounded px-0.5 ${
            item.status === 'correct'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : item.status === 'incorrect'
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : item.status === 'current'
                  ? 'border-b-2 border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {item.char === ' ' ? '\u00A0' : item.char}
        </span>
      ))}
    </div>
  )
}

function SummaryCard({
  wpm,
  accuracy,
  duration,
  errors,
}: {
  wpm: number
  accuracy: number
  duration: number
  errors: number
}) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
      <h3 className="mb-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">练习完成</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryItem label="净 WPM" value={wpm.toFixed(1)} />
        <SummaryItem label="准确率" value={`${accuracy.toFixed(2)}%`} />
        <SummaryItem label="用时" value={formatDuration(duration)} />
        <SummaryItem label="错误数" value={String(errors)} />
      </div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-200/70 bg-white/70 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">{label}</p>
      <p className="text-base font-semibold text-emerald-800 dark:text-emerald-200">{value}</p>
    </div>
  )
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  const rem = sec % 60
  return `${min}m ${rem}s`
}

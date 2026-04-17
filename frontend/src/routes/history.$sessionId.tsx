import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Play, RotateCcw, Trash2, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDiscardSession, useSession } from '@/api/practice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clearPracticeSessionProgress } from '@/lib/practiceSessionProgress'
import type { Sentence, Word } from '@/types/api'

export const Route = createFileRoute('/history/$sessionId')({
  component: HistorySessionDetailPage,
})

function HistorySessionDetailPage() {
  const { sessionId } = Route.useParams()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState('')

  const { data, error, isLoading } = useSession(sessionId)
  const discardSession = useDiscardSession()

  const isCompleted = Boolean(data?.result || data?.session.ended_at)
  const hasContent = (data?.words?.length ?? 0) > 0 || (data?.sentences?.length ?? 0) > 0
  const canResume = Boolean(data && !isCompleted && hasContent)

  const topKeystrokeStats = useMemo(() => {
    if (!data) return []
    return [...data.keystroke_stats]
      .sort((left, right) => right.error_count - left.error_count || right.hit_count - left.hit_count)
      .slice(0, 8)
  }, [data])

  const handleResume = () => {
    void navigate({ to: '/practice', search: { sessionId } })
  }

  const handleDiscard = () => {
    if (!window.confirm('确定要舍弃这条未完成练习吗？舍弃后无法继续恢复。')) {
      return
    }

    setActionError('')
    discardSession.mutate(sessionId, {
      onSuccess: () => {
        clearPracticeSessionProgress(sessionId)
        void navigate({ to: '/history', replace: true })
      },
      onError: (discardError) => {
        setActionError(discardError instanceof Error ? discardError.message : '舍弃练习失败，请重试')
      },
    })
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/history' })}>
              <ArrowLeft className="h-4 w-4" />
              返回记录列表
            </Button>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">练习记录详情</h1>
          <p className="text-sm text-muted-foreground">查看本轮练习内容、结果指标，以及未完成记录的恢复操作。</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: '/practice', search: { sessionId: undefined } })}>
          <RotateCcw className="h-4 w-4" />
          新练习
        </Button>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">加载练习详情中...</CardContent>
        </Card>
      )}

      {!isLoading && error && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-rose-700 dark:text-rose-400">
            {error instanceof Error ? error.message : '加载练习详情失败，请重试'}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && data && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <CardTitle>{formatSessionName(data.session.mode, data.session.source_type, data.session.item_count)}</CardTitle>
                  <Badge variant={isCompleted ? 'success' : 'warning'}>
                    {isCompleted ? '已完成' : '未完成'}
                  </Badge>
                </div>
                <CardDescription>
                  创建于 {new Date(data.session.created_at).toLocaleString('zh-CN')} · 项目数 {data.session.item_count}
                </CardDescription>
              </div>

              {!isCompleted && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleResume} disabled={!canResume}>
                    <Play className="h-4 w-4" />
                    继续练习
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDiscard}
                    disabled={discardSession.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    {discardSession.isPending ? '舍弃中...' : '舍弃练习'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricTile label="状态" value={isCompleted ? '已完成' : '未完成'} />
                <MetricTile label="用时" value={formatDuration(data.session.duration_ms)} />
                <MetricTile label="WPM" value={data.result ? data.result.wpm.toFixed(1) : '-'} />
                <MetricTile label="准确率" value={data.result ? `${(data.result.accuracy * 100).toFixed(1)}%` : '-'} />
              </div>

              {actionError && (
                <p className="mt-4 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-400">
                  {actionError}
                </p>
              )}

              {!hasContent && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-3 text-sm text-amber-700 dark:text-amber-400">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>该记录没有保存可回放的练习内容，当前可以查看结果，但无法恢复原始练习项。</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>练习内容</CardTitle>
              <CardDescription>按本轮练习的原始顺序展示。</CardDescription>
            </CardHeader>
            <CardContent>
              <SessionContentList
                sourceType={data.session.source_type}
                words={data.words ?? []}
                sentences={data.sentences ?? []}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>键位统计</CardTitle>
                <CardDescription>按错误数从高到低展示本轮输入中最需要关注的键位。</CardDescription>
              </CardHeader>
              <CardContent>
                {topKeystrokeStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">当前没有键位统计数据。</p>
                ) : (
                  <div className="space-y-2">
                    {topKeystrokeStats.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-3 py-2">
                        <div>
                          <p className="font-medium text-foreground">{item.key_char}</p>
                          <p className="text-xs text-muted-foreground">平均间隔 {item.avg_interval_ms}ms</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-right text-sm">
                          <div>
                            <p className="text-muted-foreground">命中</p>
                            <p className="font-medium text-foreground">{item.hit_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">错误</p>
                            <p className="font-medium text-foreground">{item.error_count}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>错题记录</CardTitle>
                <CardDescription>显示本轮被记入复习队列的内容。</CardDescription>
              </CardHeader>
              <CardContent>
                {data.error_items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">这轮练习没有写入错题项。</p>
                ) : (
                  <div className="space-y-2">
                    {data.error_items.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-foreground">{item.content || item.content_id}</span>
                          <Badge variant="warning">{item.error_count} 次错误</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          下次复习 {new Date(item.next_review_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionContentList({
  sourceType,
  words,
  sentences,
}: {
  sourceType: string
  words: Word[]
  sentences: Sentence[]
}) {
  if (sourceType === 'word_bank') {
    if (words.length === 0) {
      return <p className="text-sm text-muted-foreground">当前没有可展示的词条内容。</p>
    }

    return (
      <div className="grid gap-2 md:grid-cols-2">
        {words.map((word, index) => (
          <div key={word.id} className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-medium text-foreground">{index + 1}. {word.content}</p>
              <Badge variant="outline">单词</Badge>
            </div>
            <p className="text-xs text-muted-foreground">音标：{word.pronunciation || '暂无'}</p>
            <p className="mt-1 text-sm text-foreground/80">释义：{word.definition || '暂无'}</p>
          </div>
        ))}
      </div>
    )
  }

  if (sentences.length === 0) {
    return <p className="text-sm text-muted-foreground">当前没有可展示的句子内容。</p>
  }

  return (
    <div className="space-y-2">
      {sentences.map((sentence, index) => (
        <div key={sentence.id} className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="font-medium text-foreground">{index + 1}. {sentence.content}</p>
            <Badge variant="outline">句子</Badge>
          </div>
          <p className="text-sm text-foreground/80">翻译：{sentence.translation || '暂无'}</p>
        </div>
      ))}
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  )
}

function formatModeLabel(mode: string) {
  switch (mode) {
    case 'dictation':
      return '默写模式'
    case 'recitation':
      return '背词模式'
    default:
      return '普通打字'
  }
}

function formatSourceLabel(sourceType: string) {
  return sourceType === 'sentence_bank' ? '句库练习' : '词库练习'
}

function formatSessionName(mode: string, sourceType: string, itemCount: number) {
  return `${formatModeLabel(mode)}-${formatSourceLabel(sourceType)} · ${itemCount}项`
}

function formatDuration(durationMs: number | null | undefined) {
  if (!durationMs) return '-'
  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}
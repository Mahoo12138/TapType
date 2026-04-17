import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { Clock3, ListChecks, ChevronLeft, ChevronRight, Eye, Play, Trash2 } from 'lucide-react'
import { useDiscardSession, useSessions } from '@/api/practice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { clearPracticeSessionProgress } from '@/lib/practiceSessionProgress'

export const Route = createFileRoute('/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const [page, setPage] = useState(1)
  const [discardingSessionId, setDiscardingSessionId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const pageSize = 10
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname !== '/history') {
    return <Outlet />
  }

  const { data, isLoading } = useSessions(page, pageSize)
  const discardSession = useDiscardSession()
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const openSessionDetail = useCallback((sessionId: string) => {
    void navigate({ to: '/history/$sessionId', params: { sessionId } })
  }, [navigate])

  const resumeSession = useCallback((sessionId: string) => {
    void navigate({ to: '/practice', search: { sessionId } })
  }, [navigate])

  const discardPendingSession = useCallback((sessionId: string) => {
    if (!window.confirm('确定要舍弃这条未完成练习吗？舍弃后无法继续恢复。')) {
      return
    }

    setActionError('')
    setDiscardingSessionId(sessionId)
    discardSession.mutate(sessionId, {
      onSuccess: () => {
        clearPracticeSessionProgress(sessionId)
        setDiscardingSessionId(null)
      },
      onError: (err) => {
        setDiscardingSessionId(null)
        setActionError(err instanceof Error ? err.message : '舍弃练习失败，请重试')
      },
    })
  }, [discardSession])

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        练习记录
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        查看历史练习结果，回顾你的速度与稳定性。
      </p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>记录列表</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <ListChecks className="h-4 w-4" />
            <span>共 {total} 条记录</span>
          </div>
          <Button
            onClick={() => navigate({ to: '/practice', search: { sessionId: undefined } })}
          >
            新练习
          </Button>
        </div>

        {isLoading && <p className="text-sm text-slate-500 dark:text-slate-400">加载中...</p>}

        {actionError && (
          <p className="mb-4 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-400">
            {actionError}
          </p>
        )}

        {!isLoading && (data?.list.length ?? 0) === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            还没有练习记录，先去完成第一轮训练。
          </div>
        )}

        <div className="space-y-2">
          {data?.list.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200/60 bg-white/70 px-4 py-3 md:grid-cols-[minmax(0,1fr)_120px_140px_90px] md:items-center dark:border-slate-800/60 dark:bg-slate-900/70"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatSessionName(item.mode, item.source_type, item.item_count)}
                  </p>
                  <Badge variant={item.result || item.ended_at ? 'success' : 'warning'}>
                    {item.result || item.ended_at ? '已完成' : '未完成'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(item.created_at).toLocaleString('zh-CN')}
                </p>
              </div>

              <div className="text-right text-sm tabular-nums text-slate-600 dark:text-slate-300">
                {item.result ? `WPM ${item.result.wpm.toFixed(1)}` : '未完成'}
              </div>

              <div className="text-right text-sm tabular-nums text-slate-600 dark:text-slate-300">
                {item.result ? `准确率 ${(item.result.accuracy * 100).toFixed(1)}%` : '-'}
              </div>

              <div className="flex items-center justify-end gap-1 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                <Clock3 className="h-4 w-4" />
                <span>{item.duration_ms ? `${Math.floor(item.duration_ms / 1000)}s` : '-'}</span>
              </div>

              <div className="flex flex-wrap gap-2 md:col-span-4 md:justify-end">
                <Button variant="outline" size="sm" onClick={() => openSessionDetail(item.id)}>
                  <Eye className="h-4 w-4" />
                  查看
                </Button>
                {!item.result && !item.ended_at && (
                  <>
                    <Button size="sm" onClick={() => resumeSession(item.id)}>
                      <Play className="h-4 w-4" />
                      继续
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => discardPendingSession(item.id)}
                      disabled={discardingSessionId === item.id}
                    >
                      <Trash2 className="h-4 w-4" />
                      {discardingSessionId === item.id ? '舍弃中...' : '舍弃'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            第 {page} / {totalPages} 页
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-3.5 w-3.5" />上一页
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              variant="outline"
              size="sm"
            >
              下一页<ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatSessionName(mode: string, sourceType: string, itemCount: number) {
  return `【${formatModeLabel(mode)}】【${formatSourceLabel(sourceType)}】【${itemCount}项】`
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

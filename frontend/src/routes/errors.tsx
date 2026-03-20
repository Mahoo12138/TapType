import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useErrors, useReviewQueue, useCreateReviewSession } from '@/api/errors'
import {
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap,
  Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/errors')({
  component: ErrorsPage,
})

function ErrorsPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const { data: errors, isLoading } = useErrors(page, pageSize)
  const { data: queue } = useReviewQueue(50)
  const createSession = useCreateReviewSession()
  const navigate = useNavigate()

  const totalPages = errors ? Math.ceil(errors.total / pageSize) : 0
  const reviewCount = queue?.total ?? 0

  const handleReview = () => {
    createSession.mutate(20, {
      onSuccess: (data) => {
        if (data.session) {
          // In Phase 4, navigate to the review practice session
          // For now, show feedback that session was created
          navigate({ to: '/practice' })
        }
      },
    })
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            错题集
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            SM-2 算法智能安排复习时间
          </p>
        </div>
        {reviewCount > 0 && (
          <Button
            onClick={handleReview}
            disabled={createSession.isPending}
          >
            <Zap className="h-4 w-4" />
            一键强化（{reviewCount}）
          </Button>
        )}
      </div>

      {/* Review queue reminder */}
      {reviewCount > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50/80 px-5 py-3 dark:border-amber-800/40 dark:bg-amber-950/30">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            你有 <strong>{reviewCount}</strong> 个词到了复习时间，点击「一键强化」开始复习。
          </p>
        </div>
      )}

      {/* Error list */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-slate-400">加载中…</div>
      ) : !errors || errors.list.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-900/80">
                  <th className="px-5 py-3 font-medium text-slate-600 dark:text-slate-400">内容</th>
                  <th className="px-5 py-3 font-medium text-slate-600 dark:text-slate-400">类型</th>
                  <th className="px-5 py-3 font-medium text-slate-600 dark:text-slate-400">错误次数</th>
                  <th className="px-5 py-3 font-medium text-slate-600 dark:text-slate-400">下次复习</th>
                  <th className="px-5 py-3 font-medium text-slate-600 dark:text-slate-400">难度</th>
                </tr>
              </thead>
              <tbody>
                {errors.list.map((err) => (
                  <tr
                    key={err.id}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60 dark:border-slate-800/40 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3 font-mono text-slate-900 dark:text-slate-100">
                      {err.content || err.content_id}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary">
                        {err.content_type === 'word' ? '单词' : '句子'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      {err.error_count}
                    </td>
                    <td className="px-5 py-3">
                      <ReviewTime date={err.next_review_at} />
                    </td>
                    <td className="px-5 py-3">
                      <DifficultyBadge ef={err.easiness_factor} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                共 {errors.total} 条，第 {page}/{totalPages} 页
              </p>
              <div className="flex gap-1">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  variant="outline"
                  size="icon"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  variant="outline"
                  size="icon"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Inbox className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" strokeWidth={1.2} />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        暂无错题记录
      </p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        完成练习后，错误的词会自动收集到这里
      </p>
    </div>
  )
}

function ReviewTime({ date }: { date: string }) {
  const now = new Date()
  const review = new Date(date)
  const isDue = review <= now

  if (isDue) {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <Clock className="h-3.5 w-3.5" />
        待复习
      </span>
    )
  }

  const diffMs = review.getTime() - now.getTime()
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffH / 24)
  const label = diffD > 0 ? `${diffD}天后` : `${diffH}小时后`

  return (
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
  )
}

function DifficultyBadge({ ef }: { ef: number }) {
  let label: string
  let cls: string
  if (ef >= 2.5) {
    label = '简单'
    cls = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
  } else if (ef >= 1.8) {
    label = '中等'
    cls = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
  } else {
    label = '困难'
    cls = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
  }
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

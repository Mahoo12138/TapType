import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Clock3, ListChecks, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSessions } from '@/api/practice'

export const Route = createFileRoute('/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const navigate = useNavigate()

  const { data, isLoading } = useSessions(page, pageSize)
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        练习记录
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        查看历史练习结果，回顾你的速度与稳定性。
      </p>

      <section className="rounded-xl border border-slate-200/70 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/80">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <ListChecks className="h-4 w-4" />
            <span>共 {total} 条记录</span>
          </div>
          <button
            onClick={() => navigate({ to: '/practice' })}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            新练习
          </button>
        </div>

        {isLoading && <p className="text-sm text-slate-500 dark:text-slate-400">加载中...</p>}

        {!isLoading && (data?.list.length ?? 0) === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            还没有练习记录，先去完成第一轮训练。
          </div>
        )}

        <div className="space-y-2">
          {data?.list.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200/60 bg-white/70 px-4 py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center dark:border-slate-800/60 dark:bg-slate-900/70"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {item.mode} · {item.source_type}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(item.created_at).toLocaleString('zh-CN')}
                </p>
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300">
                {item.result ? `WPM ${item.result.wpm.toFixed(1)}` : '未完成'}
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300">
                {item.result ? `准确率 ${(item.result.accuracy * 100).toFixed(1)}%` : '-'}
              </div>

              <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <Clock3 className="h-4 w-4" />
                <span>{item.duration_ms ? `${Math.floor(item.duration_ms / 1000)}s` : '-'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            第 {page} / {totalPages} 页
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />上一页
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              下一页<ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

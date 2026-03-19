import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { useDaily } from '@/api/daily'
import { useSummary } from '@/api/analysis'
import { useReviewQueue } from '@/api/errors'
import { useGoals } from '@/api/goals'
import {
  Keyboard,
  Flame,
  AlertCircle,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Award,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  if (!user) {
    navigate({ to: '/login' })
    return null
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        欢迎回来，{user.username}
      </h1>
      <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
        继续今天的练习，保持进步
      </p>

      <TodaySection />
      <GoalsOverview />
      <SummarySection />
      <QuickActions />
    </div>
  )
}

function TodaySection() {
  const { data: daily } = useDaily()
  const { data: queue } = useReviewQueue(50)

  const reviewCount = queue?.total ?? 0

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="今日练习"
        value={`${daily?.practice_count ?? 0} 次`}
        icon={Keyboard}
        accent="indigo"
      />
      <StatCard
        label="连续打卡"
        value={`${daily?.streak_day ?? 0} 天`}
        icon={Flame}
        accent="orange"
      />
      <StatCard
        label="今日用时"
        value={formatDuration(daily?.total_duration_ms ?? 0)}
        icon={Clock}
        accent="sky"
      />
      <StatCard
        label="待复习"
        value={`${reviewCount} 个`}
        icon={AlertCircle}
        accent={reviewCount > 0 ? 'rose' : 'emerald'}
      />
    </div>
  )
}

function SummarySection() {
  const { data: summary } = useSummary()

  if (!summary) return null

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        累计统计
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="总练习次数" value={String(summary.total_sessions)} icon={Zap} />
        <MiniStat label="最佳 WPM" value={summary.best_wpm.toFixed(1)} icon={TrendingUp} />
        <MiniStat label="平均准确率" value={`${(summary.avg_accuracy * 100).toFixed(1)}%`} icon={Target} />
        <MiniStat label="最长连续" value={`${summary.longest_streak} 天`} icon={Award} />
      </div>
    </div>
  )
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  duration: '练习时长',
  wpm: '平均 WPM',
  accuracy: '准确率',
  practice_count: '练习次数',
}

function GoalsOverview() {
  const { data: goals = [] } = useGoals()
  const navigate = useNavigate()
  const active = goals.filter((g) => g.is_active === 1)

  if (active.length === 0) return null

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">今日目标</h2>
        <button
          onClick={() => navigate({ to: '/goals' })}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          管理目标 →
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {active.slice(0, 3).map((goal) => {
          const progress = goal.target_value > 0
            ? Math.min(100, (goal.current_value / goal.target_value) * 100)
            : 0
          const done = progress >= 100
          return (
            <div
              key={goal.id}
              className="rounded-xl border border-slate-200/60 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {GOAL_TYPE_LABELS[goal.goal_type] ?? goal.goal_type}
                </span>
                {done && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    ✓ 已完成
                  </span>
                )}
              </div>
              <p className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {Math.round(goal.current_value)} / {Math.round(goal.target_value)}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    done ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-indigo-500 dark:bg-indigo-400'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function QuickActions() {
  const navigate = useNavigate()
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
        快速开始
      </h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        选择你想做的事情
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate({ to: '/practice' })}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          开始练习
        </button>
        <button
          onClick={() => navigate({ to: '/errors' })}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          复习错题
        </button>
        <button
          onClick={() => navigate({ to: '/analysis' })}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          查看分析
        </button>
      </div>
    </div>
  )
}

const ACCENT_STYLES = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  icon: LucideIcon
  accent: keyof typeof ACCENT_STYLES
}) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-sm transition-shadow hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`rounded-lg p-2 ${ACCENT_STYLES[accent]}`}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  )
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200/60 bg-white/60 px-4 py-3 dark:border-slate-800/60 dark:bg-slate-900/60">
      <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" strokeWidth={1.8} />
      <div>
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms === 0) return '0 分'
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes} 分`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return `${hours}h ${rem}m`
}

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTrend, useKeymap, useSummary } from '@/api/analysis'
import { useThemeStore } from '@/stores/themeStore'
import KeyboardHeatmap from '@/components/KeyboardHeatmap'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { BarChart3, TrendingUp, Target, Gauge } from 'lucide-react'

export const Route = createFileRoute('/analysis')({
  component: Analysis,
})

type Period = 'day' | 'week' | 'month'

function Analysis() {
  const [period, setPeriod] = useState<Period>('day')
  const [days, setDays] = useState(30)
  const { data: trend } = useTrend(period, days)
  const { data: keymap } = useKeymap()
  const { data: summary } = useSummary()
  const dark = useThemeStore((s) => s.dark)

  const chartData = (trend ?? []).map((p) => ({
    ...p,
    accuracy: +(p.accuracy * 100).toFixed(1),
  }))

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            数据分析
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            追踪你的打字进步
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodPicker value={period} onChange={setPeriod} />
          <DaysPicker value={days} onChange={setDays} />
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SumCard icon={BarChart3} label="总练习" value={`${summary.total_sessions} 次`} />
          <SumCard icon={TrendingUp} label="最佳 WPM" value={summary.best_wpm.toFixed(1)} />
          <SumCard icon={Gauge} label="平均 WPM" value={summary.avg_wpm.toFixed(1)} />
          <SumCard icon={Target} label="平均准确率" value={`${(summary.avg_accuracy * 100).toFixed(1)}%`} />
        </div>
      )}

      {/* WPM trend */}
      <div className="mb-6 rounded-xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          WPM 趋势
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={dark ? '#334155' : '#e2e8f0'}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: dark ? '#94a3b8' : '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: dark ? '#94a3b8' : '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: dark ? '#1e293b' : '#fff',
                  borderColor: dark ? '#334155' : '#e2e8f0',
                  borderRadius: 8,
                  color: dark ? '#e2e8f0' : '#1e293b',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="wpm"
                name="WPM"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="raw_wpm"
                name="Raw WPM"
                stroke="#a78bfa"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accuracy trend */}
      <div className="mb-6 rounded-xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          准确率趋势
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={dark ? '#334155' : '#e2e8f0'}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: dark ? '#94a3b8' : '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: dark ? '#94a3b8' : '#64748b' }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip
                formatter={(v) => `${Number(v)}%`}
                contentStyle={{
                  backgroundColor: dark ? '#1e293b' : '#fff',
                  borderColor: dark ? '#334155' : '#e2e8f0',
                  borderRadius: 8,
                  color: dark ? '#e2e8f0' : '#1e293b',
                }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                name="准确率"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Keyboard heatmap */}
      <div className="rounded-xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
          键位热力图
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          颜色越深，错误率越高。帮助你发现薄弱键位。
        </p>
        <div className="mx-auto max-w-lg">
          <KeyboardHeatmap data={keymap ?? []} dark={dark} />
        </div>
      </div>
    </div>
  )
}

function PeriodPicker({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  const opts: { v: Period; l: string }[] = [
    { v: 'day', l: '日' },
    { v: 'week', l: '周' },
    { v: 'month', l: '月' },
  ]
  return (
    <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.v
              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
          } first:rounded-l-[7px] last:rounded-r-[7px]`}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

function DaysPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const opts = [7, 30, 90]
  return (
    <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
      {opts.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            value === d
              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
          } first:rounded-l-[7px] last:rounded-r-[7px]`}
        >
          {d}天
        </button>
      ))}
    </div>
  )
}

function SumCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <Icon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" strokeWidth={1.8} />
      <div>
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

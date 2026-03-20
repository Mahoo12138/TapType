import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/api/goals'
import { Target, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { UserGoal } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const Route = createFileRoute('/goals')({
  component: GoalsPage,
})

const GOAL_TYPE_LABELS: Record<string, string> = {
  duration: '练习时长（分钟）',
  wpm: '平均 WPM',
  accuracy: '准确率（%）',
  practice_count: '练习次数',
}

const GOAL_TYPE_UNITS: Record<string, string> = {
  duration: '分钟',
  wpm: 'WPM',
  accuracy: '%',
  practice_count: '次',
}

function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            每日目标
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            设定每日练习目标，保持持续进步
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4" />
          添加目标
        </Button>
      </div>

      {showForm && <CreateGoalForm onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">加载中...</p>
      ) : goals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  )
}

function CreateGoalForm({ onClose }: { onClose: () => void }) {
  const createGoal = useCreateGoal()
  const [goalType, setGoalType] = useState('practice_count')
  const [targetValue, setTargetValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(targetValue)
    if (value <= 0) return
    createGoal.mutate(
      { goal_type: goalType, target_value: value, period: 'daily' },
      { onSuccess: () => { onClose() } },
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle>新建目标</CardTitle>
      </CardHeader>
      <CardContent>
      <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="text-slate-500 dark:text-slate-400">目标类型</span>
          <Select value={goalType} onValueChange={(v) => setGoalType(v)}>
            <SelectTrigger className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500 dark:text-slate-400">目标值</span>
          <Input
            type="number"
            min={1}
            step="any"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder={`输入目标 ${GOAL_TYPE_UNITS[goalType]}`}
            required
          />
        </label>
        <div className="flex items-end gap-2">
          <Button
            type="submit"
            disabled={createGoal.isPending}
          >
            {createGoal.isPending ? '创建中...' : '创建'}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
          >
            取消
          </Button>
        </div>
      </div>
      </form>
      </CardContent>
    </Card>
  )
}

function GoalCard({ goal }: { goal: UserGoal }) {
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()

  const progress = goal.target_value > 0
    ? Math.min(100, (goal.current_value / goal.target_value) * 100)
    : 0
  const isComplete = progress >= 100
  const isActive = goal.is_active === 1

  return (
    <Card className={`p-5 transition-shadow hover:shadow-md ${
      isActive
        ? 'border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80'
        : 'border-slate-200/40 bg-slate-50/60 opacity-60 dark:border-slate-800/40 dark:bg-slate-950/60'
    }`}>
      <CardContent className="p-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className={`h-4 w-4 ${isComplete ? 'text-emerald-500' : 'text-indigo-500 dark:text-indigo-400'}`} strokeWidth={1.8} />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {GOAL_TYPE_LABELS[goal.goal_type] ?? goal.goal_type}
          </span>
          {!isActive && (
            <Badge variant="secondary">已暂停</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => updateGoal.mutate({ id: goal.id, is_active: isActive ? 0 : 1 })}
            variant="ghost"
            size="icon"
            title={isActive ? '暂停目标' : '恢复目标'}
          >
            {isActive ? <ToggleRight className="h-5 w-5 text-indigo-500" /> : <ToggleLeft className="h-5 w-5" />}
          </Button>
          <Button
            onClick={() => deleteGoal.mutate(goal.id)}
            variant="ghost"
            size="icon"
            title="删除目标"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-2 flex items-end justify-between">
        <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {formatGoalValue(goal.goal_type, goal.current_value)}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          / {formatGoalValue(goal.goal_type, goal.target_value)} {GOAL_TYPE_UNITS[goal.goal_type]}
        </span>
      </div>

      <Progress value={progress} className={isComplete ? '[&>div]:bg-emerald-500' : ''} />
      <p className="mt-1.5 text-right text-xs text-slate-500 dark:text-slate-400">
        {progress.toFixed(0)}%
      </p>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <Target className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
      <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">暂无目标</p>
      <p className="text-xs text-slate-500 dark:text-slate-500">点击上方「添加目标」开始设定每日练习目标</p>
    </div>
  )
}

function formatGoalValue(type: string, value: number): string {
  if (type === 'accuracy') return value.toFixed(1)
  if (type === 'wpm') return value.toFixed(1)
  if (type === 'duration') return value.toFixed(0)
  return String(Math.round(value))
}

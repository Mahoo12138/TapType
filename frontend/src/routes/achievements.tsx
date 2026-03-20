import { createFileRoute } from '@tanstack/react-router'
import { useAchievements } from '@/api/achievements'
import { Trophy, Lock, Award, Flame, Zap, Target, Rocket, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Achievement } from '@/types/api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/achievements')({
  component: AchievementsPage,
})

const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  fire: Flame,
  flame: Flame,
  medal: Award,
  bolt: Zap,
  rocket: Rocket,
  target: Target,
  book: BookOpen,
}

function AchievementsPage() {
  const { data: achievements = [], isLoading } = useAchievements()

  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          成就
        </h1>
        <Badge variant="secondary">{unlocked.length} / {achievements.length} 已解锁</Badge>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">加载中...</p>
      ) : (
        <>
          {unlocked.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                已解锁
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unlocked.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </div>
            </section>
          )}

          {locked.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                未解锁
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locked.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </div>
            </section>
          )}

          {achievements.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
              <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
              <p className="text-sm text-slate-500 dark:text-slate-400">暂无成就数据</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = ICON_MAP[achievement.icon] ?? Trophy
  const isUnlocked = achievement.unlocked

  return (
    <Card
      className={`relative p-5 transition-shadow ${
        isUnlocked
          ? 'border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/60 shadow-sm hover:shadow-md dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20'
          : 'border-slate-200/60 bg-white/60 dark:border-slate-800/60 dark:bg-slate-900/60'
      }`}
    >
      <CardContent className="p-0">
      <div className="mb-3 flex items-start justify-between">
        <div
          className={`rounded-xl p-2.5 ${
            isUnlocked
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        {!isUnlocked && (
          <Lock className="h-4 w-4 text-slate-300 dark:text-slate-600" strokeWidth={1.8} />
        )}
      </div>
      <h3
        className={`mb-1 text-sm font-semibold ${
          isUnlocked
            ? 'text-slate-900 dark:text-slate-100'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        {achievement.name}
      </h3>
      <p
        className={`text-xs ${
          isUnlocked
            ? 'text-slate-600 dark:text-slate-300'
            : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {achievement.description}
      </p>
      {isUnlocked && achievement.unlocked_at && (
        <p className="mt-2 text-xs text-amber-600/80 dark:text-amber-400/80">
          {new Date(achievement.unlocked_at).toLocaleDateString('zh-CN')} 解锁
        </p>
      )}
      </CardContent>
    </Card>
  )
}

import { useEffect, useState } from 'react'
import { Trophy, Flame, Zap, Target, Rocket, BookOpen, Award, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Achievement } from '@/types/api'

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

interface AchievementToastProps {
  achievements: Achievement[]
  onDismiss: () => void
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (achievements.length > 0) {
      // Trigger entrance animation
      requestAnimationFrame(() => setVisible(true))
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onDismiss, 300)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [achievements, onDismiss])

  if (achievements.length === 0) return null

  return (
    <div className="fixed inset-x-0 top-6 z-50 flex justify-center pointer-events-none">
      <div
        className={`pointer-events-auto max-w-sm rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-lg backdrop-blur-lg transition-all duration-300 dark:border-amber-800/60 dark:from-amber-950/80 dark:to-orange-950/80 ${
          visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/40">
            <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="mb-1 text-sm font-semibold text-amber-800 dark:text-amber-200">
              🎉 成就解锁！
            </p>
            {achievements.map((a) => {
              const Icon = ICON_MAP[a.icon] ?? Trophy
              return (
                <div key={a.id} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs text-amber-600/70 dark:text-amber-400/70">— {a.description}</span>
                </div>
              )
            })}
          </div>
          <button
            onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
            className="rounded p-0.5 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

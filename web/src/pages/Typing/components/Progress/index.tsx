import { TypingContext } from '../../store'
import { useContext, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function Progress({ className }: { className?: string }) {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state } = useContext(TypingContext)!
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)

  // 可自定义颜色
  const colorSwitcher: { [key: number]: string } = {
    0: 'bg-indigo-200',
    1: 'bg-indigo-300',
    2: 'bg-indigo-400',
  }

  useEffect(() => {
    const newProgress = Math.floor((state.chapterData.index / state.chapterData.words.length) * 100)
    setProgress(newProgress)
    const colorPhase = Math.floor(newProgress / 33.4)
    setPhase(colorPhase)
  }, [state.chapterData.index, state.chapterData.words.length])

  return (
    <div className={cn('relative w-full pt-1', className)}>
      <div className="h-2 w-full overflow-hidden rounded-lg bg-indigo-100">
        <div
          className={cn(
            'h-full rounded-lg transition-all duration-300 ease-in-out',
            colorSwitcher[phase] ?? 'bg-indigo-200'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
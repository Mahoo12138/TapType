import { EXPLICIT_SPACE } from '@/constants'
import { useTypingConfigStore } from '@/store/typing'
import React from 'react'
import { cn } from '@/lib/utils'

export type LetterState = 'normal' | 'correct' | 'wrong'

const stateColorMap: Record<string, Record<LetterState, string>> = {
  true: {
    normal: 'text-muted-foreground',
    correct: 'text-green-400',
    wrong: 'text-red-400',
  },
  false: {
    normal: 'text-foreground',
    correct: 'text-green-600',
    wrong: 'text-red-600',
  },
}

export type LetterProps = {
  letter: string
  state?: LetterState
  visible?: boolean
}

const Letter: React.FC<LetterProps> = ({ letter, state = 'normal', visible = true }) => {
  const fontSizeConfig = useTypingConfigStore(s => s.fontSizeConfig)
  const isSpace = letter === EXPLICIT_SPACE
  const colorClass = stateColorMap[String(isSpace)][state]
  
  return (
    <span
      className={cn(
        'font-mono font-normal pr-1 opacity-80 transition-colors duration-200',
        colorClass
      )}
      style={{ fontSize: fontSizeConfig.foreignFont }}
    >
      {visible ? letter : '_'}
    </span>
  )
}

export default React.memo(Letter)
import type { ElementType, SVGAttributes } from 'react'
import { ThumbsUp, Heart, Triangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type IconMapper = {
  icon: ElementType<SVGAttributes<SVGSVGElement>>
  colorClass: string
  text: (mistakeCount: number) => string
}

const ICON_MAPPER: IconMapper[] = [
  {
    icon: Heart,
    colorClass: 'text-primary',
    text: (mistakeCount: number) => `表现不错！` + (mistakeCount > 0 ? `只错了 ${mistakeCount} 个单词` : '全对了！'),
  },
  {
    icon: ThumbsUp,
    colorClass: 'text-primary',
    text: () => '有些小问题哦，下一次可以做得更好！',
  },
  {
    icon: Triangle,
    colorClass: 'text-primary',
    text: () => '错误太多，再来一次如何？',
  },
]

const ConclusionBar = ({ mistakeLevel, mistakeCount }: ConclusionBarProps) => {
  const { icon: Icon, colorClass, text } = ICON_MAPPER[mistakeLevel]

  return (
    <div className="flex items-center h-10">
      <div className={cn(colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="ml-2 text-sm sm:text-sm md:text-base font-medium leading-10">
        {text(mistakeCount)}
      </p>
    </div>
  )
}

export type ConclusionBarProps = {
  mistakeLevel: number
  mistakeCount: number
}

export default ConclusionBar
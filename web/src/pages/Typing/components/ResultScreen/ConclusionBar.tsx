import type { ElementType, SVGAttributes } from 'react'
import { ThumbsUp, Heart, Triangle } from 'lucide-react'
import { Box, Typography } from '@mui/joy'

type IconMapper = {
  icon: ElementType<SVGAttributes<SVGSVGElement>>
  color: string
  text: (mistakeCount: number) => string
}

const ICON_MAPPER: IconMapper[] = [
  {
    icon: Heart,
    color: 'primary.600',
    text: (mistakeCount: number) => `表现不错！` + (mistakeCount > 0 ? `只错了 ${mistakeCount} 个单词` : '全对了！'),
  },
  {
    icon: ThumbsUp,
    color: 'primary.600',
    text: () => '有些小问题哦，下一次可以做得更好！',
  },
  {
    icon: Triangle,
    color: 'primary.600',
    text: () => '错误太多，再来一次如何？',
  },
]

const ConclusionBar = ({ mistakeLevel, mistakeCount }: ConclusionBarProps) => {
  const { icon: Icon, color, text } = ICON_MAPPER[mistakeLevel]

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '40px' }}>
      <Box sx={{ color: color }}>
        <Icon 
          style={{ 
            width: '20px', 
            height: '20px'
          }} 
        />
      </Box>
      <Typography 
        level="body-sm"
        sx={{ 
          ml: 1, 
          color: 'text.primary',
          fontWeight: 'medium',
          lineHeight: '40px',
          '@media (min-width: 640px)': {
            fontSize: '0.875rem',
          },
          '@media (min-width: 768px)': {
            fontSize: '1rem',
          },
        }}
      >
        {text(mistakeCount)}
      </Typography>
    </Box>
  )
}

export type ConclusionBarProps = {
  mistakeLevel: number
  mistakeCount: number
}

export default ConclusionBar

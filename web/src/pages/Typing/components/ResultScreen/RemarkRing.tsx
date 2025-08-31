import clamp from '@/utils/clamp'
import { useMemo } from 'react'
import { Box, Typography } from '@mui/joy'

export type RemarkRingProps = {
  remark: string
  caption: string
  /**
   * `null` if the percentage is not appliable.
   * Otherwise, this is an integer between 0 and 100.
   */
  percentage?: number | null
  /**
   * Default to 7 rem.
   */
  size?: number
}

// Get the root font size for rem calculations
const rootFontSize = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('font-size'))

export default function RemarkRing({ remark, caption, percentage = null, size = 7 }: RemarkRingProps) {
  // Calculate the clip path for the progress ring visualization
  const clipPath = useMemo((): string | undefined => {
    if (percentage === null) {
      return undefined
    }
    
    // Clamp percentage between 0 and 100
    const clamped = clamp(percentage, 0, 100)
    
    // If 100%, no need for clip path (full circle)
    if (clamped === 100) {
      return undefined
    }
    
    // Calculate the angle for the progress arc
    const alpha = Math.PI * 2 * (clamped / 100)
    const r = (rootFontSize * size) / 2
    
    // Create SVG path for the progress arc
    const path = `M ${r},0 A ${r},${r} 0 ${clamped > 50 ? 1 : 0},1 ${r + Math.sin(alpha) * r},${r + -Math.cos(alpha) * r} L ${r},${r} Z`
    return `path("${path}")`
  }, [percentage, size])

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderRadius: '50%',
        border: '8px solid',
        borderColor: 'primary.200',
        bgcolor: 'transparent',
        width: `${size}rem`,
        height: `${size}rem`,
      }}
    >
      {/* Progress ring overlay - only shown when percentage is provided */}
      {percentage !== null && (
        <Box
          sx={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            right: '-8px',
            bottom: '-8px',
            borderRadius: '50%',
            border: '8px solid',
            borderColor: 'primary.400',
            bgcolor: 'transparent',
            clipPath,
          }}
          aria-hidden
        />
      )}
      
      {/* Main remark text (e.g., "95%", "2:30", "120") */}
      <Typography
        level="h4"
        sx={{
          fontVariantNumeric: 'tabular-nums',
          color: 'text.primary',
        }}
      >
        {remark}
      </Typography>
      
      {/* Caption text (e.g., "正确率", "章节耗时", "WPM") */}
      <Typography
        level="body-sm"
        sx={{
          fontWeight: 'medium',
          color: 'text.secondary',
        }}
      >
        {caption}
      </Typography>
    </Box>
  )
}

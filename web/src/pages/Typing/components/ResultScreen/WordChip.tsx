import usePronunciationSound from '@/hooks/usePronunciation'
import type { WordWithIndex } from '@/typings'
import { useCallback } from 'react'
import { Tooltip, Button, Box, Typography } from '@mui/joy'

export default function WordChip({ word }: { word: WordWithIndex }) {
  // Hook for playing pronunciation sound
  const { play, stop } = usePronunciationSound(word.name, false)

  // Handle word click to play pronunciation
  const onClickWord = useCallback(() => {
    stop() // Stop any currently playing sound
    play() // Play the pronunciation for this word
  }, [play, stop])

  return (
    <Tooltip
      title={
        <Box>
          <Typography level="body-sm">
            {word.trans}
          </Typography>
        </Box>
      }
      placement="top"
      arrow
      sx={{
        // Custom tooltip styling
        '& .MuiTooltip-tooltip': {
          bgcolor: 'background.surface',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 2,
          maxWidth: '300px',
        },
        '& .MuiTooltip-arrow': {
          color: 'background.surface',
          '&::before': {
            border: '1px solid',
            borderColor: 'divider',
          },
        },
      }}
    >
      <Button
        variant="soft"
        size="md"
        onClick={onClickWord}
        sx={{
          // Word chip styling - increased size
          minHeight: 'auto',
          px: 2, // Increased horizontal padding
          py: 1, // Increased vertical padding
          borderRadius: '20px', // Slightly larger border radius
          fontSize: '1rem', // Increased font size from 0.875rem
          fontWeight: 'medium',
          color: 'text.primary',
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          userSelect: 'text', // Allow text selection
          '&:hover': {
            bgcolor: 'background.level1',
            borderColor: 'primary.300',
          },
          '&:active': {
            bgcolor: 'background.level2',
          },
        }}
      >
        {word.name}
      </Button>
    </Tooltip>
  )
}

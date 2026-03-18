import usePronunciationSound from '@/hooks/usePronunciation'
import type { WordWithIndex } from '@/typings'
import { useCallback } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

export default function WordChip({ word }: { word: WordWithIndex }) {
  // Hook for playing pronunciation sound
  const { play, stop } = usePronunciationSound(word.name, false)

  // Handle word click to play pronunciation
  const onClickWord = useCallback(() => {
    stop() // Stop any currently playing sound
    play() // Play the pronunciation for this word
  }, [play, stop])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="default"
            onClick={onClickWord}
            className="min-h-0 px-4 py-2 rounded-[20px] text-base font-medium select-text border-border bg-card hover:bg-accent hover:border-primary/30 active:bg-accent/80"
          >
            {word.name}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[300px] bg-popover text-popover-foreground border border-border shadow-md"
        >
          <p className="text-sm">
            {word.trans}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
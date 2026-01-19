import { SoundIcon } from '@/components/WordPronunciationIcon/SoundIcon'
import useSpeech from '@/hooks/useSpeech'
import { useTypingConfigStore } from '@/store/typing'
import { useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils'

export type TranslationProps = {
  trans: string
  showTrans?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function Translation({ trans, showTrans = true, onMouseEnter, onMouseLeave }: TranslationProps) {
  const pronunciationConfig = useTypingConfigStore(s => s.pronunciationConfig)
  const fontSizeConfig = useTypingConfigStore(s => s.fontSizeConfig)
  const isTextSelectable = useTypingConfigStore(s => s.isTextSelectable)
  const isShowTransRead = typeof window !== 'undefined' && window.speechSynthesis && pronunciationConfig.isTransRead
  const speechOptions = useMemo(() => ({ volume: pronunciationConfig.transVolume }), [pronunciationConfig.transVolume])
  const { speak, speaking } = useSpeech(trans, speechOptions)

  const handleClickSoundIcon = useCallback(() => {
    speak(true)
  }, [speak])

  return (
    <div
      className="flex items-center justify-center pb-4 pt-5"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <p
        className={cn(
          "max-w-[600px] text-center font-sans text-foreground transition-colors duration-300",
          isShowTransRead ? "pl-2" : "",
          isTextSelectable ? "select-text" : "select-none"
        )}
        style={{ fontSize: fontSizeConfig.translateFont }}
      >
        {showTrans ? trans : '\u00A0'}
      </p>
      {isShowTransRead && showTrans && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClickSoundIcon}
                className="ml-2"
              >
                <SoundIcon animated={speaking} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>朗读释义</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
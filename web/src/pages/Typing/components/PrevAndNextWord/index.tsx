import { TypingContext, TypingStateActionType } from '../../store'
import { useDictStore, getCurrentDictInfo } from '@/store/dict'
import { useTypingConfigStore } from '@/store/typing'
import { CTRL } from '@/utils'
import { useCallback, useContext, useMemo } from 'react'
import { ArrowLeft as IconPrev, ArrowRight as IconNext } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils'

export default function PrevAndNextWord({ type }: LastAndNextWordProps) {
  const { state, dispatch } = useContext(TypingContext)!
  const wordDictationConfig = useTypingConfigStore(s => s.wordDictationConfig)
  const currentDictInfo = useTypingConfigStore(s => s.currentDictInfo)
  const currentLanguage = currentDictInfo?.language || 'en'

  const newIndex = useMemo(() => state.chapterData.index + (type === 'prev' ? -1 : 1), [state.chapterData.index, type])
  const word = state.chapterData.words[newIndex]
  const shortCutKey = useMemo(() => (type === 'prev' ? `${CTRL} + Shift + ArrowLeft` : `${CTRL} + Shift + ArrowRight`), [type])

  const onClickWord = useCallback(() => {
    if (!word) return
    dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex })
  }, [type, dispatch, newIndex, word])

  const headWord = useMemo(() => {
    if (!word) return ''
    const showWord = ['romaji', 'hapin'].includes(currentLanguage) ? word.notation || '' : word.name
    if (type === 'prev') return showWord
    if (type === 'next') {
      return !wordDictationConfig.isOpen ? showWord : (showWord || '').replace(/./g, '_')
    }
    return ''
  }, [word, currentLanguage, type, wordDictationConfig.isOpen])

  if (!word) {
    return <div />
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={onClickWord}
            className="flex max-w-80 cursor-pointer select-none items-center text-muted-foreground opacity-60 transition-opacity hover:opacity-100"
          >
            {type === 'prev' && <IconPrev className="mr-4 text-2xl flex-shrink-0" size={24} />}
            <div className={cn(
              "flex-1 min-w-0 flex flex-col mx-2",
              type === 'next' ? 'items-end text-right' : 'items-start text-left'
            )}>
              <p
                className={cn(
                  "font-mono text-2xl font-normal text-muted-foreground max-w-full overflow-hidden text-ellipsis whitespace-nowrap",
                  !wordDictationConfig.isOpen ? 'tracking-normal' : 'tracking-[0.2em]'
                )}
              >
                {headWord}
              </p>
              {state.isTransVisible && (
                <p className="text-sm max-w-full text-muted-foreground/60 whitespace-nowrap overflow-hidden text-ellipsis">
                  {word.trans.join('；')}
                </p>
              )}
            </div>
            {type === 'next' && <IconNext className="ml-4 text-2xl flex-shrink-0" size={24} />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>快捷键: {shortCutKey}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export type LastAndNextWordProps = {
  /** 上一个单词还是下一个单词 */
  type: 'prev' | 'next'
}
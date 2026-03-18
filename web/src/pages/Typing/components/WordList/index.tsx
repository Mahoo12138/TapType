import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTypingConfigStore } from '@/store/typing'
import { TypingContext, TypingStateActionType } from '../../store'
import { List } from 'lucide-react'
import { useContext, useState } from 'react'
import WordCard from './WordCard'

export default function WordList() {
  const { state, dispatch } = useContext(TypingContext)!
  const currentDictInfo = useTypingConfigStore((s) => s.currentDictInfo)
  const currentChapter = useTypingConfigStore((s) => s.currentChapter)
  const reviewModeInfo = useTypingConfigStore((s) => s.reviewModeInfo)
  
  const [isOpen, setIsOpen] = useState(false)

  const currentDictTitleValue = reviewModeInfo.isReviewMode
    ? `${currentDictInfo?.name} 错题复习`
    : `${currentDictInfo?.name} 第 ${currentChapter + 1} 章`

  function onOpenChange(open: boolean) {
    setIsOpen(open)
    if (open) {
      dispatch({ type: TypingStateActionType.SET_IS_TYPING, payload: false })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <button
                type="button"
                className="fixed left-0 top-[50%] z-20 rounded-r-lg bg-indigo-50 px-2 py-3 text-lg hover:bg-indigo-200 focus:outline-none dark:bg-indigo-900 dark:hover:bg-indigo-800"
              >
                <List className="h-6 w-6 text-indigo-500 dark:text-white" />
              </button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>List</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SheetContent side="left" className="w-[400px] sm:w-[540px] flex flex-col gap-0 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>{currentDictTitleValue}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 p-4">
            {state.chapterData.words?.map((word, index) => {
              return <WordCard word={word} key={`${word.name}_${index}`} isActive={state.chapterData.index === index} />
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

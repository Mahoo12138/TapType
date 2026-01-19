import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDictStore, getCurrentDictInfo } from '@/store/dict'
import { useTypingConfigStore } from '@/store/typing'
import range from '@/utils/range'
import { Link } from '@tanstack/react-router'
import { CheckIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const DictChapterButton = () => {
  const currentDictInfo = useDictStore(getCurrentDictInfo)
  const currentChapter = useDictStore(s => s.currentChapter)
  const setCurrentChapter = useDictStore(s => s.setCurrentChapter)
  const chapterCount = currentDictInfo?.chapterCount || 0
  const isReviewMode = useTypingConfigStore(s => s.reviewModeInfo.isReviewMode)

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              className="block rounded-lg px-3 py-1 text-lg transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100"
              to="/dictionary"
            >
              {currentDictInfo?.name} {isReviewMode && '错题复习'}
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>词典切换</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {!isReviewMode && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Select 
                value={String(currentChapter)} 
                onValueChange={(val) => setCurrentChapter(Number(val))}
              >
                <SelectTrigger className="w-fit h-auto border-none shadow-none bg-transparent p-0 text-lg hover:bg-indigo-400 hover:text-white focus:ring-0 dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100 px-3 py-1 rounded-lg transition-colors duration-300">
                  <SelectValue placeholder={`第 ${currentChapter + 1} 章`} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {range(0, chapterCount, 1).map((index) => (
                    <SelectItem key={index} value={String(index)}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>第 {index + 1} 章</span>
                        {currentChapter === index && <CheckIcon className="h-4 w-4" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TooltipTrigger>
            <TooltipContent>
              <p>章节切换</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  )
}

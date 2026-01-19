import SharePicDialog from './SharePicDialog'
import { recordShareAction } from '@/utils'
import { useCallback, useMemo, useState } from 'react'
import { Share2Icon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function ShareButton() {
  const [isShowSharePanel, setIsShowSharePanel] = useState(false)

  const randomChoose = useMemo(
    () => ({
      picRandom: Math.random(),
      promoteRandom: Math.random(),
    }),
    [],
  )

  const onClickShare = useCallback(() => {
    recordShareAction('open')
    setIsShowSharePanel(true)
  }, [])

  return (
    <>
      {isShowSharePanel && <SharePicDialog showState={isShowSharePanel} setShowState={setIsShowSharePanel} randomChoose={randomChoose} />}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClickShare}
              className="h-auto w-auto p-0 text-xl text-gray-500 hover:text-indigo-400"
            >
              <Share2Icon className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>分享你的成绩给朋友</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  )
}

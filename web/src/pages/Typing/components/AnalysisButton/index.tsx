import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PieChartIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const AnalysisButton = () => {
  const navigate = useNavigate()

  const toAnalysis = useCallback(() => {
    navigate({ to: '/analysis' })
  }, [navigate])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toAnalysis}
            className="h-auto w-auto p-0.5 text-indigo-500 hover:bg-indigo-400 hover:text-white"
          >
            <PieChartIcon className="size-[18px]" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>查看数据统计</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default AnalysisButton

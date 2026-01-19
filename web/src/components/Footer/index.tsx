import type React from 'react'
import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Github } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTypingConfigStore } from '@/store/typing'
import type { InfoPanelType } from '@/typings'
import { Button } from "@/components/ui/button"

const Footer: React.FC = () => {
  const setInfoPanelState = useTypingConfigStore(s => s.setInfoPanelState)
  const navigate = useNavigate()

  const handleOpenInfoPanel = useCallback(
    (modalType: InfoPanelType) => {
      setInfoPanelState({ [modalType]: true })
    },
    [setInfoPanelState],
  )

  const handleCloseInfoPanel = useCallback(
    (modalType: InfoPanelType) => {
      setInfoPanelState({ [modalType]: false })
    },
    [setInfoPanelState],
  )

  return (
    <footer className="mt-4 flex w-full items-center justify-center py-2">
      <div className="flex flex-row items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-auto w-auto p-2"
              >
                <a
                  href="https://github.com/mahoo12138/qwerty-learner-next"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="前往 GitHub 项目主页"
                >
                  <Github size={22} />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>前往 GitHub 项目主页</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </footer>
  )
}

export default Footer

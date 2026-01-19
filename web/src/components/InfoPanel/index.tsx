import type { ElementType, SVGProps } from 'react'
import type React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type InfoPanelProps = {
  openState: boolean
  onClose: () => void
  title: string
  icon?: ElementType<SVGProps<SVGSVGElement>>
  iconClassName: string
  buttonClassName: string
  children: React.ReactNode
}

const InfoPanel: React.FC<InfoPanelProps> = ({ 
  openState, 
  title, 
  onClose, 
  icon: Icon, 
  iconClassName, 
  buttonClassName, 
  children 
}) => {
  return (
    <Dialog open={openState} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-white dark:bg-gray-800">
        <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div
              className={cn(
                iconClassName,
                "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full dark:bg-opacity-30 sm:mx-0 sm:h-10 sm:w-10"
              )}
            >
              {Icon && <Icon className="h-6 w-6 stroke-current dark:bg-opacity-100" />}
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                  {title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                {children}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 dark:bg-gray-700 sm:flex sm:flex-row-reverse sm:px-6">
          <Button 
            type="button" 
            className={cn(buttonClassName, "w-full sm:w-auto")} 
            onClick={onClose}
          >
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InfoPanel

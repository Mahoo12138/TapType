import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export type Placement = 'left' | 'top' | 'right' | 'bottom'

interface DrawerProps {
  open?: boolean
  placement?: Placement
  onClose?: () => void
  children?: React.ReactNode
  classNames?: string
}

export default function Drawer(props: DrawerProps) {
  const { open = false, placement = 'left', onClose, children } = props

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose?.()}>
      <SheetContent 
        side={placement} 
        className={cn(
          "w-[35rem] sm:max-w-[35rem] p-0 border-none",
          props.classNames
        )}
      >
        {children}
      </SheetContent>
    </Sheet>
  )
}

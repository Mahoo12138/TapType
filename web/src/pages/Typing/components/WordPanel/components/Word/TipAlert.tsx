import type { FC } from 'react'
import { useCallback } from 'react'
import { TriangleAlert, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type ITipAlert = {
  className?: string
  show: boolean
  setShow: (show: boolean) => void
}

export const TipAlert: FC<ITipAlert> = ({ className, show, setShow }) => {
  const onClose = useCallback(() => {
    setShow(false)
  }, [setShow])

  if (!show) return null;

  return (
    <div className={`z-10 w-fit cursor-pointer ${className}`} onClick={onClose}>
      <Alert variant="default" className="border-yellow-200 bg-yellow-50 text-yellow-900">
        <TriangleAlert className="h-4 w-4 text-yellow-600" />
        <div className="flex-1">
          <AlertTitle className="mb-1">插件冲突！</AlertTitle>
          <AlertDescription className="text-sm text-yellow-800">
            如果多次输入失败，可能是与本地浏览器插件冲突，请关闭相关插件或切换浏览器试试
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-100"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  )
}
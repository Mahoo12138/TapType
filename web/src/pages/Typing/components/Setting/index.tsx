import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TypingContext, TypingStateActionType } from '@/store'
import { Cog6ToothIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { AdjustmentsHorizontalIcon, CircleStackIcon, EarIcon } from '@heroicons/react/24/outline'
import { useContext, useState } from 'react'
import AdvancedSetting from './AdvancedSetting'
import DataSetting from './DataSetting'
import SoundSetting from './SoundSetting'
import ViewSetting from './ViewSetting'

export default function Setting() {
  const [isOpen, setIsOpen] = useState(false)
  const { dispatch } = useContext(TypingContext) ?? {}

  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && dispatch) {
      dispatch({ type: TypingStateActionType.SET_IS_TYPING, payload: false })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`flex items-center justify-center rounded p-[2px] text-lg text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white ${
            isOpen && 'bg-indigo-500 text-white'
          }`}
          title="打开设置对话框"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </button>
      </DialogTrigger>

      <DialogContent className="flex w-[800px] max-w-[800px] flex-col overflow-hidden rounded-2xl bg-white p-0 shadow-xl dark:bg-gray-800 gap-0" showCloseButton={false}>
        <div className="relative flex h-22 items-end justify-between rounded-t-lg border-b border-neutral-100 bg-stone-50 px-6 py-3 dark:border-neutral-700 dark:bg-gray-900">
          <span className="text-3xl font-bold text-gray-600 dark:text-gray-300">设置</span>
          <button type="button" onClick={() => setIsOpen(false)} title="关闭对话框">
            <XMarkIcon className="absolute right-7 top-5 h-6 w-6 cursor-pointer text-gray-400" />
          </button>
        </div>

        <Tabs defaultValue="sound" orientation="vertical" className="flex h-[480px] w-full">
          <TabsList className="flex h-full w-52 flex-col items-start space-y-3 border-r border-neutral-100 bg-stone-50 px-6 py-3 dark:border-transparent dark:bg-gray-900 rounded-none">
            <TabsTrigger
              value="sound"
              className="flex h-14 w-full cursor-pointer items-center justify-start gap-2 rounded-lg px-4 py-2 ring-0 focus:outline-none data-[state=active]:bg-gray-200 data-[state=active]:bg-opacity-50 dark:data-[state=active]:bg-gray-800 text-neutral-500 dark:text-neutral-300"
            >
              <EarIcon className="h-5 w-5 mr-2" />
              <span>音效设置</span>
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="flex h-14 w-full cursor-pointer items-center justify-start gap-2 rounded-lg px-4 py-2 ring-0 focus:outline-none data-[state=active]:bg-gray-200 data-[state=active]:bg-opacity-50 dark:data-[state=active]:bg-gray-800 text-neutral-500 dark:text-neutral-300"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              <span>高级设置</span>
            </TabsTrigger>
            <TabsTrigger
              value="view"
              className="flex h-14 w-full cursor-pointer items-center justify-start gap-2 rounded-lg px-4 py-2 ring-0 focus:outline-none data-[state=active]:bg-gray-200 data-[state=active]:bg-opacity-50 dark:data-[state=active]:bg-gray-800 text-neutral-500 dark:text-neutral-300"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              <span>显示设置</span>
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="flex h-14 w-full cursor-pointer items-center justify-start gap-2 rounded-lg px-4 py-2 ring-0 focus:outline-none data-[state=active]:bg-gray-200 data-[state=active]:bg-opacity-50 dark:data-[state=active]:bg-gray-800 text-neutral-500 dark:text-neutral-300"
            >
              <CircleStackIcon className="h-5 w-5 mr-2" />
              <span>数据设置</span>
            </TabsTrigger>
          </TabsList>

          <div className="h-full w-full flex-1">
            <TabsContent value="sound" className="h-full mt-0 focus-visible:outline-none">
              <SoundSetting />
            </TabsContent>
            <TabsContent value="advanced" className="h-full mt-0 focus-visible:outline-none">
              <AdvancedSetting />
            </TabsContent>
            <TabsContent value="view" className="h-full mt-0 focus-visible:outline-none">
              <ViewSetting />
            </TabsContent>
            <TabsContent value="data" className="h-full mt-0 focus-visible:outline-none">
              <DataSetting />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

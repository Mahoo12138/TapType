import { useTypingConfigStore } from '@/store/typing'
import { Switch } from "@/components/ui/switch"
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useCallback } from 'react'

export default function AdvancedSetting() {
  const randomConfig = useTypingConfigStore(s => s.randomConfig)
  const setRandomConfig = useTypingConfigStore(s => s.setRandomConfig)
  const isShowPrevAndNextWord = useTypingConfigStore(s => s.isShowPrevAndNextWord)
  const setIsShowPrevAndNextWord = useTypingConfigStore(s => s.setIsShowPrevAndNextWord)
  const isIgnoreCase = useTypingConfigStore(s => s.isIgnoreCase)
  const setIsIgnoreCase = useTypingConfigStore(s => s.setIsIgnoreCase)
  const isTextSelectable = useTypingConfigStore(s => s.isTextSelectable)
  const setIsTextSelectable = useTypingConfigStore(s => s.setIsTextSelectable)
  const isShowAnswerOnHover = useTypingConfigStore(s => s.isShowAnswerOnHover)
  const setIsShowAnswerOnHover = useTypingConfigStore(s => s.setIsShowAnswerOnHover)

  const onToggleRandom = useCallback(
    (checked: boolean) => {
      setRandomConfig({ isOpen: checked })
    },
    [setRandomConfig],
  )

  const onToggleLastAndNextWord = useCallback(
    (checked: boolean) => {
      setIsShowPrevAndNextWord(checked)
    },
    [setIsShowPrevAndNextWord],
  )

  const onToggleIgnoreCase = useCallback(
    (checked: boolean) => {
      setIsIgnoreCase(checked)
    },
    [setIsIgnoreCase],
  )

  const onToggleTextSelectable = useCallback(
    (checked: boolean) => {
      setIsTextSelectable(checked)
    },
    [setIsTextSelectable],
  )
  const onToggleShowAnswerOnHover = useCallback(
    (checked: boolean) => {
      setIsShowAnswerOnHover(checked)
    },
    [setIsShowAnswerOnHover],
  )

  return (
    <ScrollArea.Root className="flex-1 select-none overflow-y-auto ">
      <ScrollArea.Viewport className="h-full w-full px-3">
        <div className="flex flex-col gap-6 p-4">
          <div className="flex flex-col gap-2">
            <span className="text-base font-bold text-gray-700 dark:text-gray-200">章节乱序</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">开启后，每次练习章节中单词会随机排序。下一章节生效</span>
            <div className="mt-2 flex w-full items-center justify-between">
              <Switch checked={randomConfig.isOpen} onCheckedChange={onToggleRandom} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600">{`随机已${
                randomConfig.isOpen ? '开启' : '关闭'
              }`}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-base font-bold text-gray-700 dark:text-gray-200">练习时展示上一个/下一个单词</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">开启后，练习中会在上方展示上一个/下一个单词</span>
            <div className="mt-2 flex w-full items-center justify-between">
              <Switch checked={isShowPrevAndNextWord} onCheckedChange={onToggleLastAndNextWord} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600">{`展示单词已${
                isShowPrevAndNextWord ? '开启' : '关闭'
              }`}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-base font-bold text-gray-700 dark:text-gray-200">是否忽略大小写</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">开启后，输入时不区分大小写，如输入“hello”和“Hello”都会被认为是正确的</span>
            <div className="mt-2 flex w-full items-center justify-between">
              <Switch checked={isIgnoreCase} onCheckedChange={onToggleIgnoreCase} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600">{`忽略大小写已${
                isIgnoreCase ? '开启' : '关闭'
              }`}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-base font-bold text-gray-700 dark:text-gray-200">是否允许选择文本</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">开启后，可以通过鼠标选择文本 </span>
            <div className="mt-2 flex w-full items-center justify-between">
              <Switch checked={isTextSelectable} onCheckedChange={onToggleTextSelectable} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600">{`选择文本已${
                isTextSelectable ? '开启' : '关闭'
              }`}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-base font-bold text-gray-700 dark:text-gray-200">是否允许默写模式下显示提示</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">开启后，可以通过鼠标 hover 单词显示正确答案 </span>
            <div className="mt-2 flex w-full items-center justify-between">
              <Switch checked={isShowAnswerOnHover} onCheckedChange={onToggleShowAnswerOnHover} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600">{`显示提示已${
                isShowAnswerOnHover ? '开启' : '关闭'
              }`}</span>
            </div>
          </div>
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="flex touch-none select-none bg-transparent " orientation="vertical"></ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}

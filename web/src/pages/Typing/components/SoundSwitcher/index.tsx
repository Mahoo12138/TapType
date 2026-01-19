import { useTypingConfigStore } from '@/store/typing'
import { useCallback } from 'react'
import { Volume2Icon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default function SoundSwitcher() {
  const keySoundsConfig = useTypingConfigStore(s => s.keySoundsConfig)
  const setKeySoundsConfig = useTypingConfigStore(s => s.setKeySoundsConfig)
  const hintSoundsConfig = useTypingConfigStore(s => s.hintSoundsConfig)
  const setHintSoundsConfig = useTypingConfigStore(s => s.setHintSoundsConfig)

  const onChangeKeySound = useCallback(
    (checked: boolean) => {
      setKeySoundsConfig({ isOpen: checked })
    },
    [setKeySoundsConfig],
  )

  const onChangeHintSound = useCallback(
    (checked: boolean) => {
      setHintSoundsConfig({ isOpen: checked })
    },
    [setHintSoundsConfig],
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-auto w-auto p-0.5 text-indigo-500 hover:bg-indigo-400 hover:text-white"
          title="音效设置"
        >
          <Volume2Icon className="size-[18px]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">开关按键音</span>
            <div className="flex w-full flex-row items-center justify-between">
              <Switch checked={keySoundsConfig.isOpen} onCheckedChange={onChangeKeySound} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600">{`发音已${
                keySoundsConfig.isOpen ? '开启' : '关闭'
              }`}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">开关效果音</span>
            <div className="flex w-full flex-row items-center justify-between">
              <Switch checked={hintSoundsConfig.isOpen} onCheckedChange={onChangeHintSound} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600">{`发音已${
                hintSoundsConfig.isOpen ? '开启' : '关闭'
              }`}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { defaultFontSizeConfig } from '@/constants'
import { useTypingConfigStore } from '@/store/typing'
import { useCallback } from 'react'

export default function ViewSetting() {
  const fontSizeConfig = useTypingConfigStore((s) => s.fontSizeConfig)
  const setFontSizeConfig = useTypingConfigStore((s) => s.setFontSizeConfig)

  const onChangeForeignFontSize = useCallback(
    (value: number[]) => {
      setFontSizeConfig({
        ...fontSizeConfig,
        foreignFont: value[0],
      })
    },
    [fontSizeConfig, setFontSizeConfig],
  )

  const onChangeTranslateFontSize = useCallback(
    (value: number[]) => {
      setFontSizeConfig({
        ...fontSizeConfig,
        translateFont: value[0],
      })
    },
    [fontSizeConfig, setFontSizeConfig],
  )

  const onResetFontSize = useCallback(() => {
    setFontSizeConfig({ ...defaultFontSizeConfig })
  }, [setFontSizeConfig])

  return (
    <ScrollArea className="flex-1 select-none overflow-y-auto">
      <div className="flex w-full flex-col items-start justify-start gap-10 overflow-y-auto pb-40 pl-6 pr-9 pt-8">
        <div className="flex w-full flex-col items-start gap-4">
          <span className="pb-0 text-xl font-medium text-gray-600 dark:text-gray-300">字体设置</span>
          <div className="flex w-full flex-col items-start gap-2 py-0 pl-4">
            <span className="font-medium text-gray-600 dark:text-gray-300">外语字体</span>
            <div className="flex h-5 w-full items-center justify-between">
              <Slider
                value={[fontSizeConfig.foreignFont]}
                min={20}
                max={96}
                step={4}
                className="w-[85%]"
                onValueChange={onChangeForeignFontSize}
              />
              <span className="ml-4 w-10 text-xs font-normal text-gray-600 dark:text-gray-400">{fontSizeConfig.foreignFont}px</span>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-2 py-0 pl-4">
            <span className="font-medium text-gray-600 dark:text-gray-300">中文字体</span>
            <div className="flex h-5 w-full items-center justify-between">
              <Slider
                value={[fontSizeConfig.translateFont]}
                max={60}
                min={14}
                step={4}
                className="w-[85%]"
                onValueChange={onChangeTranslateFontSize}
              />
              <span className="ml-4 w-10 text-xs font-normal text-gray-600 dark:text-gray-400">{fontSizeConfig.translateFont}px</span>
            </div>
          </div>
        </div>
        <Button className="ml-4" onClick={onResetFontSize} title="重置字体设置">
          重置字体设置
        </Button>
      </div>
    </ScrollArea>
  )
}

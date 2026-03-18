import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTypingConfigStore } from '@/store/typing'
import type { LoopWordTimesOption } from '@/typings'
import { Repeat } from 'lucide-react'
import { useCallback, useState } from 'react'

const loopOptions: LoopWordTimesOption[] = [1, 3, 5, 8, Number.MAX_SAFE_INTEGER]

export default function LoopWordSwitcher() {
  const loopWordConfig = useTypingConfigStore((s) => s.loopWordConfig)
  const setLoopWordConfig = useTypingConfigStore((s) => s.setLoopWordConfig)
  const loopTimes = loopWordConfig.times
  
  const [isOpen, setIsOpen] = useState(false)

  const onChangeLoopTimes = useCallback(
    (value: number) => {
      setLoopWordConfig({
        times: value as LoopWordTimesOption,
      })
    },
    [setLoopWordConfig],
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-7 w-7 items-center justify-center rounded p-[2px] text-lg outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white ${
            loopTimes === 1 ? 'text-gray-500' : 'text-indigo-500'
          } ${isOpen ? 'bg-indigo-400 text-white' : ''}`}
          type="button"
          aria-label="选择单词的循环次数"
        >
          <div className="relative">
            <Repeat className="h-5 w-5" />
            {loopTimes !== 1 && (
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.7] transform font-mono text-xs font-bold">
                {loopTimes === Number.MAX_SAFE_INTEGER ? '∞' : loopTimes}
              </span>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex w-60 select-none flex-col items-center justify-center gap-4">
          <div className="flex w-full flex-col items-start gap-2 py-0">
            <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">
              选择单词的循环次数
            </span>
            <div className="flex w-full flex-row items-center justify-between">
              <RadioGroup
                className="flex w-full flex-col gap-2.5"
                defaultValue={loopTimes.toString()}
                onValueChange={(val) => onChangeLoopTimes(Number(val))}
              >
                {loopOptions.map((value, index) => (
                  <div className="flex w-full items-center space-x-2" key={value}>
                    <RadioGroupItem value={value.toString()} id={`r${index}`} />
                    <label
                      htmlFor={`r${index}`}
                      className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white dark:text-opacity-60"
                    >
                      {value === Number.MAX_SAFE_INTEGER ? '无限' : value}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

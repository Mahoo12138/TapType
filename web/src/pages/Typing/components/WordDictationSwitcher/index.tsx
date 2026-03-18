import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useTypingConfigStore } from '@/store/typing'
import type { WordDictationType } from '@/typings'
import { Eye, EyeOff } from 'lucide-react'
import { useLayoutEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

const wordDictationTypeList: { name: string; type: WordDictationType }[] = [
  {
    name: '全部隐藏',
    type: 'hideAll',
  },
  {
    name: '隐藏元音',
    type: 'hideVowel',
  },
  {
    name: '隐藏辅音',
    type: 'hideConsonant',
  },
  {
    name: '随机隐藏',
    type: 'randomHide',
  },
]

export default function WordDictationSwitcher() {
  const wordDictationConfig = useTypingConfigStore((s) => s.wordDictationConfig)
  const setWordDictationConfig = useTypingConfigStore((s) => s.setWordDictationConfig)
  const [currentType, setCurrentType] = useState(wordDictationTypeList[0])

  const onToggleWordDictation = () => {
    setWordDictationConfig({
      ...wordDictationConfig,
      isOpen: !wordDictationConfig.isOpen,
      openBy: !wordDictationConfig.isOpen ? 'user' : wordDictationConfig.openBy,
    })
  }

  const onChangeWordDictationType = (value: WordDictationType) => {
    setWordDictationConfig({
      ...wordDictationConfig,
      type: value,
    })
  }

  useLayoutEffect(() => {
    setCurrentType(wordDictationTypeList.find((item) => item.type === wordDictationConfig.type) || wordDictationTypeList[0])
  }, [wordDictationConfig.type])

  useHotkeys(
    'ctrl+v',
    () => {
      onToggleWordDictation()
    },
    { enableOnFormTags: true, preventDefault: true },
    [],
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex h-7 w-7 items-center justify-center rounded p-[2px] text-lg outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white ${
            wordDictationConfig.isOpen ? 'text-indigo-500' : 'text-gray-500'
          }`}
          type="button"
          aria-label="开关默写模式"
        >
          {wordDictationConfig.isOpen ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex w-60 select-none flex-col items-center justify-center gap-4 rounded-xl bg-white p-4 drop-shadow transition duration-1000 ease-in-out dark:bg-gray-800">
          <div className="flex w-full flex-col items-start gap-2 py-0">
            <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">
              开关默写模式
            </span>
            <div className="flex w-full flex-row items-center justify-between">
              <Switch checked={wordDictationConfig.isOpen} onCheckedChange={onToggleWordDictation} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">{`默写已${
                wordDictationConfig.isOpen ? '开启' : '关闭'
              }`}</span>
            </div>
          </div>

          <div
            className={`flex w-full flex-col items-center justify-center gap-4 transition-all duration-300 ease-in-out ${
              wordDictationConfig.isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}
          >
            <div className="flex w-full flex-col items-start gap-2 py-0">
              <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">
                默写模式
              </span>
              <div className="flex w-full flex-row items-center justify-between">
                <Select value={currentType.type} onValueChange={onChangeWordDictationType}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{currentType.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {wordDictationTypeList.map((item) => (
                      <SelectItem key={item.name} value={item.type}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

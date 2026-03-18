import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LANG_PRON_MAP } from '@/resources/soundResource'
import { useTypingConfigStore } from '@/store/typing'
import type { PronunciationType } from '@/typings'
import { PRONUNCIATION_PHONETIC_MAP } from '@/typings'
import { useCallback, useEffect, useMemo } from 'react'

const PronunciationSwitcher = () => {
  const currentDictInfo = useTypingConfigStore((s) => s.currentDictInfo)
  const pronunciationConfig = useTypingConfigStore((s) => s.pronunciationConfig)
  const setPronunciationConfig = useTypingConfigStore((s) => s.setPronunciationConfig)
  const phoneticConfig = useTypingConfigStore((s) => s.phoneticConfig)
  const setPhoneticConfig = useTypingConfigStore((s) => s.setPhoneticConfig)

  // Use optional chaining or fallback to prevent crash if currentDictInfo is not yet loaded
  const currentLanguage = currentDictInfo?.language || 'en'
  const pronunciationList = useMemo(() => {
    return LANG_PRON_MAP[currentLanguage]?.pronunciation || []
  }, [currentLanguage])

  useEffect(() => {
    if (!currentDictInfo || !pronunciationList.length) return

    const defaultPronIndex = currentDictInfo.defaultPronIndex || LANG_PRON_MAP[currentLanguage]?.defaultPronIndex || 0
    const defaultPron = pronunciationList[defaultPronIndex]

    if (!defaultPron) return

    // if the current pronunciation is not in the pronunciation list, reset the pronunciation config to default
    const index = pronunciationList.findIndex((item) => item.pron === pronunciationConfig.type)
    if (index === -1) {
      // only change the type and name, keep the isOpen state
      setPronunciationConfig({
        type: defaultPron.pron,
        name: defaultPron.name,
      })
    }
  }, [currentDictInfo, currentLanguage, setPronunciationConfig, pronunciationList, pronunciationConfig.type])

  useEffect(() => {
    const phoneticType = PRONUNCIATION_PHONETIC_MAP[pronunciationConfig.type]
    if (phoneticType) {
      setPhoneticConfig({
        type: phoneticType,
      })
    }
  }, [pronunciationConfig.type, setPhoneticConfig])

  const onChangePronunciationIsOpen = useCallback(
    (value: boolean) => {
      setPronunciationConfig({
        isOpen: value,
      })
    },
    [setPronunciationConfig],
  )

  const onChangePronunciationIsTransRead = useCallback(
    (value: boolean) => {
      setPronunciationConfig({
        isTransRead: value,
      })
    },
    [setPronunciationConfig],
  )

  const onChangePronunciationIsLoop = useCallback(
    (value: boolean) => {
      setPronunciationConfig({
        isLoop: value,
      })
    },
    [setPronunciationConfig],
  )

  const onChangePhoneticIsOpen = useCallback(
    (value: boolean) => {
      setPhoneticConfig({
        isOpen: value,
      })
    },
    [setPhoneticConfig],
  )

  const onChangePronunciationType = useCallback(
    (value: PronunciationType) => {
      const item = pronunciationList.find((item) => item.pron === value)
      if (item) {
        setPronunciationConfig({
          type: item.pron,
          name: item.name,
        })
      }
    },
    [setPronunciationConfig, pronunciationList],
  )

  const currentLabel = useMemo(() => {
    if (pronunciationConfig.isOpen) {
      return pronunciationConfig.name
    } else {
      return '关闭'
    }
  }, [pronunciationConfig.isOpen, pronunciationConfig.name])

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className="flex h-8 min-w-max cursor-pointer items-center justify-center rounded-md px-1 transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none dark:text-white dark:text-opacity-60 dark:hover:text-opacity-100 data-[state=open]:bg-indigo-400 data-[state=open]:text-white"
                type="button"
              >
                {currentLabel}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>发音及音标切换</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-auto p-4">
        <div className="flex w-60 select-none flex-col items-center justify-center gap-4 rounded-xl bg-white p-4 drop-shadow transition duration-1000 ease-in-out dark:bg-gray-800">
          <div className="flex w-full flex-col items-start gap-2 py-0">
            <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">
              开关音标显示
            </span>
            <div className="flex w-full flex-row items-center justify-between">
              <Switch checked={phoneticConfig.isOpen} onCheckedChange={onChangePhoneticIsOpen} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">{`音标已${
                phoneticConfig.isOpen ? '开启' : '关闭'
              }`}</span>
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-2 py-0">
            <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">
              开关单词发音
            </span>
            <div className="flex w-full flex-row items-center justify-between">
              <Switch checked={pronunciationConfig.isOpen} onCheckedChange={onChangePronunciationIsOpen} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">{`发音已${
                pronunciationConfig.isOpen ? '开启' : '关闭'
              }`}</span>
            </div>
          </div>
          {window.speechSynthesis && (
            <div className="flex w-full flex-col items-start gap-2 py-0">
              <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">
                开关释义发音
              </span>
              <div className="flex w-full flex-row items-center justify-between">
                <Switch checked={pronunciationConfig.isTransRead} onCheckedChange={onChangePronunciationIsTransRead} />
                <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">{`发音已${
                  pronunciationConfig.isTransRead ? '开启' : '关闭'
                }`}</span>
              </div>
            </div>
          )}

          <div
            className={`flex w-full flex-col items-center justify-center gap-4 transition-all duration-300 ease-in-out ${
              pronunciationConfig.isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}
          >
            <div className="flex w-full flex-col items-start gap-2 py-0">
              <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">
                开关循环发音
              </span>
              <div className="flex w-full flex-row items-center justify-between">
                <Switch checked={pronunciationConfig.isLoop} onCheckedChange={onChangePronunciationIsLoop} />
                <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">{`循环已${
                  pronunciationConfig.isLoop ? '开启' : '关闭'
                }`}</span>
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-2 py-0">
              <span className="text-sm font-normal leading-5 text-gray-900 dark:text-white dark:text-opacity-60">
                单词发音口音
              </span>
              <div className="flex w-full flex-row items-center justify-between">
                <Select value={pronunciationConfig.type} onValueChange={onChangePronunciationType}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{pronunciationConfig.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {pronunciationList.map((item) => (
                      <SelectItem key={item.pron} value={item.pron}>
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

export default PronunciationSwitcher

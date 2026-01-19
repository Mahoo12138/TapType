import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { keySoundResources } from '@/resources/soundResource'
import { useTypingConfigStore } from '@/store/typing'
import type { SoundResource } from '@/typings'
import { toFixedNumber } from '@/utils'
import { playKeySoundResource } from '@/utils/sounds/keySounds'
import { EarIcon } from 'lucide-react'
import { useCallback } from 'react'

export default function SoundSetting() {
  const pronunciationConfig = useTypingConfigStore((s) => s.pronunciationConfig)
  const setPronunciationConfig = useTypingConfigStore((s) => s.setPronunciationConfig)
  const keySoundsConfig = useTypingConfigStore((s) => s.keySoundsConfig)
  const setKeySoundsConfig = useTypingConfigStore((s) => s.setKeySoundsConfig)
  const hintSoundsConfig = useTypingConfigStore((s) => s.hintSoundsConfig)
  const setHintSoundsConfig = useTypingConfigStore((s) => s.setHintSoundsConfig)

  const onTogglePronunciation = useCallback(
    (checked: boolean) => {
      setPronunciationConfig({
        isOpen: checked,
      })
    },
    [setPronunciationConfig],
  )
  const onTogglePronunciationIsTransRead = useCallback(
    (checked: boolean) => {
      setPronunciationConfig({
        isTransRead: checked,
      })
    },
    [setPronunciationConfig],
  )
  const onChangePronunciationVolume = useCallback(
    (value: number[]) => {
      setPronunciationConfig({
        volume: value[0] / 100,
      })
    },
    [setPronunciationConfig],
  )
  const onChangePronunciationIsTransVolume = useCallback(
    (value: number[]) => {
      setPronunciationConfig({
        transVolume: value[0] / 100,
      })
    },
    [setPronunciationConfig],
  )
  const onChangePronunciationRate = useCallback(
    (value: number[]) => {
      setPronunciationConfig({
        rate: value[0],
      })
    },
    [setPronunciationConfig],
  )

  const onToggleKeySounds = useCallback(
    (checked: boolean) => {
      setKeySoundsConfig({
        isOpen: checked,
      })
    },
    [setKeySoundsConfig],
  )
  const onChangeKeySoundsVolume = useCallback(
    (value: number[]) => {
      setKeySoundsConfig({
        volume: value[0] / 100,
      })
    },
    [setKeySoundsConfig],
  )

  const onChangeKeySoundsResource = useCallback(
    (key: string) => {
      const soundResource = keySoundResources.find((item: SoundResource) => item.key === key) as SoundResource
      if (!soundResource) return

      setKeySoundsConfig({
        resource: soundResource,
      })
    },
    [setKeySoundsConfig],
  )

  const onPlayKeySound = useCallback((soundResource: SoundResource) => {
    playKeySoundResource(soundResource)
  }, [])

  const onToggleHintSounds = useCallback(
    (checked: boolean) => {
      setHintSoundsConfig({
        isOpen: checked,
      })
    },
    [setHintSoundsConfig],
  )
  const onChangeHintSoundsVolume = useCallback(
    (value: number[]) => {
      setHintSoundsConfig({
        volume: value[0] / 100,
      })
    },
    [setHintSoundsConfig],
  )

  return (
    <ScrollArea className="flex-1 select-none overflow-y-auto">
      <div className="flex w-full flex-col items-start justify-start gap-10 overflow-y-auto pb-40 pl-6 pr-9 pt-8">
        <div className="flex w-full flex-col items-start gap-4">
          <span className="pb-0 text-xl font-medium text-gray-600 dark:text-gray-300">单词发音</span>
          <div className="flex w-full flex-row items-center justify-between gap-2 py-0 pl-4">
            <Switch checked={pronunciationConfig.isOpen} onCheckedChange={onTogglePronunciation} />
            <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">{`发音已${
              pronunciationConfig.isOpen ? '开启' : '关闭'
            }`}</span>
          </div>
          <div className="flex w-full flex-col items-start gap-2 py-0 pl-4">
            <span className="font-medium text-gray-600 dark:text-gray-300">音量</span>
            <div className="flex h-5 w-full items-center justify-between">
              <Slider
                defaultValue={[pronunciationConfig.volume * 100]}
                max={100}
                step={10}
                className="w-[85%]"
                onValueChange={onChangePronunciationVolume}
                disabled={!pronunciationConfig.isOpen}
              />
              <span className="ml-4 w-10 text-xs font-normal text-gray-600 dark:text-gray-400">{`${Math.floor(
                pronunciationConfig.volume * 100,
              )}%`}</span>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-2 py-0 pl-4">
            <span className="font-medium text-gray-600 dark:text-gray-300">倍速</span>
            <div className="flex h-5 w-full items-center justify-between">
              <Slider
                defaultValue={[pronunciationConfig.rate ?? 1]}
                max={4}
                min={0.5}
                step={0.1}
                className="w-[85%]"
                onValueChange={onChangePronunciationRate}
                disabled={!pronunciationConfig.isOpen}
              />
              <span className="ml-4 w-10 text-xs font-normal text-gray-600 dark:text-gray-400">{`${toFixedNumber(
                pronunciationConfig.rate,
                2,
              )}`}</span>
            </div>
          </div>
        </div>
        {window.speechSynthesis && (
          <div className="flex w-full flex-col items-start gap-4">
            <span className="pb-0 text-xl font-medium text-gray-600 dark:text-gray-300">释义发音</span>
            <div className="flex w-full flex-row items-center justify-between gap-2 py-0 pl-4">
              <Switch checked={pronunciationConfig.isTransRead} onCheckedChange={onTogglePronunciationIsTransRead} />
              <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">{`发音已${
                pronunciationConfig.isTransRead ? '开启' : '关闭'
              }`}</span>
            </div>
            <div className="flex w-full flex-col items-start gap-2 py-0 pl-4">
              <span className="font-medium text-gray-600 dark:text-gray-300">音量</span>
              <div className="flex h-5 w-full items-center justify-between">
                <Slider
                  defaultValue={[pronunciationConfig.transVolume * 100]}
                  max={100}
                  step={10}
                  className="w-[85%]"
                  onValueChange={onChangePronunciationIsTransVolume}
                />
                <span className="ml-4 w-10 text-xs font-normal text-gray-600 dark:text-gray-400">{`${Math.floor(
                  pronunciationConfig.transVolume * 100,
                )}%`}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col items-start gap-4">
          <span className="pb-0 text-xl font-medium text-gray-600 dark:text-gray-300">按键音</span>
          <div className="flex w-full flex-row items-center justify-between gap-2 py-0 pl-4">
            <Switch checked={keySoundsConfig.isOpen} onCheckedChange={onToggleKeySounds} />
            <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">{`发音已${
              keySoundsConfig.isOpen ? '开启' : '关闭'
            }`}</span>
          </div>
          <div className="flex w-full flex-col items-start gap-2 py-0 pl-4">
            <span className="font-medium text-gray-600 dark:text-gray-300">音量</span>
            <div className="flex h-5 w-full items-center justify-between">
              <Slider
                defaultValue={[keySoundsConfig.volume * 100]}
                max={100}
                min={1}
                step={10}
                className="w-[85%]"
                onValueChange={onChangeKeySoundsVolume}
                disabled={!keySoundsConfig.isOpen}
              />
              <span className="ml-4 w-10 text-xs font-normal text-gray-600 dark:text-gray-400">{`${Math.floor(
                keySoundsConfig.volume * 100,
              )}%`}</span>
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-2 py-0 pl-4">
            <span className="font-medium text-gray-600 dark:text-gray-300">按键音效</span>
            <Select value={keySoundsConfig.resource.key} onValueChange={onChangeKeySoundsResource}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Select sound" />
              </SelectTrigger>
              <SelectContent>
                {keySoundResources.map((keySoundResource) => (
                  <SelectItem key={keySoundResource.key} value={keySoundResource.key}>
                    <div className="flex w-full items-center justify-between">
                      <span>{keySoundResource.name}</span>
                      <EarIcon
                        size={16}
                        onClick={(e) => {
                          e.stopPropagation()
                          onPlayKeySound(keySoundResource)
                        }}
                        className="ml-2 cursor-pointer text-neutral-500 hover:text-indigo-400 dark:text-neutral-300"
                      />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-4">
          <span className="pb-0 text-xl font-medium text-gray-600 dark:text-gray-300">效果音</span>
          <div className="flex w-full flex-row items-center justify-between gap-2 py-0 pl-4">
            <Switch checked={hintSoundsConfig.isOpen} onCheckedChange={onToggleHintSounds} />
            <span className="text-right text-xs font-normal leading-tight text-gray-600 dark:text-gray-400">{`发音已${
              hintSoundsConfig.isOpen ? '开启' : '关闭'
            }`}</span>
          </div>
          <div className="flex w-full flex-col items-start gap-2 py-0 pl-4">
            <span className="font-medium text-gray-600 dark:text-gray-300">音量</span>
            <div className="flex h-5 w-full items-center justify-between">
              <Slider
                defaultValue={[hintSoundsConfig.volume * 100]}
                max={100}
                min={1}
                step={10}
                className="w-[85%]"
                onValueChange={onChangeHintSoundsVolume}
                disabled={!hintSoundsConfig.isOpen}
              />
              <span className="ml-4 w-10 text-xs font-normal text-gray-600 dark:text-gray-400">{`${Math.floor(
                hintSoundsConfig.volume * 100,
              )}%`}</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

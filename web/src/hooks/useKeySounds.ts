import { KEY_SOUND_URL_PREFIX, SOUND_URL_PREFIX, keySoundResources } from '@/resources/soundResource'
import { useTypingConfigStore } from '@/store/typing'
import noop from '@/utils/noop'
import { useEffect, useState } from 'react'
import useSound from 'use-sound'

export type PlayFunction = ReturnType<typeof useSound>[0]

export default function useKeySound(): [PlayFunction, PlayFunction, PlayFunction] {
  const { isOpen: isKeyOpen, isOpenClickSound, volume: keyVolume, resource: keyResource } = useTypingConfigStore(s => s.keySoundsConfig)
  const setKeySoundsConfig = useTypingConfigStore(s => s.setKeySoundsConfig)
  const {
    isOpen: isHintOpen,
    isOpenWrongSound,
    isOpenCorrectSound,
    volume: hintVolume,
    wrongResource,
    correctResource,
  } = useTypingConfigStore(s => s.hintSoundsConfig)
  const [keySoundUrl, setKeySoundUrl] = useState(`${KEY_SOUND_URL_PREFIX}${keyResource.filename}`)

  useEffect(() => {
    if (!keySoundResources.some((item) => item.filename === keyResource.filename && item.key === keyResource.key)) {
      const defaultKeySoundResource = keySoundResources.find((item) => item.key === 'Default') || keySoundResources[0]

      setKeySoundUrl(`${KEY_SOUND_URL_PREFIX}${defaultKeySoundResource.filename}`)
      setKeySoundsConfig({ resource: defaultKeySoundResource })
    }
  }, [keyResource, setKeySoundsConfig])

  const [playClickSound] = useSound(keySoundUrl, {
    volume: keyVolume,
    interrupt: true,
  })
  const [playWrongSound] = useSound(`${SOUND_URL_PREFIX}${wrongResource.filename}`, {
    volume: hintVolume,
    interrupt: true,
  })
  const [playCorrectSound] = useSound(`${SOUND_URL_PREFIX}${correctResource.filename}`, {
    volume: hintVolume,
    interrupt: true,
  })

  return [
    isKeyOpen && isOpenClickSound ? playClickSound : noop,
    isHintOpen && isOpenWrongSound ? playWrongSound : noop,
    isHintOpen && isOpenCorrectSound ? playCorrectSound : noop,
  ]
}

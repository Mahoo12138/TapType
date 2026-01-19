import { useTypingConfigStore } from '@/store/typing'
import type { Word, WordWithIndex } from '@/typings'
import { cn } from '@/lib/utils'

export type PhoneticProps = {
  word: WordWithIndex | Word
}

function Phonetic({ word }: PhoneticProps) {
  const phoneticConfig = useTypingConfigStore(s => s.phoneticConfig)
  const isTextSelectable = useTypingConfigStore(s => s.isTextSelectable)

  return (
    <div
      className={cn(
        "space-x-5 text-center text-sm font-normal text-gray-600 transition-colors duration-300 dark:text-gray-400",
        isTextSelectable && "select-text"
      )}
    >
      {phoneticConfig.type === 'us' && word.usphone && word.usphone.length > 1 && <span>{`AmE: [${word.usphone}]`}</span>}
      {phoneticConfig.type === 'uk' && word.ukphone && word.ukphone.length > 1 && <span>{`BrE: [${word.ukphone}]`}</span>}
    </div>
  )
}

export default Phonetic

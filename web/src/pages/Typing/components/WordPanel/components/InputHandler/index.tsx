import KeyEventHandler from '../KeyEventHandler'
// import { useTypingConfigStore } from '@/store/typing'
import type { FormEvent } from 'react'

export default function InputHandler({ updateInput }: { updateInput: (updateObj: WordUpdateAction) => void }) {
  // 直接用 zustand 获取 currentDictInfo，如果未来需要可用
  // const currentDictInfo = useTypingConfigStore(s => s.currentDictInfo)
  // 目前统一用 KeyEventHandler
  return <KeyEventHandler updateInput={updateInput} />
}

export type WordUpdateAction = WordAddAction | WordDeleteAction | WordCompositionAction

export type WordAddAction = {
  type: 'add'
  value: string
  event: FormEvent<HTMLTextAreaElement> | KeyboardEvent
  letterTimeArray: number[]
}

export type WordDeleteAction = {
  type: 'delete'
  length: number
  letterTimeArray: number[]
}

// composition api is not ready yet
export type WordCompositionAction = {
  type: 'composition'
  value: string
  letterTimeArray: number[]
}

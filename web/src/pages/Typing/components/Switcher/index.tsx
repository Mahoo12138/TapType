import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTypingConfigStore } from '@/store/typing'
import { CTRL } from '@/utils'
import { Languages, Moon, Sun } from 'lucide-react'
import { useContext } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { TypingContext, TypingStateActionType } from '../../store'
import AnalysisButton from '../AnalysisButton'
import ErrorBookButton from '../ErrorBookButton'
import HandPositionIllustration from '../HandPositionIllustration'
import LoopWordSwitcher from '../LoopWordSwitcher'
import Setting from '../Setting'
import SoundSwitcher from '../SoundSwitcher'
import WordDictationSwitcher from '../WordDictationSwitcher'

export default function Switcher() {
  const isOpenDarkMode = useTypingConfigStore((s) => s.isOpenDarkMode)
  const setIsOpenDarkMode = useTypingConfigStore((s) => s.setIsOpenDarkMode)
  const { state, dispatch } = useContext(TypingContext) ?? {}

  const changeDarkModeState = () => {
    setIsOpenDarkMode(!isOpenDarkMode)
  }

  const changeTransVisibleState = () => {
    if (dispatch) {
      dispatch({ type: TypingStateActionType.TOGGLE_TRANS_VISIBLE })
    }
  }

  useHotkeys(
    'ctrl+shift+v',
    () => {
      changeTransVisibleState()
    },
    { enableOnFormTags: true, preventDefault: true },
    [],
  )

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <SoundSwitcher />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>音效设置</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-7 w-7 items-center justify-center">
              <LoopWordSwitcher />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>设置单个单词循环</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-7 w-7 items-center justify-center">
              <WordDictationSwitcher />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{`开关默写模式（${CTRL} + V）`}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`flex h-7 w-7 items-center justify-center rounded p-[2px] text-lg outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none ${
                state?.isTransVisible ? 'text-indigo-500' : 'text-gray-500'
              }`}
              type="button"
              onClick={(e) => {
                changeTransVisibleState()
                e.currentTarget.blur()
              }}
              aria-label={`开关释义显示（${CTRL} + Shift + V）`}
            >
              <Languages className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{`开关释义显示（${CTRL} + Shift + V）`}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <ErrorBookButton />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>错题本</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-7 w-7 items-center justify-center">
              <AnalysisButton />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>查看数据统计</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex h-7 w-7 items-center justify-center rounded p-[2px] text-lg text-indigo-500 outline-none transition-colors duration-300 ease-in-out hover:bg-indigo-400 hover:text-white focus:outline-none"
              type="button"
              onClick={(e) => {
                changeDarkModeState()
                e.currentTarget.blur()
              }}
              aria-label="开关深色模式"
            >
              {isOpenDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>开关深色模式</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-7 w-7 items-center justify-center">
              <HandPositionIllustration />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>指法图示</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Setting />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>设置</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

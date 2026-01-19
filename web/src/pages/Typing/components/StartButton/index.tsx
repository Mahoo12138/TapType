import { TypingContext, TypingStateActionType } from '../../store'
import { useTypingConfigStore } from '@/store/typing'
import { autoUpdate, offset, useFloating, useHover, useInteractions } from '@floating-ui/react'
import { useCallback, useContext, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function StartButton({ isLoading }: { isLoading: boolean }) {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!
  const randomConfig = useTypingConfigStore((s) => s.randomConfig)

  const onToggleIsTyping = useCallback(() => {
    !isLoading && dispatch({ type: TypingStateActionType.TOGGLE_IS_TYPING })
  }, [isLoading, dispatch])

  const onClickRestart = useCallback(() => {
    dispatch({ type: TypingStateActionType.REPEAT_CHAPTER, shouldShuffle: randomConfig.isOpen })
  }, [dispatch, randomConfig.isOpen])

  useHotkeys('enter', onToggleIsTyping, { enableOnFormTags: true, preventDefault: true }, [onToggleIsTyping])

  const [isShowReStartButton, setIsShowReStartButton] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open: isShowReStartButton,
    onOpenChange: setIsShowReStartButton,
    whileElementsMounted: autoUpdate,
    middleware: [offset(5)],
  })
  const hoverButton = useHover(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([hoverButton])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={refs.setReference}
            {...getReferenceProps()}
            className={`${
              state.isTyping
                ? 'bg-gray-400 shadow-gray-200 dark:bg-gray-600  dark:shadow-none'
                : 'bg-indigo-500 shadow-indigo-300 dark:shadow-indigo-500/60'
            } ${
              isShowReStartButton ? 'h-20' : 'h-auto'
            } flex-column absolute left-0 top-0 w-20 rounded-lg shadow-lg transition-colors duration-200 z-10`}
          >
            <button
              className={`${
                state.isTyping ? 'bg-gray-400  dark:bg-gray-700 dark:hover:bg-gray-500' : 'bg-indigo-500'
              } flex h-7 w-20 items-center justify-center rounded shadow outline-none transition-colors duration-200`}
              type="button"
              onClick={onToggleIsTyping}
              aria-label={state.isTyping ? '暂停' : '开始'}
            >
              <span className="font-medium text-white text-sm">{state.isTyping ? 'Pause' : 'Start'}</span>
            </button>
            {isShowReStartButton && (
              <div
                className="absolute bottom-0 flex w-20 justify-center"
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
              >
                <button
                  className={`${
                    state.isTyping ? 'bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-500 ' : 'bg-indigo-400 '
                  } mb-1 mt-1 w-18 flex h-6 items-center justify-center rounded text-xs text-white transition-colors duration-200 outline-none`}
                  type="button"
                  onClick={onClickRestart}
                  aria-label={'重新开始'}
                >
                  Restart
                </button>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="box-content h-7 w-auto px-3 py-1">
          <p>{`${state.isTyping ? '暂停' : '开始'} （Enter）`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

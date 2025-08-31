import { TypingContext, TypingStateActionType } from '../../store'
import { useTypingConfigStore } from '@/store/typing'
import { CTRL } from '@/utils'
import { useCallback, useContext, useMemo } from 'react'
import { ArrowLeft as IconPrev, ArrowRight as IconNext } from 'lucide-react'
import { Box, Typography, Tooltip } from '@mui/joy'

export default function PrevAndNextWord({ type }: LastAndNextWordProps) {
  const { state, dispatch } = useContext(TypingContext)!

  // 迁移 jotai 状态到 zustand
  const wordDictationConfig = useTypingConfigStore(s => s.wordDictationConfig)
  const currentDictInfo = useTypingConfigStore(s => s.currentDictInfo)
  const currentLanguage = currentDictInfo?.language || 'en'

  const newIndex = useMemo(() => state.chapterData.index + (type === 'prev' ? -1 : 1), [state.chapterData.index, type])
  const word = state.chapterData.words[newIndex]
  const shortCutKey = useMemo(() => (type === 'prev' ? `${CTRL} + Shift + ArrowLeft` : `${CTRL} + Shift + ArrowRight`), [type])

  const onClickWord = useCallback(() => {
    if (!word) return
    dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex })
  }, [type, dispatch, newIndex, word])

  const headWord = useMemo(() => {
    if (!word) return ''
    const showWord = ['romaji', 'hapin'].includes(currentLanguage) ? word.notation || '' : word.name
    if (type === 'prev') return showWord
    if (type === 'next') {
      return !wordDictationConfig.isOpen ? showWord : (showWord || '').replace(/./g, '_')
    }
    return ''
  }, [word, currentLanguage, type, wordDictationConfig.isOpen])

  return (
    <>
      {word ? (
        <Tooltip title={`快捷键: ${shortCutKey}`}>
          <Box
            onClick={onClickWord}
            sx={{
              display: 'flex',
              maxWidth: 320,
              cursor: 'pointer',
              userSelect: 'none',
              alignItems: 'center',
              color: 'text.secondary',
              opacity: 0.6,
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 1 },
            }}
          >
            {type === 'prev' && <IconPrev style={{ marginRight: 16, fontSize: 24, flexShrink: 0 }} />}
            <Box sx={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: type === 'next' ? 'flex-end' : 'flex-start', textAlign: type === 'next' ? 'right' : 'left', mx: 2 }}>
              <Typography
                level="body-lg"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: 24,
                  fontWeight: 400,
                  color: 'text.secondary',
                  letterSpacing: !wordDictationConfig.isOpen ? 'normal' : '0.2em',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {headWord}
              </Typography>
              {state.isTransVisible && (
                <Typography level="body-sm" sx={{ maxWidth: '100%', color: 'text.tertiary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {word.trans.join('；')}
                </Typography>
              )}
            </Box>
            {type === 'next' && <IconNext style={{ marginLeft: 16, fontSize: 24, flexShrink: 0 }} />}
          </Box>
        </Tooltip>
      ) : (
        <Box />
      )}
    </>
  )
}

export type LastAndNextWordProps = {
  /** 上一个单词还是下一个单词 */
  type: 'prev' | 'next'
}

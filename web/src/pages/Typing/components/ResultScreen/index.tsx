import { TypingContext, TypingStateActionType } from "../../store";
// import ShareButton from "../ShareButton";
import ConclusionBar from "./ConclusionBar";
import RemarkRing from "./RemarkRing";
import WordChip from "./WordChip";
import styles from "./index.module.css";
import type { InfoPanelType } from "@/typings";
import { useCallback, useContext, useEffect, useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "@tanstack/react-router";
import { 
  Tooltip, 
  Box, 
  Typography, 
  Button, 
  Modal, 
  Stack,
  IconButton
} from '@mui/joy';
import { Import, Coffee, Github, X } from 'lucide-react';
import { useTypingConfigStore } from '@/store/typing';

const ResultScreen = () => {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!;

  const {
    wordDictationConfig,
    currentDictInfo,
    currentChapter,
    infoPanelState,
    randomConfig,
    reviewModeInfo,
    setWordDictationConfig,
    setCurrentChapter,
    setInfoPanelState,
    setReviewModeInfo,
  } = useTypingConfigStore();

  const navigate = useNavigate();

  useEffect(() => {
    // tick a zero timer to calc the stats
    dispatch({ type: TypingStateActionType.TICK_TIMER, addTime: 0 });
  }, [dispatch]);

  const exportWords = useCallback(() => {
    const { words, userInputLogs } = state.chapterData;
    const exportData = userInputLogs.map((log) => {
      const word = words[log.index];
      const wordName = word.name;
      return {
        ...word,
        trans: word.trans.join(";"),
        correctCount: log.correctCount,
        wrongCount: log.wrongCount,
        wrongLetters: Object.entries(log.LetterMistakes)
          .map(
            ([key, mistakes]) => `${wordName[Number(key)]}:${mistakes.length}`
          )
          .join(";"),
      };
    });

    import("xlsx")
      .then(({ utils, writeFileXLSX }) => {
        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Data");
        writeFileXLSX(
          wb,
          `${currentDictInfo?.name}第${currentChapter + 1}章.xlsx`
        );
      })
      .catch(() => {
        console.log("写入 xlsx 模块导入失败");
      });
  }, [currentChapter, currentDictInfo?.name, state.chapterData]);

  const wrongWords = useMemo(() => {
    return state.chapterData.userInputLogs
      .filter((log) => log.wrongCount > 0)
      .map((log) => state.chapterData.words[log.index])
      .filter((word) => word !== undefined);
  }, [state.chapterData.userInputLogs, state.chapterData.words]);

  const isLastChapter = useMemo(() => {
    return currentDictInfo
      ? currentChapter >= currentDictInfo.chapterCount - 1
      : 0;
  }, [currentChapter, currentDictInfo]);

  const correctRate = useMemo(() => {
    const chapterLength = state.chapterData.words.length;
    const correctCount = chapterLength - wrongWords.length;
    return Math.floor((correctCount / chapterLength) * 100);
  }, [state.chapterData.words.length, wrongWords.length]);

  const mistakeLevel = useMemo(() => {
    if (correctRate >= 85) {
      return 0;
    } else if (correctRate >= 70) {
      return 1;
    } else {
      return 2;
    }
  }, [correctRate]);

  const timeString = useMemo(() => {
    const seconds = state.timerData.time;
    const minutes = Math.floor(seconds / 60);
    const minuteString = minutes < 10 ? "0" + minutes : minutes + "";
    const restSeconds = seconds % 60;
    const secondString =
      restSeconds < 10 ? "0" + restSeconds : restSeconds + "";
    return `${minuteString}:${secondString}`;
  }, [state.timerData.time]);

  const repeatButtonHandler = useCallback(async () => {
    if (reviewModeInfo.isReviewMode) {
      return;
    }

    setWordDictationConfig({
      ...wordDictationConfig,
      isOpen: wordDictationConfig.openBy === "auto" ? false : wordDictationConfig.isOpen,
    });
    dispatch({
      type: TypingStateActionType.REPEAT_CHAPTER,
      shouldShuffle: randomConfig.isOpen,
    });
  }, [reviewModeInfo.isReviewMode, setWordDictationConfig, wordDictationConfig, dispatch, randomConfig.isOpen]);

  const dictationButtonHandler = useCallback(async () => {
    if (reviewModeInfo.isReviewMode) {
      return;
    }

    setWordDictationConfig({ ...wordDictationConfig, isOpen: true, openBy: "auto" });
    dispatch({
      type: TypingStateActionType.REPEAT_CHAPTER,
      shouldShuffle: randomConfig.isOpen,
    });
  }, [reviewModeInfo.isReviewMode, setWordDictationConfig, wordDictationConfig, dispatch, randomConfig.isOpen]);

  const nextButtonHandler = useCallback(() => {
    if (reviewModeInfo.isReviewMode) {
      return;
    }

    setWordDictationConfig({
      ...wordDictationConfig,
      isOpen: wordDictationConfig.openBy === "auto" ? false : wordDictationConfig.isOpen,
    });
    if (!isLastChapter) {
      setCurrentChapter(currentChapter + 1);
      dispatch({ type: TypingStateActionType.NEXT_CHAPTER });
    }
  }, [
    dispatch,
    isLastChapter,
    reviewModeInfo.isReviewMode,
    setCurrentChapter,
    currentChapter,
    setWordDictationConfig,
    wordDictationConfig,
  ]);

  const exitButtonHandler = useCallback(() => {
    if (reviewModeInfo.isReviewMode) {
      setCurrentChapter(0);
      setReviewModeInfo((old) => ({ ...old, isReviewMode: false }));
    } else {
      dispatch({
        type: TypingStateActionType.REPEAT_CHAPTER,
        shouldShuffle: false,
      });
    }
  }, [dispatch, reviewModeInfo.isReviewMode, setCurrentChapter, setReviewModeInfo]);

  const onNavigateToGallery = useCallback(() => {
    setCurrentChapter(0);
    setReviewModeInfo((old) => ({ ...old, isReviewMode: false }));
    navigate({ to: "/dictionary" });
  }, [navigate, setCurrentChapter, setReviewModeInfo]);

  useHotkeys(
    "enter",
    () => {
      nextButtonHandler();
    },
    { preventDefault: true }
  );

  useHotkeys(
    "space",
    (e) => {
      // 火狐浏览器的阻止事件无效，会导致按空格键后 再次输入正确的第一个字母会报错
      e.stopPropagation();
      repeatButtonHandler();
    },
    { preventDefault: true }
  );

  useHotkeys(
    "shift+enter",
    () => {
      dictationButtonHandler();
    },
    { preventDefault: true }
  );

  const handleOpenInfoPanel = useCallback(
    (modalType: InfoPanelType) => {
      // recordOpenInfoPanelAction(modalType, "resultScreen");
      setInfoPanelState((state) => ({ ...state, [modalType]: true }));
    },
    [setInfoPanelState]
  );

  return (
    <Modal
      open={true}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '90vw',
          maxWidth: '72rem',
          bgcolor: 'background.surface',
          borderRadius: '24px',
          boxShadow: 24,
          p: 3,
          outline: 'none',
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ textAlign: 'center', position: 'relative' }}>
            <Typography level="h4" sx={{ color: 'text.primary' }}>
              {`${currentDictInfo?.name} ${reviewModeInfo.isReviewMode ? "错题复习" : "第" + (currentChapter + 1) + "章"}`}
            </Typography>
            <IconButton
              onClick={exitButtonHandler}
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                color: 'text.secondary',
              }}
            >
              <X />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, overflow: 'hidden' }}>
            <Stack spacing={1.5} sx={{ flexShrink: 0, px: 1 }}>
              <RemarkRing
                remark={`${state.timerData.accuracy}%`}
                caption="正确率"
                percentage={state.timerData.accuracy}
              />
              <RemarkRing remark={timeString} caption="章节耗时" />
              <RemarkRing remark={state.timerData.wpm + ""} caption="WPM" />
            </Stack>

            <Box
              sx={{
                flex: 1,
                ml: 3,
                borderRadius: '12px',
                bgcolor: 'primary.50',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  p: 2,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  alignContent: 'flex-start',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '3px',
                  },
                }}
              >
                {wrongWords.map((word, index) => (
                  <WordChip key={`${index}-${word.name}`} word={word} />
                ))}
              </Box>
              <Box
                sx={{
                  bgcolor: 'primary.200',
                  borderRadius: '0 0 12px 12px',
                  p: 1,
                  flexShrink: 0,
                }}
              >
                <ConclusionBar
                  mistakeLevel={mistakeLevel}
                  mistakeCount={wrongWords.length}
                />
              </Box>
            </Box>

            <Stack spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
              {!reviewModeInfo.isReviewMode && (
                <>
                  {/* <ShareButton />
                  <IconButton
                    onClick={exportWords}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Import fontSize={18} />
                  </IconButton> */}
                </>
              )}
              <IconButton
                onClick={(e) => {
                  handleOpenInfoPanel("donate");
                  e.currentTarget.blur();
                }}
                sx={{ color: 'text.secondary' }}
              >
                <Coffee
                  fontSize={17}
                  // className={styles.imgShake}
                />
              </IconButton>
              <IconButton
                component="a"
                href="https://github.com/mahoo12138/qwerty-learner-next"
                target="_blank"
                rel="noreferrer"
                sx={{ color: 'text.secondary' }}
              >
                <Github fontSize={16} />
              </IconButton>
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, px: 2.5 }}>
            {!reviewModeInfo.isReviewMode && (
              <>
                <Tooltip title="快捷键：shift + enter">
                  <Button
                    variant="outlined"
                    onClick={dictationButtonHandler}
                    sx={{ height: '48px' }}
                  >
                    默写本章节
                  </Button>
                </Tooltip>
                <Tooltip title="快捷键：space">
                  <Button
                    variant="outlined"
                    onClick={repeatButtonHandler}
                    sx={{ height: '48px' }}
                  >
                    重复本章节
                  </Button>
                </Tooltip>
              </>
            )}
            {!isLastChapter && !reviewModeInfo.isReviewMode && (
              <Tooltip title="快捷键：enter">
                <Button
                  variant="solid"
                  onClick={nextButtonHandler}
                  sx={{ height: '48px', fontWeight: 'bold' }}
                >
                  下一章节
                </Button>
              </Tooltip>
            )}

            {reviewModeInfo.isReviewMode && (
              <Button
                variant="solid"
                onClick={onNavigateToGallery}
                sx={{ height: '48px', fontWeight: 'bold' }}
              >
                练习其他章节
              </Button>
            )}
          </Box>
        </Stack>
      </Box>
    </Modal>
  );
};

export default ResultScreen;

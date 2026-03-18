import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTypingConfigStore } from '@/store/typing';
import type { InfoPanelType } from "@/typings";
import { useNavigate } from "@tanstack/react-router";
import { Coffee, Github, RotateCcw, X } from 'lucide-react';
import { useCallback, useContext, useEffect, useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { TypingContext, TypingStateActionType } from "../../store";
import ConclusionBar from "./ConclusionBar";
import RemarkRing from "./RemarkRing";
import WordChip from "./WordChip";

const ResultScreen = () => {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!;

  const {
    wordDictationConfig,
    currentDictInfo,
    currentChapter,
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

  // Export functionality removed or needs re-implementation without xlsx if desired, 
  // or keep it if xlsx is installed. The original code had dynamic import.
  // I will keep it commented out or remove it as it was commented out in the UI in the original file.
  // Original file lines 323-332 were commented out:
  // {/* <ShareButton /> <IconButton ...> ... </IconButton> */}
  // So I will ignore export for now.

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
      setReviewModeInfo({ ...reviewModeInfo, isReviewMode: false });
    } else {
      dispatch({
        type: TypingStateActionType.REPEAT_CHAPTER,
        shouldShuffle: false,
      });
    }
  }, [dispatch, reviewModeInfo, setCurrentChapter, setReviewModeInfo]);

  const onNavigateToGallery = useCallback(() => {
    setCurrentChapter(0);
    setReviewModeInfo({ ...reviewModeInfo, isReviewMode: false });
    navigate({ to: "/dictionary" });
  }, [navigate, setCurrentChapter, setReviewModeInfo, reviewModeInfo]);

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
      setInfoPanelState({ ...infoPanelState, [modalType]: true }); // Fixed spread
    },
    [setInfoPanelState, infoPanelState]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative flex w-[90vw] max-w-[72rem] flex-col gap-6 rounded-3xl bg-card p-6 shadow-xl outline-none border border-border">
        
        {/* Header */}
        <div className="relative text-center">
          <h4 className="text-2xl font-bold text-foreground">
            {`${currentDictInfo?.name} ${reviewModeInfo.isReviewMode ? "错题复习" : "第" + (currentChapter + 1) + "章"}`}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            onClick={exitButtonHandler}
            className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex gap-4 overflow-hidden">
          {/* Stats Column */}
          <div className="flex flex-shrink-0 flex-col gap-4 px-2">
            <RemarkRing
              remark={`${state.timerData.accuracy}%`}
              caption="正确率"
              percentage={state.timerData.accuracy}
            />
            <RemarkRing remark={timeString} caption="章节耗时" />
            <RemarkRing remark={state.timerData.wpm + ""} caption="WPM" />
          </div>

          {/* Words & Conclusion Column */}
          <div className="flex flex-1 flex-col ml-6 overflow-hidden rounded-xl bg-primary/10">
            <div className="flex flex-1 flex-wrap content-start gap-2 overflow-x-hidden overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20">
              {wrongWords.map((word, index) => (
                <WordChip key={`${index}-${word.name}`} word={word} />
              ))}
            </div>
            <div className="flex-shrink-0 bg-primary/20 p-2 rounded-b-xl">
              <ConclusionBar
                mistakeLevel={mistakeLevel}
                mistakeCount={wrongWords.length}
              />
            </div>
          </div>

          {/* Actions Column */}
          <div className="flex flex-col items-center justify-end gap-3">
             {/* Social / Donate Buttons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                handleOpenInfoPanel("donate");
                e.currentTarget.blur();
              }}
              className="text-muted-foreground hover:text-foreground hover:animate-pulse"
            >
              <Coffee className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <a
                href="https://github.com/mahoo12138/qwerty-learner-next"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-center gap-6 px-6">
          {!reviewModeInfo.isReviewMode && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={dictationButtonHandler}
                      className="h-12"
                    >
                      默写本章节
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>快捷键：shift + enter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={repeatButtonHandler}
                      className="h-12"
                    >
                      重复本章节
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>快捷键：space</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          {!isLastChapter && !reviewModeInfo.isReviewMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={nextButtonHandler}
                    className="h-12 font-bold"
                  >
                    下一章节
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>快捷键：enter</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {reviewModeInfo.isReviewMode && (
            <Button
              onClick={onNavigateToGallery}
              className="h-12 font-bold"
            >
              练习其他章节
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;

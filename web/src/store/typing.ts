import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { defaultFontSizeConfig } from '@/constants';
import {
  correctSoundResources,
  keySoundResources,
  wrongSoundResources,
} from '@/resources/soundResource';
import type {
  InfoPanelState,
  LoopWordTimesOption,
  PhoneticType,
  PronunciationType,
  SoundResource,
  WordDictationOpenBy,
  WordDictationType,
} from '@/typings';
// import { putWordReviewRecord } from '@/utils/db/review-record';

export interface LoopWordConfig {
  times: LoopWordTimesOption;
}

export interface KeySoundsConfig {
  isOpen: boolean;
  isOpenClickSound: boolean;
  volume: number;
  resource: SoundResource;
}

export interface HintSoundsConfig {
  isOpen: boolean;
  volume: number;
  isOpenWrongSound: boolean;
  isOpenCorrectSound: boolean;
  wrongResource: SoundResource;
  correctResource: SoundResource;
}

export interface PronunciationConfig {
  isOpen: boolean;
  volume: number;
  type: PronunciationType;
  name: string;
  isLoop: boolean;
  isTransRead: boolean;
  transVolume: number;
  rate: number;
}

export interface RandomConfig {
  isOpen: boolean;
}

export interface WordDictationConfig {
  isOpen: boolean;
  type: WordDictationType;
  openBy: WordDictationOpenBy;
}

export interface ReviewModeInfo {
  isReviewMode: boolean;
  reviewRecord?: any;
}

export interface TypingConfigState {
  loopWordConfig: LoopWordConfig;
  keySoundsConfig: KeySoundsConfig;
  hintSoundsConfig: HintSoundsConfig;
  pronunciationConfig: PronunciationConfig;
  fontSizeConfig: typeof defaultFontSizeConfig;
  randomConfig: RandomConfig;
  isShowPrevAndNextWord: boolean;
  isIgnoreCase: boolean;
  isShowAnswerOnHover: boolean;
  isTextSelectable: boolean;
  reviewModeInfo: ReviewModeInfo;
  phoneticConfig: { isOpen: boolean; type: PhoneticType };
  isOpenDarkMode: boolean;
  isShowSkip: boolean;
  isInDevMode: boolean;
  infoPanelState: InfoPanelState;
  wordDictationConfig: WordDictationConfig;
  dismissStartCardDate: Date | null;

  // Actions
  setLoopWordConfig: (config: Partial<LoopWordConfig>) => void;
  setKeySoundsConfig: (config: Partial<KeySoundsConfig>) => void;
  setHintSoundsConfig: (config: Partial<HintSoundsConfig>) => void;
  setPronunciationConfig: (config: Partial<PronunciationConfig>) => void;
  setFontSizeConfig: (config: typeof defaultFontSizeConfig) => void;
  setRandomConfig: (config: Partial<RandomConfig>) => void;
  setIsShowPrevAndNextWord: (val: boolean) => void;
  setIsIgnoreCase: (val: boolean) => void;
  setIsShowAnswerOnHover: (val: boolean) => void;
  setIsTextSelectable: (val: boolean) => void;
  setReviewModeInfo: (info: Partial<ReviewModeInfo>) => void;
  setPhoneticConfig: (config: Partial<{ isOpen: boolean; type: PhoneticType }>) => void;
  setIsOpenDarkMode: (val: boolean) => void;
  setIsShowSkip: (val: boolean) => void;
  setIsInDevMode: (val: boolean) => void;
  setInfoPanelState: (state: Partial<InfoPanelState>) => void;
  setWordDictationConfig: (config: Partial<WordDictationConfig>) => void;
  setDismissStartCardDate: (date: Date | null) => void;
}

export const useTypingConfigStore = create<TypingConfigState>()(
  persist(
    immer((set) => ({
      loopWordConfig: { times: 1 },
      keySoundsConfig: {
        isOpen: true,
        isOpenClickSound: true,
        volume: 1,
        resource: keySoundResources[0],
      },
      hintSoundsConfig: {
        isOpen: true,
        volume: 1,
        isOpenWrongSound: true,
        isOpenCorrectSound: true,
        wrongResource: wrongSoundResources[0],
        correctResource: correctSoundResources[0],
      },
      pronunciationConfig: {
        isOpen: true,
        volume: 1,
        type: "us",
        name: "美音",
        isLoop: false,
        isTransRead: false,
        transVolume: 1,
        rate: 1,
      },
      fontSizeConfig: defaultFontSizeConfig,
      randomConfig: { isOpen: false },
      isShowPrevAndNextWord: true,
      isIgnoreCase: true,
      isShowAnswerOnHover: true,
      isTextSelectable: false,
      reviewModeInfo: {
        isReviewMode: false,
        reviewRecord: undefined,
      },
      phoneticConfig: {
        isOpen: true,
        type: "us",
      },
      isOpenDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
      isShowSkip: false,
      isInDevMode: false,
      infoPanelState: {
        donate: false,
        vsc: false,
        community: false,
        redBook: false,
      },
      wordDictationConfig: {
        isOpen: false,
        type: "hideAll",
        openBy: "auto",
      },
      dismissStartCardDate: null,

      setLoopWordConfig: (config) => set((state) => { Object.assign(state.loopWordConfig, config); }),
      setKeySoundsConfig: (config) => set((state) => { Object.assign(state.keySoundsConfig, config); }),
      setHintSoundsConfig: (config) => set((state) => { Object.assign(state.hintSoundsConfig, config); }),
      setPronunciationConfig: (config) => set((state) => { Object.assign(state.pronunciationConfig, config); }),
      setFontSizeConfig: (config) => set((state) => { state.fontSizeConfig = config; }),
      setRandomConfig: (config) => set((state) => { Object.assign(state.randomConfig, config); }),
      setIsShowPrevAndNextWord: (val) => set((state) => { state.isShowPrevAndNextWord = val; }),
      setIsIgnoreCase: (val) => set((state) => { state.isIgnoreCase = val; }),
      setIsShowAnswerOnHover: (val) => set((state) => { state.isShowAnswerOnHover = val; }),
      setIsTextSelectable: (val) => set((state) => { state.isTextSelectable = val; }),
      setReviewModeInfo: (info) => set((state) => {
        Object.assign(state.reviewModeInfo, info);
        if (state.reviewModeInfo.reviewRecord?.id) {
            // putWordReviewRecord(state.reviewModeInfo.reviewRecord);
        }
      }),
      setPhoneticConfig: (config) => set((state) => { Object.assign(state.phoneticConfig, config); }),
      setIsOpenDarkMode: (val) => set((state) => { state.isOpenDarkMode = val; }),
      setIsShowSkip: (val) => set((state) => { state.isShowSkip = val; }),
      setIsInDevMode: (val) => set((state) => { state.isInDevMode = val; }),
      setInfoPanelState: (partial) => set((state) => { Object.assign(state.infoPanelState, partial); }),
      setWordDictationConfig: (config) => set((state) => { Object.assign(state.wordDictationConfig, config); }),
      setDismissStartCardDate: (date) => set((state) => { state.dismissStartCardDate = date; }),
    })),
    {
      name: 'typing-config',
      partialize: (state) => {
          // Exclude non-persisted states
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isShowSkip, isInDevMode, ...persisted } = state;
          return persisted;
      },
      merge: (persistedState: any, currentState) => {
        if (!persistedState) return currentState;
        const merged = { ...currentState, ...persistedState };
        const objectKeys: (keyof TypingConfigState)[] = [
            'loopWordConfig',
            'keySoundsConfig',
            'hintSoundsConfig',
            'pronunciationConfig',
            'randomConfig',
            'phoneticConfig',
            'wordDictationConfig',
        ];
        objectKeys.forEach(key => {
            if (persistedState[key] && currentState[key]) {
                // @ts-ignore
                merged[key] = { ...currentState[key], ...persistedState[key] };
            }
        });
        return merged;
      }
    }
  )
);

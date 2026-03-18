import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dictionary } from '@/typings';

export interface DictState {
  currentDictId: string;
  publicDictList: Dictionary[];
  currentChapter: number;
  
  setCurrentDictId: (id: string) => void;
  setPublicDictList: (list: Dictionary[]) => void;
  setCurrentChapter: (chapter: number) => void;
}

export const useDictStore = create<DictState>()(
  persist(
    (set) => ({
      currentDictId: "",
      publicDictList: [],
      currentChapter: 0,
      
      setCurrentDictId: (id) => set({ currentDictId: id }),
      setPublicDictList: (list) => set({ publicDictList: list }),
      setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
    }),
    {
      name: 'dict-storage',
      partialize: (state) => ({ 
        currentDictId: state.currentDictId, 
        currentChapter: state.currentChapter 
      }),
    }
  )
);

export const getCurrentDictInfo = (state: DictState) => {
    const { currentDictId, publicDictList } = state;
    if (!publicDictList || publicDictList.length === 0) return null;
    const currentDict = publicDictList.find((dict) => dict.id === currentDictId);
    return currentDict || publicDictList[0];
};

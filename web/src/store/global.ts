import type { Status } from '@/typings/status';
import type { Appearance, Locale } from '@shared/typings';
import { create } from 'zustand'
import { persist } from 'zustand/middleware'


interface GlobalState {
  locale: Locale
  appearance: Appearance
  isAppInit: boolean;
  status: Status | null;
  setLocale: (locale: Locale) => void
  setAppearance: (appearance: Appearance) => void
  setStatus: (data: Status | null) => void;
  setIsAppInit: (init: boolean) => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      locale: 'en',
      appearance: 'system',
      isAppInit: true,
      status: null,
      setLocale: (locale) => set({ locale }),
      setAppearance: (appearance) => set({ appearance }),
      setStatus: (data) => set({ status: data }),
      setIsAppInit: (init: boolean) => set({ isAppInit: init }),
    }),
    {
      name: 'global-storage',
      partialize: (state) => ({ locale: state.locale, appearance: state.appearance }),
    }
  )
)
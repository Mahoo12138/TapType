import { create } from 'zustand'

interface SettingsState {
  userSettings: Record<string, string>
  isLoaded: boolean

  // Typed getters
  getBool: (key: string) => boolean
  getEnum: (key: string) => string
  getInt: (key: string) => number

  setUserSettings: (settings: Record<string, string>) => void
  updateSetting: (key: string, value: string) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  userSettings: {},
  isLoaded: false,

  getBool: (key) => get().userSettings[key] === 'true',
  getEnum: (key) => get().userSettings[key] ?? '',
  getInt: (key) => parseInt(get().userSettings[key] ?? '0', 10),

  setUserSettings: (settings) => set({ userSettings: settings, isLoaded: true }),

  updateSetting: (key, value) =>
    set((s) => ({ userSettings: { ...s.userSettings, [key]: value } })),

  reset: () => set({ userSettings: {}, isLoaded: false }),
}))

import { create } from 'zustand'

interface ThemeState {
  dark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  dark: localStorage.getItem('theme') === 'dark',

  toggle: () => {
    const next = !get().dark
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
    set({ dark: next })
  },
}))

// Apply on load
if (typeof document !== 'undefined') {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark') {
    document.documentElement.classList.add('dark')
  }
}

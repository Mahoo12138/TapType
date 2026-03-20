import { create } from 'zustand'
import type { User } from '@/types/api'

interface AuthState {
  accessToken: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  logout: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem('access_token'),
  user: (() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { return JSON.parse(stored) as User } catch { return null }
    }
    return null
  })(),

  setAuth: (token: string, user: User) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ accessToken: token, user })
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  setAccessToken: (token: string) => {
    localStorage.setItem('access_token', token)
    set({ accessToken: token })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    set({ accessToken: null, user: null })
  },

  isLoggedIn: () => get().accessToken !== null && get().user !== null,
}))

import { useMutation } from '@tanstack/react-query'
import { request } from './client'
import type { LoginData, RegisterData, User } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'

interface RegisterParams {
  username: string
  email: string
  password: string
}

interface LoginParams {
  username: string
  password: string
}

export function useRegister() {
  return useMutation({
    mutationFn: (params: RegisterParams) =>
      request<RegisterData>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  })
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: (params: LoginParams) =>
      request<LoginData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      setAuth(data.access_token, data.user)
    },
  })
}

export function useMe() {
  return useMutation({
    mutationFn: () => request<User>('/auth/me'),
  })
}

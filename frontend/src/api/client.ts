import { useAuthStore } from '@/stores/authStore'
import type { ApiResponse } from '@/types/api'

const BASE_URL = '/api/v1'

export class ApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = 'ApiError'
  }
}

async function refreshToken(): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  const json: ApiResponse<{ access_token: string }> = await res.json()
  if (json.code !== 0) {
    throw new ApiError(json.code, json.message)
  }
  useAuthStore.getState().setAccessToken(json.data.access_token)
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  const json: ApiResponse<T> = await res.json()

  if (json.code === 40102) {
    // access token expired, try refresh
    try {
      await refreshToken()
      return request(path, init)
    } catch {
      useAuthStore.getState().logout()
      throw new ApiError(40102, 'Session expired')
    }
  }

  if (json.code === 40104 || json.code === 40101) {
    useAuthStore.getState().logout()
    throw new ApiError(json.code, json.message)
  }

  if (json.code !== 0) {
    throw new ApiError(json.code, json.message)
  }

  return json.data
}

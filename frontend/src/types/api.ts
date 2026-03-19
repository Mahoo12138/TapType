// API response types matching backend model/res

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface User {
  id: string
  username: string
  email: string
  role: 'user' | 'admin'
  is_active: number
  created_at: string
}

export interface LoginData {
  access_token: string
  expires_in: number
  user: User
}

export interface RegisterData {
  id: string
  username: string
  email: string
  role: string
}

export interface RefreshData {
  access_token: string
  expires_in: number
}

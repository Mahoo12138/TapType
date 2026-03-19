import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useLogin } from '@/api/auth'
import { usePublicSystemSettings } from '@/api/settings'
import { useAuthStore } from '@/stores/authStore'
import { Keyboard } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const login = useLogin()
  const publicSettings = usePublicSystemSettings(['system.owner_user_id'])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) {
    navigate({ to: '/' })
    return null
  }

  if (publicSettings.isLoading) {
    return null
  }

  const ownerUserID = publicSettings.data?.['system.owner_user_id'] ?? ''
  if (!ownerUserID.trim()) {
    navigate({ to: '/register-admin' })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    login.mutate(
      { username, password },
      {
        onSuccess: () => navigate({ to: '/' }),
        onError: (err) => {
          setError(err.message || '登录失败，请检查用户名和密码')
        },
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Keyboard className="mx-auto h-10 w-10 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            TapType
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">登录你的账户</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
              placeholder="输入用户名或邮箱"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
              placeholder="输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {login.isPending ? '登录中...' : '登录'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            没有账户？{' '}
            <button
              type="button"
              onClick={() => navigate({ to: '/register' })}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              立即注册
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

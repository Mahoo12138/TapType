import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useLogin, useRegisterInitialAdmin } from '@/api/auth'
import { usePublicSystemSettings } from '@/api/settings'
import { Shield, Crown } from 'lucide-react'

export const Route = createFileRoute('/register-admin')({
  component: RegisterAdminPage,
})

function RegisterAdminPage() {
  const navigate = useNavigate()
  const registerAdmin = useRegisterInitialAdmin()
  const login = useLogin()
  const publicSettings = usePublicSystemSettings(['system.owner_user_id'])

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const ownerUserID = publicSettings.data?.['system.owner_user_id'] ?? ''
  if (publicSettings.isSuccess && ownerUserID.trim()) {
    navigate({ to: '/login' })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 8) {
      setError('密码长度至少 8 位')
      return
    }

    registerAdmin.mutate(
      { username, email, password },
      {
        onSuccess: () => {
          login.mutate(
            { username, password },
            {
              onSuccess: () => navigate({ to: '/' }),
              onError: () => navigate({ to: '/login' }),
            },
          )
        },
        onError: (err) => {
          setError(err.message || '站长注册失败')
        },
      },
    )
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            <Crown className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            初始化站点
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">创建首个站长账户（管理员）</p>
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

          <div className="mb-4 flex items-start gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" />
            <span>系统检测到当前没有任何用户，请先完成站长注册后再使用网站。</span>
          </div>

          <div className="mb-4">
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              站长用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
              placeholder="3-20位，字母数字下划线"
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_]+$"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              站长邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="admin@email.com"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="至少 8 位"
              required
              minLength={8}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              placeholder="再次输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={publicSettings.isLoading || registerAdmin.isPending || login.isPending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            {publicSettings.isLoading
              ? '检查系统状态...'
              : registerAdmin.isPending
                ? '创建站长中...'
                : login.isPending
                  ? '自动登录中...'
                  : '创建站长并进入系统'}
          </button>
        </form>
      </div>
    </div>
  )
}

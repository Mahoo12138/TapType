import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { request } from '@/api/client'
import { Settings, Sun, Moon, Lock, User } from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          设置
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          管理你的账户和偏好设置
        </p>
      </div>

      <div className="space-y-6">
        <ProfileSection user={user} />
        <ThemeSection />
        <PasswordSection />
      </div>
    </div>
  )
}

function ProfileSection({ user }: { user: { username: string; email: string; role: string } | null }) {
  if (!user) return null

  return (
    <section className="rounded-xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <User className="h-4 w-4" strokeWidth={1.8} />
        账户信息
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">用户名</p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.username}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">邮箱</p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.email}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">角色</p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {user.role === 'admin' ? '管理员' : '普通用户'}
          </p>
        </div>
      </div>
    </section>
  )
}

function ThemeSection() {
  const dark = useThemeStore((s) => s.dark)
  const toggleTheme = useThemeStore((s) => s.toggle)

  return (
    <section className="rounded-xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Settings className="h-4 w-4" strokeWidth={1.8} />
        外观
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">主题模式</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {dark ? '当前使用深色模式' : '当前使用浅色模式'}
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? '切换为浅色' : '切换为深色'}
        </button>
      </div>
    </section>
  )
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword.length < 8) {
      setError('新密码长度至少 8 位')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      await request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      setMessage('密码修改成功')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改密码失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Lock className="h-4 w-4" strokeWidth={1.8} />
        修改密码
      </div>
      <form onSubmit={handleChangePassword} className="space-y-3">
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            {message}
          </p>
        )}
        <label className="block space-y-1 text-sm">
          <span className="text-slate-500 dark:text-slate-400">当前密码</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-500 dark:text-slate-400">新密码</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            required
            minLength={8}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-500 dark:text-slate-400">确认新密码</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            required
            minLength={8}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {loading ? '修改中...' : '修改密码'}
        </button>
      </form>
    </section>
  )
}


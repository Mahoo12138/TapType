import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useLogin, useRegisterInitialAdmin } from '@/api/auth'
import { usePublicSystemSettings } from '@/api/settings'
import { Shield, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Crown className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            初始化站点
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">创建首个站长账户（管理员）</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>站长注册</CardTitle>
            <CardDescription>系统首次初始化，仅需执行一次。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/15 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-primary/15 px-3 py-2 text-xs text-primary">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" />
            <span>系统检测到当前没有任何用户，请先完成站长注册后再使用网站。</span>
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-foreground">
              站长用户名
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3-20位，字母数字下划线"
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_]+$"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
              站长邮箱
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              密码
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 8 位"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-foreground">
              确认密码
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={publicSettings.isLoading || registerAdmin.isPending || login.isPending}
            className="w-full"
          >
            {publicSettings.isLoading
              ? '检查系统状态...'
              : registerAdmin.isPending
                ? '创建站长中...'
                : login.isPending
                  ? '自动登录中...'
                  : '创建站长并进入系统'}
          </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

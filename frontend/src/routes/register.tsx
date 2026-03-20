import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useRegister, useLogin } from '@/api/auth'
import { usePublicSystemSettings } from '@/api/settings'
import { Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const register = useRegister()
  const login = useLogin()
  const publicSettings = usePublicSystemSettings(['system.owner_user_id'])

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

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

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 8) {
      setError('密码长度至少 8 位')
      return
    }

    register.mutate(
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
          setError(err.message || '注册失败')
        },
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Keyboard className="mx-auto h-10 w-10 text-primary" strokeWidth={1.5} />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            TapType
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">创建新账户</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>注册</CardTitle>
            <CardDescription>填写账户信息，完成后将自动登录。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/15 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-foreground">
              用户名
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
              邮箱
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
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
            disabled={register.isPending || login.isPending}
            className="w-full"
          >
            {register.isPending ? '注册中...' : login.isPending ? '自动登录中...' : '注册'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            已有账户？{' '}
            <Button
              type="button"
              variant="link"
              onClick={() => navigate({ to: '/login' })}
              className="h-auto p-0"
            >
              立即登录
            </Button>
          </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

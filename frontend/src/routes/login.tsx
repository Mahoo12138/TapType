import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useLogin } from '@/api/auth'
import { usePublicSystemSettings } from '@/api/settings'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <Badge variant="outline" className="mb-3 rounded-full px-3 py-1 text-xs tracking-wide uppercase">
            Focused Practice
          </Badge>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Keyboard className="size-6" strokeWidth={1.6} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">TapType</h1>
          <p className="mt-1 text-sm text-muted-foreground">登录你的账户，继续今天的训练</p>
        </div>

        <Card className="border-border/70 shadow-[var(--shadow-card)]">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle>欢迎回来</CardTitle>
            <CardDescription>输入用户名和密码继续使用。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-sm font-medium text-foreground">
                  用户名
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入用户名或邮箱"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  密码
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  required
                />
              </div>

              <Button type="submit" disabled={login.isPending} className="w-full">
                {login.isPending ? '登录中...' : '登录'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                没有账户？{' '}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={() => navigate({ to: '/register' })}
                >
                  立即注册
                </Button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

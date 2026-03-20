import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { request } from '@/api/client'
import { useUpdateProfile } from '@/api/auth'
import {
  useBatchSaveSettings,
  useSaveSystemSetting,
  useSaveUserControl,
  useSettingDefinitions,
  useSystemSettings,
  usePublicSystemSettings,
  useUserControls,
  useUserSettings,
} from '@/api/settings'
import type { SettingDefinitionItem, SettingDefinitionGroup, SystemSettingItem, UserControlItem } from '@/types/api'
import {
  Settings,
  Sun,
  Moon,
  Lock,
  User,
  Server,
  Users,
  SlidersHorizontal,
  KeyRound,
  Shield,
  Check,
  Pencil,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})
type SettingsGroup = {
  key: string
  label: string
  description: string
  icon: LucideIcon
  adminOnly?: boolean
}

function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const [activeGroup, setActiveGroup] = useState('my-account')

  const groups: SettingsGroup[] = [
    { key: 'my-account', label: '我的账号', description: '资料、密码与令牌', icon: User },
    { key: 'preferences', label: '偏好设置', description: '界面与练习习惯', icon: SlidersHorizontal },
    ...(user?.role === 'admin'
      ? [
          {
            key: 'system-management',
            label: '系统管理',
            description: '系统级参数与开关',
            icon: Server,
            adminOnly: true,
          },
          {
            key: 'user-management',
            label: '用户管理',
            description: '配置项权限控制',
            icon: Users,
            adminOnly: true,
          },
        ]
      : []),
  ]

  const currentGroup = groups.find((g) => g.key === activeGroup)

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <Card className="border-border/70 bg-gradient-to-br from-card via-card/95 to-secondary/30 p-5 md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">设置中心</h1>
            <p className="mt-1 text-sm text-muted-foreground">统一管理账户、偏好与系统配置</p>
          </div>
          {user?.role === 'admin' && (
            <Badge variant="secondary" className="rounded-full">
              管理员模式
            </Badge>
          )}
        </div>

        <SettingsTabBar groups={groups} activeGroup={activeGroup} onChange={setActiveGroup} />
      </Card>

      <div className="mt-6 space-y-6">
        {currentGroup && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <currentGroup.icon className="h-4 w-4" strokeWidth={1.8} />
            <span>{currentGroup.description}</span>
          </div>
        )}

        {activeGroup === 'my-account' && (
          <>
            <ProfileSection user={user} />
            <ApiTokenSection />
            <PasswordSection />
          </>
        )}

        {activeGroup === 'preferences' && <PreferenceSection />}

        {activeGroup === 'system-management' && user?.role === 'admin' && <SystemManagementSection />}

        {activeGroup === 'user-management' && user?.role === 'admin' && <UserManagementSection />}
      </div>
    </div>
  )
}

function SettingsTabBar({
  groups,
  activeGroup,
  onChange,
}: {
  groups: SettingsGroup[]
  activeGroup: string
  onChange: (key: string) => void
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-2 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.35)]">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {groups.map((g) => {
          const Icon = g.icon
          const active = activeGroup === g.key

          return (
            <Button
              key={g.key}
              type="button"
              variant="ghost"
              onClick={() => onChange(g.key)}
              className={cn(
                'h-auto min-w-[180px] shrink-0 rounded-lg border px-3 py-2.5 text-left transition-all',
                active
                  ? 'border-primary/40 bg-primary/10 text-foreground shadow-sm'
                  : 'border-transparent bg-transparent text-muted-foreground hover:border-border/80 hover:bg-secondary/50 hover:text-foreground',
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                <span className="text-sm font-medium">{g.label}</span>
                {g.adminOnly && (
                  <Badge variant="outline" className="ml-auto h-5 rounded-full px-2 text-[10px]">
                    ADMIN
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{g.description}</p>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
function PreferenceSection() {
  const { data: definitionsData } = useSettingDefinitions()
  useUserSettings()
  const saveBatch = useBatchSaveSettings()
  const [draft, setDraft] = useState<Record<string, string>>({})

  const groups = definitionsData?.groups ?? []

  const handleSave = () => {
    if (Object.keys(draft).length === 0) return
    saveBatch.mutate(draft, {
      onSuccess: () => {
        setDraft({})
      },
    })
  }

  return (
    <section className="rounded-xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Settings className="h-4 w-4" strokeWidth={1.8} />
        偏好设置
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">暂无可配置偏好项</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <PreferenceGroup
              key={group.key}
              group={group}
              draft={draft}
              onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
            />
          ))}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saveBatch.isPending || Object.keys(draft).length === 0}
            >
              {saveBatch.isPending ? '保存中...' : '保存偏好设置'}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function PreferenceGroup({
  group,
  draft,
  onChange,
}: {
  group: SettingDefinitionGroup
  draft: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  const groupLabelMap: Record<string, string> = {
    display: '显示与外观',
    practice: '打字练习',
    general: '通用',
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {groupLabelMap[group.key] ?? group.key}
      </h3>
      <div className="space-y-3">
        {group.items.map((item) => {
          const value = draft[item.key] ?? item.current_value
          return (
            <SettingField
              key={item.key}
              item={item}
              value={value}
              disabled={!item.is_editable}
              onChange={(v) => onChange(item.key, v)}
            />
          )
        })}
      </div>
    </div>
  )
}

function SettingField({
  item,
  value,
  disabled,
  onChange,
}: {
  item: SettingDefinitionItem
  value: string
  disabled: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-lg border border-slate-200/70 p-3 dark:border-slate-800/70">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
          {item.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
          )}
        </div>
        {!item.is_editable && (
          <Badge variant="secondary">已锁定</Badge>
        )}
      </div>

      {item.type === 'bool' ? (
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <Checkbox
            checked={value === 'true'}
            disabled={disabled}
            onChange={(e) => onChange(String(e.target.checked))}
          />
          启用
        </label>
      ) : item.type === 'enum' ? (
        <Select value={value} disabled={disabled} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(item.enum_options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : item.type === 'int' ? (
        <Input
          type="number"
          value={Number(value || '0')}
          disabled={disabled}
          onChange={(e) => onChange(String(e.target.value))}
        />
      ) : (
        <Input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

function ApiTokenSection() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [copied, setCopied] = useState(false)

  const tokenText = accessToken ?? ''
  const maskedToken = tokenText ? `${tokenText.slice(0, 12)}...${tokenText.slice(-8)}` : '未登录令牌'

  const copyToken = async () => {
    if (!tokenText) return
    await navigator.clipboard.writeText(tokenText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <section className="rounded-xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <KeyRound className="h-4 w-4" strokeWidth={1.8} />
        开放 API Token
      </div>

      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">当前访问令牌（用于调试与 Open API 调用）</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {maskedToken}
        </code>
        <Button
          onClick={copyToken}
          disabled={!tokenText}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
          {copied ? '已复制' : '复制 Token'}
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">后续会支持多 Token 管理、过期时间和权限范围配置。</p>
    </section>
  )
}

function SystemManagementSection() {
  const { data = [] } = useSystemSettings()
  const saveSystem = useSaveSystemSetting()
  const [draft, setDraft] = useState<Record<string, string>>({})

  const grouped = data.reduce<Record<string, SystemSettingItem[]>>((acc, item) => {
    const key = item.group_key || 'general'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const saveOne = (key: string) => {
    const value = draft[key]
    if (value === undefined) return
    saveSystem.mutate({ key, value })
  }

  return (
    <section className="rounded-xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Server className="h-4 w-4" strokeWidth={1.8} />
        系统管理
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">暂无系统设置</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([groupKey, items]) => (
            <div key={groupKey}>
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{groupKey}</h3>
              <div className="space-y-3">
                {items.map((item) => {
                  const current = draft[item.key] ?? item.current_value
                  return (
                    <div key={item.key} className="rounded-lg border border-slate-200/70 p-3 dark:border-slate-800/70">
                      <div className="mb-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="text"
                          value={current}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [item.key]: e.target.value,
                            }))
                          }
                          className="min-w-[260px] flex-1"
                        />
                        <Button
                          onClick={() => saveOne(item.key)}
                          disabled={saveSystem.isPending || draft[item.key] === undefined}
                          size="sm"
                        >
                          保存
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function UserManagementSection() {
  const { data = [] } = useUserControls()
  const saveControl = useSaveUserControl()

  const handleToggle = (item: UserControlItem, patch: Partial<Pick<UserControlItem, 'is_visible' | 'is_editable'>>) => {
    saveControl.mutate({
      key: item.key,
      isVisible: patch.is_visible ?? item.is_visible,
      isEditable: patch.is_editable ?? item.is_editable,
    })
  }

  return (
    <section className="rounded-xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Shield className="h-4 w-4" strokeWidth={1.8} />
        用户管理
      </div>

      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">控制用户设置项的可见与可编辑状态。</p>

      <div className="space-y-2">
        {data.map((item) => (
          <div
            key={item.key}
            className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200/70 p-3 sm:grid-cols-[1fr,auto,auto] sm:items-center dark:border-slate-800/70"
          >
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.key}</p>
            </div>

            <label className="inline-flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
              <Checkbox
                checked={item.is_visible}
                onChange={(e) => handleToggle(item, { is_visible: e.target.checked })}
              />
              可见
            </label>

            <label className="inline-flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
              <Checkbox
                checked={item.is_editable}
                onChange={(e) => handleToggle(item, { is_editable: e.target.checked })}
              />
              可编辑
            </label>
          </div>
        ))}

        {data.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">暂无用户设置控制项</p>}
      </div>

      {saveControl.isPending && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">保存中...</p>}
    </section>
  )
}

function ProfileSection({ user }: { user: { username: string; email: string; role: string } | null }) {
  const updateProfile = useUpdateProfile()
  const { data: publicSystem = {} } = usePublicSystemSettings(['system.allow_username_change'])
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const allowUsernameChange =
    user?.role === 'admin' ||
    (publicSystem['system.allow_username_change'] ?? 'true').trim().toLowerCase() !== 'false'

  const dirty = username !== (user?.username ?? '') || email !== (user?.email ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setMessage('')
    setError('')

    updateProfile.mutate(
      { username, email },
      {
        onSuccess: () => {
          setMessage('账户资料已更新')
          setOpen(false)
        },
        onError: (err) => {
          setError(err.message || '更新失败')
        },
      },
    )
  }

  const reset = () => {
    setUsername(user?.username ?? '')
    setEmail(user?.email ?? '')
    setMessage('')
    setError('')
  }

  const openEditor = () => {
    if (!user) return
    reset()
    setOpen(true)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset()
    }
    setOpen(nextOpen)
  }

  if (!user) return null

  return (
    <section className="rounded-xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <User className="h-4 w-4" strokeWidth={1.8} />
          账户信息
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" onClick={openEditor}>
              <Pencil className="h-4 w-4" />
              编辑资料
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑账户资料</DialogTitle>
              <DialogDescription>修改用户名与邮箱后保存即可生效。</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                  {error}
                </p>
              )}

              <label className="block space-y-1 text-sm">
                <span className="text-slate-500 dark:text-slate-400">用户名</span>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!allowUsernameChange || updateProfile.isPending}
                  minLength={3}
                  maxLength={20}
                  pattern="^[a-zA-Z0-9_]+$"
                  required
                />
                {!allowUsernameChange && user.role !== 'admin' && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    管理员已禁止普通用户修改用户名
                  </span>
                )}
              </label>

              <label className="block space-y-1 text-sm">
                <span className="text-slate-500 dark:text-slate-400">邮箱</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={reset}
                  disabled={!dirty || updateProfile.isPending}
                >
                  重置
                </Button>
                <Button type="submit" disabled={!dirty || updateProfile.isPending}>
                  {updateProfile.isPending ? '保存中...' : '保存资料'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

function PasswordSection() {
  const dark = useThemeStore((s) => s.dark)
  const toggleTheme = useThemeStore((s) => s.toggle)
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
      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-800/50">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">主题模式</p>
          <p>{dark ? '当前使用深色模式' : '当前使用浅色模式'}</p>
        </div>
        <Button
          onClick={toggleTheme}
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? '切换为浅色' : '切换为深色'}
        </Button>
      </div>

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
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-500 dark:text-slate-400">新密码</span>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-500 dark:text-slate-400">确认新密码</span>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? '修改中...' : '修改密码'}
        </Button>
      </form>
    </section>
  )
}


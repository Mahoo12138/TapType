import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { request } from '@/api/client'
import {
  useBatchSaveSettings,
  useSaveSystemSetting,
  useSaveUserControl,
  useSettingDefinitions,
  useSystemSettings,
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
} from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const [activeGroup, setActiveGroup] = useState('my-account')

  const groups = [
    { key: 'my-account', label: '我的账号', icon: User },
    { key: 'preferences', label: '偏好设置', icon: SlidersHorizontal },
    ...(user?.role === 'admin'
      ? [
          { key: 'system-management', label: '系统管理', icon: Server },
          { key: 'user-management', label: '用户管理', icon: Users },
        ]
      : []),
  ]

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          设置
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          管理你的账户和偏好设置
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px,1fr]">
        <aside className="rounded-xl border border-slate-200/60 bg-white/80 p-2 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
          <nav className="space-y-1">
            {groups.map((g) => {
              const Icon = g.icon
              const active = activeGroup === g.key
              return (
                <button
                  key={g.key}
                  onClick={() => setActiveGroup(g.key)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                  <span>{g.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="space-y-6">
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
            <button
              onClick={handleSave}
              disabled={saveBatch.isPending || Object.keys(draft).length === 0}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {saveBatch.isPending ? '保存中...' : '保存偏好设置'}
            </button>
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
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            已锁定
          </span>
        )}
      </div>

      {item.type === 'bool' ? (
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={value === 'true'}
            disabled={disabled}
            onChange={(e) => onChange(String(e.target.checked))}
          />
          启用
        </label>
      ) : item.type === 'enum' ? (
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {(item.enum_options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : item.type === 'int' ? (
        <input
          type="number"
          value={Number(value || '0')}
          disabled={disabled}
          onChange={(e) => onChange(String(e.target.value))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      ) : (
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
        <button
          onClick={copyToken}
          disabled={!tokenText}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
          {copied ? '已复制' : '复制 Token'}
        </button>
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
                        <input
                          type="text"
                          value={current}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [item.key]: e.target.value,
                            }))
                          }
                          className="min-w-[260px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <button
                          onClick={() => saveOne(item.key)}
                          disabled={saveSystem.isPending || draft[item.key] === undefined}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                          保存
                        </button>
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
              <input
                type="checkbox"
                checked={item.is_visible}
                onChange={(e) => handleToggle(item, { is_visible: e.target.checked })}
              />
              可见
            </label>

            <label className="inline-flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
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
        <button
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? '切换为浅色' : '切换为深色'}
        </button>
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


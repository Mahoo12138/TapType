import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
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
import {
  useApiTokens,
  useCreateApiToken,
  useDeleteApiToken,
  useUpdateApiToken,
} from '@/api/openapi'
import type {
  SettingDefinitionItem,
  SettingDefinitionGroup,
  SystemSettingItem,
  User as CurrentUser,
  UserControlItem,
} from '@/types/api'
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
  Camera,
  Loader2,
  Trash2,
  Plus,
  RefreshCw,
  Clock,
  MoreVertical,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

const MAX_AVATAR_SIZE = 256 * 1024

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('无法读取图片文件'))
    }
    image.src = objectUrl
  })
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('图片压缩失败'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality,
    )
  })
}

async function compressAvatarToLimit(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) {
    return file
  }

  const image = await loadImageFromFile(file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('浏览器不支持图片压缩')
  }

  let quality = 0.9
  let scale = 1

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const width = Math.max(64, Math.floor(image.naturalWidth * scale))
    const height = Math.max(64, Math.floor(image.naturalHeight * scale))
    canvas.width = width
    canvas.height = height

    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    const blob = await canvasToBlob(canvas, quality)
    if (blob.size <= maxBytes) {
      const targetName = file.name.replace(/\.[^.]+$/, '') || 'avatar'
      return new File([blob], `${targetName}.jpg`, { type: 'image/jpeg' })
    }

    if (quality > 0.45) {
      quality -= 0.08
    } else {
      scale *= 0.85
    }
  }

  throw new Error('图片压缩后仍超过 256KB，请选择更小的图片')
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

const AVAILABLE_SCOPES = [
  { id: 'user:read', label: '读取个人信息', description: '获取当前用户的基本信息及设置' },
  { id: 'user:write', label: '修改个人信息', description: '修改当前用户的基本信息及设置' },
  { id: 'records:read', label: '读取练习记录', description: '读取打字练习历史及打字统计' },
  { id: 'records:write', label: '写入练习记录', description: '上传新的打字成绩和错题数据' },
  { id: 'words:read', label: '读取词汇数据', description: '读取系统词库、文章库及个人生词本' },
  { id: 'words:write', label: '修改生词本', description: '添加或移出个人生词本中的单词' },
]

function ApiTokenSection() {
  const { data: tokens = [], isLoading } = useApiTokens()
  const createToken = useCreateApiToken()
  const deleteToken = useDeleteApiToken()
  const updateToken = useUpdateApiToken()

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newScopes, setNewScopes] = useState<string[]>(['*'])
  const [newExpires, setNewExpires] = useState<number | null>(null) // 0 or null for never
  
  const [newRawToken, setNewRawToken] = useState<string | null>(null)
  
  const [copiedRaw, setCopiedRaw] = useState(false)
  const [copiedPrefix, setCopiedPrefix] = useState<string | null>(null)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    createToken.mutate(
      {
        name: newName,
        scopes: newScopes.length === 0 ? '' : newScopes.includes('*') ? '*' : newScopes.join(','),
        expires_in: newExpires,
      },
      {
        onSuccess: (data) => {
          setNewRawToken(data.raw_token)
          setNewName('')
          setNewScopes(['*'])
          setNewExpires(null)
          // Intentionally do NOT close modal, user needs to copy the token!
        },
      }
    )
  }

  const handleCloseCreate = (open: boolean) => {
    if (!open) {
      setCreateOpen(false)
      setTimeout(() => setNewRawToken(null), 300)
    } else {
      setCreateOpen(true)
    }
  }

  const handleCopyRaw = async () => {
    if (!newRawToken) return
    await navigator.clipboard.writeText(newRawToken)
    setCopiedRaw(true)
    setTimeout(() => setCopiedRaw(false), 2000)
  }

  const handleCopyPrefix = async (prefix: string) => {
    await navigator.clipboard.writeText(prefix)
    setCopiedPrefix(prefix)
    setTimeout(() => setCopiedPrefix(null), 2000)
  }

  const toggleActive = (id: string, currentActive: number) => {
    updateToken.mutate({ id, is_active: currentActive === 1 ? 0 : 1 })
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个 Token 吗？此操作不可恢复，关联的应用将立即无法访问。')) {
      deleteToken.mutate(id)
    }
  }

  const formatDateTime = (dt: string | null) => {
    if (!dt) return '从未'
    const d = new Date(dt)
    return isNaN(d.getTime()) ? '从未' : d.toLocaleString()
  }

  const isExpired = (dt: string | null) => {
    if (!dt) return false
    const d = new Date(dt)
    return !isNaN(d.getTime()) && d.getTime() < Date.now()
  }

  return (
    <section className="rounded-xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <KeyRound className="h-4 w-4" strokeWidth={1.8} />
          开放 API Token
        </div>
        <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1 rounded-full h-8">
              <Plus className="h-3.5 w-3.5" />
              创建 Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            {newRawToken ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-emerald-600 dark:text-emerald-500 flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Token 创建成功
                  </DialogTitle>
                  <DialogDescription className="text-rose-600 dark:text-rose-400 font-medium">
                    请立即保存您的 Token！出于安全原因，关闭此对话框后您将无法再次看到完整的 Token。
                  </DialogDescription>
                </DialogHeader>
                <div className="my-4 rounded-lg bg-slate-100 dark:bg-slate-900 p-4 font-mono text-sm break-all border border-slate-200 dark:border-slate-800">
                  {newRawToken}
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    onClick={handleCopyRaw}
                    variant={copiedRaw ? 'secondary' : 'default'}
                  >
                    {copiedRaw ? '已复制' : '复制 Token'}
                  </Button>
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    variant="outline"
                    onClick={() => handleCloseCreate(false)}
                  >
                    我已保存，关闭
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>创建新的 API Token</DialogTitle>
                  <DialogDescription>
                    创建一个新的 Token 用于开放 API 访问。每个用户最多可创建 10 个 Token。
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">名称</label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="例如：我的自动化脚本"
                      maxLength={64}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">有效期</label>
                    <Select
                      value={newExpires === null ? 'never' : String(newExpires)}
                      onValueChange={(val) => setNewExpires(val === 'never' ? null : Number(val))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择有效期" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2592000">30天</SelectItem>
                        <SelectItem value="7776000">90天</SelectItem>
                        <SelectItem value="15552000">180天</SelectItem>
                        <SelectItem value="31536000">1年</SelectItem>
                        <SelectItem value="never">永久有效</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">权限范围</label>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="scope-all" 
                          checked={newScopes.includes('*')}
                          onChange={(e) => {
                            setNewScopes(e.target.checked ? ['*'] : [])
                          }}
                        />
                        <label htmlFor="scope-all" className="text-xs text-slate-500 cursor-pointer">
                          全部权限 (*)
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 border rounded-md p-3 max-h-[220px] overflow-y-auto bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800">
                      {AVAILABLE_SCOPES.map(scope => (
                        <div key={scope.id} className="flex items-start space-x-2">
                          <Checkbox 
                            id={`scope-${scope.id}`}
                            checked={newScopes.includes('*') || newScopes.includes(scope.id)}
                            disabled={newScopes.includes('*')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewScopes(prev => [...prev.filter(s => s !== '*'), scope.id])
                              } else {
                                setNewScopes(prev => prev.filter(s => s !== scope.id))
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label htmlFor={`scope-${scope.id}`} className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300">
                              {scope.label}
                            </label>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{scope.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleCloseCreate(false)}>取消</Button>
                    <Button type="submit" disabled={!newName.trim() || createToken.isPending}>
                      {createToken.isPending ? '创建中...' : '生成 Token'}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">管理用于访问开放 API 的访问令牌。将 Token 作为 Bearer 放在 Authorization 请求头中。</p>
      
      {isLoading ? (
        <div className="py-8 flex justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : tokens.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
          <KeyRound className="h-8 w-8 mb-2 opacity-20" />
          <p>您还没有创建任何 API Token</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const expired = isExpired(token.expires_at)
            const active = token.is_active === 1 && !expired
            
            return (
              <div key={token.id} className={cn(
                "rounded-lg border p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center gap-3",
                active ? "border-slate-200/70 bg-slate-50/50 dark:border-slate-800/70 dark:bg-slate-900/50" : "border-slate-200/50 bg-slate-50/20 opacity-70 dark:border-slate-800/50 dark:bg-slate-900/20"
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{token.name}</h4>
                    {expired ? (
                      <Badge variant="destructive" className="text-[10px] h-4 px-1.5 py-0 font-normal">已过期</Badge>
                    ) : token.is_active === 0 ? (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 font-normal">已停用</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 font-normal border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:bg-emerald-950/30">正常</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => handleCopyPrefix(token.prefix)} title="点击复制前缀">
                      {copiedPrefix === token.prefix ? '已复制' : `${token.prefix}••••••••`}
                    </code>
                    <div className="flex flex-wrap gap-1 items-center">
                      {token.scopes === '*' || !token.scopes ? (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 font-normal">全部权限 (*)</Badge>
                      ) : (
                        token.scopes.split(',').filter(Boolean).map(s => {
                          const found = AVAILABLE_SCOPES.find(a => a.id === s.trim())
                          return (
                            <Badge key={s} variant="outline" className="text-[10px] h-4 px-1.5 py-0 font-normal text-slate-500" title={s}>
                              {found ? found.label : s}
                            </Badge>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex sm:flex-col gap-3 sm:gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />过期: {token.expires_at ? formatDateTime(token.expires_at) : '永久'}</div>
                  <div className="flex items-center gap-1.5"><RefreshCw className="h-3 w-3" />使用: {formatDateTime(token.last_used_at)}</div>
                </div>
                
                <div className="flex items-center gap-2 ml-auto mt-2 sm:mt-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => toggleActive(token.id, token.is_active)} disabled={expired}>
                        {token.is_active === 1 ? '停用 Token' : '启用 Token'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(token.id)} className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/30">
                        删除 Token
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}
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

function ProfileSection({ user }: { user: CurrentUser | null }) {
  const updateProfile = useUpdateProfile()
  const setUser = useAuthStore((s) => s.setUser)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data: publicSystem = {} } = usePublicSystemSettings(['system.allow_username_change'])
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!user?.avatar_media_id) {
      setAvatarUrl('')
      return
    }

    const abortController = new AbortController()
    let objectUrl = ''

    const loadAvatar = async () => {
      try {
        const res = await fetch(`/api/v1/media/${user.avatar_media_id}`, {
          method: 'GET',
          credentials: 'include',
          signal: abortController.signal,
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        })
        if (!res.ok) {
          throw new Error('加载头像失败')
        }
        const blob = await res.blob()
        objectUrl = URL.createObjectURL(blob)
        setAvatarUrl(objectUrl)
      } catch {
        setAvatarUrl('')
      }
    }

    void loadAvatar()

    return () => {
      abortController.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [accessToken, user?.avatar_media_id])

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

  const handleAvatarUpload = async (file: File) => {
    if (!user) return
    if (!file.type.startsWith('image/')) {
      setError('仅支持上传图片文件作为头像')
      return
    }

    setError('')
    setMessage('')
    setAvatarUploading(true)

    try {
      const compressedFile = await compressAvatarToLimit(file, MAX_AVATAR_SIZE)
      const form = new FormData()
      form.append('file', compressedFile)

      const data = await request<{ file_id: string; url: string }>('/users/me/avatar', {
        method: 'POST',
        body: form,
      })

      setUser({ ...user, avatar_media_id: data.file_id })
      setMessage(file.size > MAX_AVATAR_SIZE ? '头像上传成功，已自动压缩到 256KB 内' : '头像上传成功')
    } catch (uploadErr) {
      setError(uploadErr instanceof Error ? uploadErr.message : '头像上传失败')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleAvatarDelete = async () => {
    if (!user?.avatar_media_id) return
    setError('')
    setMessage('')
    setAvatarUploading(true)
    try {
      await request<null>('/users/me/avatar', { method: 'DELETE' })
      setUser({ ...user, avatar_media_id: null })
      setMessage('头像已删除')
    } catch (deleteErr) {
      setError(deleteErr instanceof Error ? deleteErr.message : '头像删除失败')
    } finally {
      setAvatarUploading(false)
    }
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
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-14 w-14">
            <AvatarImage src={avatarUrl} alt={`${user.username} avatar`} />
            <AvatarFallback className="text-base">{user.username.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-6">
            <div className="min-w-[160px]">
              <p className="text-xs text-slate-500 dark:text-slate-400">用户名</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.username}</p>
            </div>
            <div className="min-w-[200px]">
              <p className="text-xs text-slate-500 dark:text-slate-400">邮箱</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.email}</p>
            </div>
            <div className="min-w-[120px]">
              <p className="text-xs text-slate-500 dark:text-slate-400">角色</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.role === 'admin' ? '管理员' : '普通用户'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center">
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
                <DialogDescription>支持头像上传，超过 256KB 会自动压缩。</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">{error}</p>
                )}

                <div className="rounded-lg border border-slate-200/70 p-3 dark:border-slate-800/70">
                  <p className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">头像</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={avatarUrl} alt={`${user.username} avatar`} />
                      <AvatarFallback className="text-lg">{user.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-wrap items-center gap-2">
                      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        e.target.value = ''
                        void handleAvatarUpload(file)
                      }} />
                      <Button type="button" variant="outline" size="sm" disabled={avatarUploading || updateProfile.isPending} onClick={() => inputRef.current?.click()}>
                        {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} 上传头像
                      </Button>
                      <Button type="button" variant="outline" size="sm" disabled={!user.avatar_media_id || avatarUploading || updateProfile.isPending} onClick={() => void handleAvatarDelete()}>
                        <Trash2 className="h-4 w-4" /> 删除头像
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">建议使用方形头像，系统会在超过 256KB 时自动压缩。</p>
                </div>

                <label className="block space-y-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">用户名</span>
                  <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!allowUsernameChange || updateProfile.isPending} minLength={3} maxLength={20} pattern="^[a-zA-Z0-9_]+$" required />
                  {!allowUsernameChange && user.role !== 'admin' && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">管理员已禁止普通用户修改用户名</span>
                  )}
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">邮箱</span>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={reset} disabled={!dirty || updateProfile.isPending}>重置</Button>
                  <Button type="submit" disabled={!dirty || updateProfile.isPending}>{updateProfile.isPending ? '保存中...' : '保存资料'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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

